"""ServiceNow REST API source with pagination and sys_created_on filtering."""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from typing import Any

import pandas as pd
import requests

from data_sources.base import TicketDataSource
from data_sources.csv_source import normalize_tickets
from date_utils import snow_query_datetimes
from env_loader import snow_credentials, validate_snow_instance

logger = logging.getLogger("servicenow_kpi.api")

DEFAULT_FIELDS = [
    "number",
    "caller_id",
    "category",
    "opened_at",
    "short_description",
    "description",
    "priority",
    "assigned_to",
    "state",
    "comments",
    "contact_type",
    "sys_created_on",
    "assignment_group",
    "closed_at",
    "resolved_at",
    "calendar_duration",
]


@dataclass
class ServiceNowApiSource(TicketDataSource):
    instance: str
    table: str = "incident"
    username: str | None = None
    password: str | None = None
    token: str | None = None
    query: str | None = None
    period_start: str | None = None
    period_end: str | None = None
    page_size: int = 1000
    fields: list[str] = field(default_factory=lambda: list(DEFAULT_FIELDS))
    fetch_meta: dict[str, Any] = field(default_factory=dict, init=False, repr=False)
    last_export_df: pd.DataFrame | None = field(default=None, init=False, repr=False)

    def __post_init__(self) -> None:
        inst, user, password, token = snow_credentials()
        self.username = self.username or user
        self.password = self.password or password
        self.token = self.token or token
        if not self.instance and inst:
            self.instance = inst
        self.table = self.table or os.getenv("SNOW_TABLE", "incident")
        if self.instance:
            self.instance = validate_snow_instance(self.instance)
        self.period_start = self.period_start or os.getenv("SNOW_PERIOD_START")
        self.period_end = self.period_end or os.getenv("SNOW_PERIOD_END")

    @property
    def base_url(self) -> str:
        return f"https://{self.instance}/api/now/table/{self.table}"

    def _auth(self) -> tuple[str, str] | None:
        if self.username and self.password:
            return (self.username, self.password)
        return None

    def _headers(self) -> dict[str, str]:
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def build_created_query(self) -> str:
        if self.query:
            return self.query
        if not self.period_start or not self.period_end:
            raise ValueError(
                "ServiceNow API requires period_start and period_end "
                "(or SNOW_PERIOD_START / SNOW_PERIOD_END / --query)"
            )
        start_utc, end_utc = snow_query_datetimes(self.period_start, self.period_end)
        return f"sys_created_on>={start_utc}^sys_created_on<={end_utc}"

    def _request_page(
        self,
        *,
        offset: int,
        limit: int,
        sysparm_query: str,
    ) -> tuple[list[dict[str, Any]], int | None]:
        params = {
            "sysparm_query": sysparm_query,
            "sysparm_fields": ",".join(self.fields),
            "sysparm_limit": str(limit),
            "sysparm_offset": str(offset),
            "sysparm_display_value": "true",
            "sysparm_exclude_reference_link": "true",
            "sysparm_suppress_pagination_header": "false",
        }
        resp = requests.get(
            self.base_url,
            params=params,
            auth=self._auth(),
            headers=self._headers(),
            timeout=120,
        )
        resp.raise_for_status()
        total_header = resp.headers.get("X-Total-Count")
        total = int(total_header) if total_header and total_header.isdigit() else None
        payload = resp.json()
        return payload.get("result", []), total

    def _fetch_raw(self) -> pd.DataFrame:
        sysparm_query = self.build_created_query()
        logger.info("Requête ServiceNow : %s", sysparm_query)
        logger.info("Endpoint         : %s", self.base_url)
        logger.info("Période locale   : %s → %s (America/Toronto)", self.period_start, self.period_end)

        all_rows: list[dict[str, Any]] = []
        offset = 0
        pages = 0
        total_expected: int | None = None

        while True:
            batch, total = self._request_page(
                offset=offset,
                limit=self.page_size,
                sysparm_query=sysparm_query,
            )
            pages += 1
            if total is not None and total_expected is None:
                total_expected = total
            all_rows.extend(batch)
            logger.info(
                "  Page %d : +%d tickets (cumul %d%s)",
                pages,
                len(batch),
                len(all_rows),
                f" / {total_expected}" if total_expected else "",
            )
            if not batch or len(batch) < self.page_size:
                break
            if total_expected is not None and len(all_rows) >= total_expected:
                break
            offset += self.page_size

        self.fetch_meta = {
            "source": "api",
            "query": sysparm_query,
            "period_start": self.period_start,
            "period_end": self.period_end,
            "total_fetched": len(all_rows),
            "total_expected": total_expected,
            "pages_fetched": pages,
        }

        if total_expected is not None and len(all_rows) != total_expected:
            raise ValueError(
                f"Pagination ServiceNow incomplète : {len(all_rows)} récupérés "
                f"vs {total_expected} (X-Total-Count)"
            )

        return pd.DataFrame(all_rows)

    def _unwrap(self, value: object) -> str:
        if value is None or (isinstance(value, float) and pd.isna(value)):
            return ""
        if isinstance(value, dict):
            return str(value.get("display_value") or value.get("value") or "")
        return str(value)

    def _map_api_to_export_columns(self, raw: pd.DataFrame) -> pd.DataFrame:
        if raw.empty:
            return pd.DataFrame(columns=["Created", "Titre"])

        out = pd.DataFrame()
        for _, row in raw.iterrows():
            mapped = {
                "Requérant": self._unwrap(row.get("caller_id")),
                "Catégorie de Ticket": self._unwrap(row.get("category")),
                "Date du signalement": self._unwrap(row.get("opened_at")),
                "Titre": self._unwrap(row.get("short_description")),
                "Description du problème": self._unwrap(row.get("description")),
                "Priorité": self._unwrap(row.get("priority")),
                "Attribuée à": self._unwrap(row.get("assigned_to")),
                "Statut": self._unwrap(row.get("state")),
                "Commentaire": self._unwrap(row.get("comments")),
                "Source du problème": self._unwrap(row.get("contact_type")),
                "Created": self._unwrap(row.get("sys_created_on")),
                "Superviseur": self._unwrap(row.get("assignment_group")),
            }
            out = pd.concat([out, pd.DataFrame([mapped])], ignore_index=True)
        return out

    def load(self) -> pd.DataFrame:
        if not self._auth() and not self.token:
            raise ValueError(
                "Credentials ServiceNow manquants (SNOW_USER/SNOW_PASSWORD ou SNOW_TOKEN)"
            )
        raw = self._fetch_raw()
        export_shape = self._map_api_to_export_columns(raw)
        self.last_export_df = export_shape
        df = normalize_tickets(export_shape, source="api")
        self.validate(df)
        df.attrs["fetch_meta"] = self.fetch_meta
        return df
