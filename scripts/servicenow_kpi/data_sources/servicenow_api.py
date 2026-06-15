"""ServiceNow REST API source — placeholder for future integration.

Replace CsvTicketSource with this class once API credentials are configured:

    source = ServiceNowApiSource(
        instance="pmg.service-now.com",
        username=os.environ["SNOW_USER"],
        password=os.environ["SNOW_PASSWORD"],
        table="incident",
    )
    df = source.load()
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

import pandas as pd

from data_sources.base import TicketDataSource
from data_sources.csv_source import normalize_tickets


@dataclass
class ServiceNowApiSource(TicketDataSource):
    instance: str
    table: str = "incident"
    username: str | None = None
    password: str | None = None
    token: str | None = None
    query: str | None = None
    fields: list[str] = field(default_factory=lambda: [
        "number", "caller_id", "category", "opened_at", "short_description",
        "description", "priority", "assigned_to", "state", "comments",
        "contact_type", "sys_created_on", "assignment_group",
    ])

    def __post_init__(self) -> None:
        self.username = self.username or os.getenv("SNOW_USER")
        self.password = self.password or os.getenv("SNOW_PASSWORD")
        self.token = self.token or os.getenv("SNOW_TOKEN")

    def _fetch_raw(self) -> pd.DataFrame:
        raise NotImplementedError(
            "ServiceNow API integration not configured. "
            "Implement _fetch_raw() with pysnow or requests against "
            f"https://{self.instance}/api/now/table/{self.table}"
        )

    def _map_api_to_export_columns(self, raw: pd.DataFrame) -> pd.DataFrame:
        """Map ServiceNow API fields to French export column names."""
        mapping = {
            "caller_id": "Requérant",
            "category": "Catégorie de Ticket",
            "opened_at": "Date du signalement",
            "short_description": "Titre",
            "description": "Description du problème",
            "priority": "Priorité",
            "assigned_to": "Attribuée à",
            "state": "Statut",
            "comments": "Commentaire",
            "contact_type": "Source du problème",
            "sys_created_on": "Created",
            "assignment_group": "Superviseur",
        }
        return raw.rename(columns={k: v for k, v in mapping.items() if k in raw.columns})

    def load(self) -> pd.DataFrame:
        raw = self._fetch_raw()
        export_shape = self._map_api_to_export_columns(raw)
        df = normalize_tickets(export_shape)
        self.validate(df)
        return df
