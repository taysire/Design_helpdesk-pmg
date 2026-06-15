"""Microsoft Lists / SharePoint — Microsoft Graph data source."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import pandas as pd

from config import COLUMN_MAP
from data_sources.base import TicketDataSource
from data_sources.csv_source import normalize_tickets
from graph_client import GRAPH_BASE, GraphClient


def unwrap_graph_field(value: Any) -> str:
    """Flatten Graph / SharePoint field values (person, lookup, choice)."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    if isinstance(value, list):
        parts = [unwrap_graph_field(item) for item in value]
        return ", ".join(part for part in parts if part)
    if isinstance(value, dict):
        for key in ("LookupValue", "DisplayName", "displayName", "Email", "email", "Value"):
            if value.get(key):
                return str(value[key])
        return ""
    return str(value).strip()


@dataclass
class SharePointListSource(TicketDataSource):
    """
    Load tickets from a Microsoft List via Graph API.

    Env vars:
      GRAPH_SITE_HOST   — e.g. contoso.sharepoint.com
      GRAPH_SITE_PATH   — e.g. /sites/Helpdesk
      GRAPH_LIST_NAME   — display name of the list (e.g. Tickets)
      GRAPH_LIST_ID     — optional, skips list name lookup
      GRAPH_SITE_ID     — optional, skips site path lookup
    """

    site_host: str | None = None
    site_path: str | None = None
    list_name: str | None = None
    list_id: str | None = None
    site_id: str | None = None
    client: GraphClient | None = None
    page_size: int = 200
    extra_field_aliases: dict[str, str] = field(default_factory=dict)

    def __post_init__(self) -> None:
        self.site_host = self.site_host or os.getenv("GRAPH_SITE_HOST")
        self.site_path = self.site_path or os.getenv("GRAPH_SITE_PATH", "/")
        self.list_name = self.list_name or os.getenv("GRAPH_LIST_NAME", "Tickets")
        self.list_id = self.list_id or os.getenv("GRAPH_LIST_ID")
        self.site_id = self.site_id or os.getenv("GRAPH_SITE_ID")
        self.client = self.client or GraphClient()

    def _resolve_site_id(self) -> str:
        if self.site_id:
            return self.site_id
        if not self.site_host:
            raise ValueError("GRAPH_SITE_HOST or GRAPH_SITE_ID is required.")
        path = self.site_path if self.site_path.startswith("/") else f"/{self.site_path}"
        url = f"{GRAPH_BASE}/sites/{self.site_host}:{path}"
        return self.client.get(url)["id"]

    def _resolve_list_id(self, site_id: str) -> str:
        if self.list_id:
            return self.list_id
        lists = self.client.get_paginated(f"{GRAPH_BASE}/sites/{site_id}/lists")
        for lst in lists:
            if lst.get("displayName") == self.list_name or lst.get("name") == self.list_name:
                return lst["id"]
        names = ", ".join(sorted({lst.get("displayName", "?") for lst in lists}))
        raise ValueError(f"List '{self.list_name}' not found. Available: {names}")

    def _column_display_map(self, site_id: str, list_id: str) -> dict[str, str]:
        """Internal Graph field name → SharePoint display name."""
        columns = self.client.get_paginated(
            f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/columns"
        )
        return {
            col["name"]: col.get("displayName", col["name"])
            for col in columns
            if col.get("name")
        }

    def _fetch_items(self, site_id: str, list_id: str) -> list[dict[str, Any]]:
        url = f"{GRAPH_BASE}/sites/{site_id}/lists/{list_id}/items"
        params = {"$expand": "fields", "$top": str(self.page_size)}
        return self.client.get_paginated(url, params=params)

    def _items_to_dataframe(
        self,
        items: list[dict[str, Any]],
        column_display: dict[str, str],
    ) -> pd.DataFrame:
        known_exports = set(COLUMN_MAP.keys())
        rows: list[dict[str, str]] = []

        for item in items:
            fields = item.get("fields") or {}
            row: dict[str, str] = {}

            for internal, raw in fields.items():
                display = column_display.get(internal, internal)
                display = self.extra_field_aliases.get(display, display)
                if display in known_exports or display == "Title":
                    row[display] = unwrap_graph_field(raw)

            if "Titre" not in row and "Title" in fields:
                row["Titre"] = unwrap_graph_field(fields["Title"])
            if "Created" not in row:
                created = fields.get("Created") or item.get("createdDateTime")
                if created:
                    row["Created"] = unwrap_graph_field(created)

            if row.get("Created"):
                rows.append(row)

        if not rows:
            return pd.DataFrame(columns=list(COLUMN_MAP.keys()))

        return pd.DataFrame(rows)

    def load(self) -> pd.DataFrame:
        site_id = self._resolve_site_id()
        list_id = self._resolve_list_id(site_id)
        column_display = self._column_display_map(site_id, list_id)
        items = self._fetch_items(site_id, list_id)
        raw = self._items_to_dataframe(items, column_display)
        df = normalize_tickets(raw)
        self.validate(df)
        return df
