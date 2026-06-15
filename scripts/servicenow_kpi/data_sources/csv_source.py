"""CSV export reader — current ServiceNow data source."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from config import COLUMN_MAP, COMPLETED_STATUSES, DATE_FORMATS, NEW_STATUSES, PRIORITY_SHORT
from data_sources.base import TicketDataSource


def _normalize_status(value: object) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip().lower()


def _parse_created(series: pd.Series) -> pd.Series:
    parsed = pd.to_datetime(series, format=DATE_FORMATS[0], errors="coerce")
    if parsed.isna().mean() > 0.5:
        parsed = pd.to_datetime(series, dayfirst=True, errors="coerce")
    return parsed


def normalize_tickets(df: pd.DataFrame) -> pd.DataFrame:
    """Rename columns, parse dates, add derived fields."""
    rename = {k: v for k, v in COLUMN_MAP.items() if k in df.columns}
    out = df.rename(columns=rename).copy()

    out["created_dt"] = _parse_created(out["created"])
    if "reported_at" in out.columns:
        out["reported_dt"] = _parse_created(out["reported_at"])
    else:
        out["reported_dt"] = out["created_dt"]

    out["status_norm"] = out["status"].map(_normalize_status)
    out["is_completed"] = out["status_norm"].isin(COMPLETED_STATUSES)
    out["is_new"] = out["status_norm"].isin(NEW_STATUSES)

    out["priority"] = out["priority"].fillna("Non définie").astype(str).str.strip()
    out["priority_short"] = out["priority"].map(lambda p: PRIORITY_SHORT.get(p, p[:20]))
    out["category"] = out["category"].fillna("Non catégorisé").astype(str).str.strip()
    out["requester"] = out["requester"].fillna("Inconnu").astype(str).str.strip()
    out["assignee"] = out["assignee"].fillna("Non assigné").astype(str).str.strip()
    out["title"] = out.get("title", pd.Series(dtype=str)).fillna("").astype(str)

    if "resolved_at" in out.columns:
        out["resolved_dt"] = _parse_created(out["resolved_at"])
    if "closed_at" in out.columns:
        out["closed_dt"] = _parse_created(out["closed_at"])
    if "resolution_minutes" in out.columns:
        out["resolution_minutes"] = pd.to_numeric(out["resolution_minutes"], errors="coerce")
    if "sla_met" in out.columns:
        out["sla_met_norm"] = (
            out["sla_met"].fillna("").astype(str).str.strip().str.lower()
        )
        out["sla_ok"] = out["sla_met_norm"].isin({"oui", "yes", "true", "1"})

    return out.dropna(subset=["created_dt"])


class CsvTicketSource(TicketDataSource):
    def __init__(self, path: Path, encoding: str = "utf-8") -> None:
        self.path = Path(path)
        self.encoding = encoding

    def load(self) -> pd.DataFrame:
        if not self.path.exists():
            raise FileNotFoundError(f"CSV not found: {self.path}")

        df = pd.read_csv(self.path, encoding=self.encoding)
        df = normalize_tickets(df)
        self.validate(df)
        return df
