"""CSV export reader — current ServiceNow data source."""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from config import (
    COLUMN_MAP,
    COMPLETED_STATUSES,
    DATE_FORMATS,
    NEW_STATUSES,
    PRIORITY_FROM_SHORT,
    PRIORITY_SHORT,
)
from data_sources.base import TicketDataSource
from date_utils import localize_created


def _normalize_status(value: object) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip().lower()


def _parse_created(series: pd.Series) -> pd.Series:
    parsed = pd.to_datetime(series, format=DATE_FORMATS[0], errors="coerce")
    if parsed.isna().mean() > 0.5:
        parsed = pd.to_datetime(series, dayfirst=True, errors="coerce")
    if parsed.isna().mean() > 0.5:
        parsed = pd.to_datetime(series, errors="coerce")
    return parsed


def _expand_priority(value: object) -> str:
    if pd.isna(value):
        return "Non définie"
    text = str(value).strip()
    return PRIORITY_FROM_SHORT.get(text, text)


def _find_assignee_column(df: pd.DataFrame) -> str | None:
    for col in df.columns:
        if "attribu" in col.lower():
            return col
    return None


def prepare_tickets6_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize SharePoint export Tickets_6 (no Created column)."""
    if "Titre" not in df.columns and "Title" in df.columns:
        df = df.rename(columns={"Title": "Titre"})
    if "Status" in df.columns and "Statut" not in df.columns:
        df = df.rename(columns={"Status": "Statut"})
    if "Priorit" in df.columns and "Priorité" not in df.columns:
        df = df.rename(columns={"Priorit": "Priorité"})
    for col in df.columns:
        if col.startswith("Attribu") and "Attribuée à" not in df.columns:
            df = df.rename(columns={col: "Attribuée à"})
    if "Catégorie de Ticket" not in df.columns:
        df["Catégorie de Ticket"] = "Non catégorisé"
    if "Requérant" not in df.columns:
        df["Requérant"] = "Export CSV"
    if "Description du problème" not in df.columns and "Description du" in df.columns:
        df["Description du problème"] = df["Description du"].fillna(df.get("Titre", ""))
    if "ID" not in df.columns:
        df.insert(0, "ID", range(1, len(df) + 1))
    return df


def assign_created_from_row_order(
    df: pd.DataFrame,
    *,
    week1_start: str,
    week1_end: str,
    week2_start: str,
    week2_end: str,
) -> pd.DataFrame:
    """
    When CSV lacks Created, spread rows across two business weeks by row order.
    Marked as inferred — not real creation timestamps.
    """
    out = df.copy()
    n = len(out)
    if n == 0:
        return out
    half = n // 2
    days1 = pd.bdate_range(week1_start, week1_end)
    days2 = pd.bdate_range(week2_start, week2_end)

    created: list[pd.Timestamp] = []
    for i in range(n):
        if i < half:
            day = days1[(i * len(days1)) // max(half, 1)]
        else:
            j = i - half
            denom = max(n - half, 1)
            day = days2[(j * len(days2)) // denom]
        created.append(pd.Timestamp(day).replace(hour=9, minute=0))
    out["Created"] = created
    out.attrs["dates_inferred"] = True
    out.attrs["dates_inferred_warning"] = (
        "Le CSV ne contient pas de colonne Created. "
        "Les dates ont été réparties par ordre de ligne entre les deux semaines "
        "(sem. 1 : lignes 1–N/2, sem. 2 : N/2+1–N). Réexportez avec Created pour des données exactes."
    )
    return out


def prepare_export_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize alternate exports (e.g. Tickets_4 simulated schema) to ServiceNow shape."""
    if "Titre" in df.columns and "Created" not in df.columns and "created_at_simulated" not in df.columns:
        df = prepare_tickets6_dataframe(df)
    if "created_at_simulated" not in df.columns:
        return df

    out = df.copy()
    out["Created"] = out["created_at_simulated"]
    if "resolved_at_simulated" in out.columns:
        out["Date de résolution"] = out["resolved_at_simulated"]
    if "resolution_minutes" in out.columns:
        mins = pd.to_numeric(out["resolution_minutes"], errors="coerce")
        out["Durée de résolution (minutes)"] = mins
        out["SLA respecté"] = mins.apply(lambda m: "Oui" if pd.notna(m) and m <= 60 else "Non")
        out = out.drop(columns=["resolution_minutes"])

    if "status_original" in out.columns:
        out["Statut"] = out["status_original"]
    elif "Status" in out.columns:
        out["Statut"] = out["Status"]
    elif "status_for_report" in out.columns:
        out["Statut"] = out["status_for_report"]

    if "priority_normalized" in out.columns:
        out["Priorité"] = out["priority_normalized"].map(_expand_priority)
    elif "priority_original" in out.columns:
        out["Priorité"] = out["priority_original"].map(_expand_priority)

    out["Titre"] = out.get("Titre", out.get("title", ""))
    out["Catégorie de Ticket"] = out.get("difficulty", "Problème info").fillna("Problème info")
    out["Requérant"] = "Export Tickets_4"
    out["Description du problème"] = out.get("Description du", out.get("Titre", ""))

    assignee_col = _find_assignee_column(out)
    if assignee_col:
        out["Attribuée à"] = out[assignee_col].fillna("Non assigné")
    else:
        out["Attribuée à"] = "Non assigné"

    out.attrs["simulated_export"] = True
    return out


def normalize_tickets(df: pd.DataFrame, *, source: str = "csv") -> pd.DataFrame:
    """Rename columns, parse dates, add derived fields."""
    prepared = prepare_export_dataframe(df)
    simulated = bool(prepared.attrs.get("simulated_export"))
    rename = {k: v for k, v in COLUMN_MAP.items() if k in prepared.columns}
    out = prepared.rename(columns=rename).copy()

    # Prefer sys_created_on (API) over Created (CSV export)
    if "sys_created_on" in out.columns:
        created_col = out["sys_created_on"].where(
            out["sys_created_on"].notna() & (out["sys_created_on"].astype(str).str.len() > 0),
            out.get("created"),
        )
        out["created"] = created_col

    if "created" not in out.columns:
        raise ValueError("Missing created date column (expected 'Created' or 'sys_created_on').")

    out["created_dt"] = localize_created(_parse_created(out["created"]), source=source)
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
        col = out["resolution_minutes"]
        if isinstance(col, pd.DataFrame):
            col = col.iloc[:, 0]
        out["resolution_minutes"] = pd.to_numeric(col, errors="coerce")
    if "sla_met" in out.columns:
        out["sla_met_norm"] = (
            out["sla_met"].fillna("").astype(str).str.strip().str.lower()
        )
        out["sla_ok"] = out["sla_met_norm"].isin({"oui", "yes", "true", "1"})

    out = out.dropna(subset=["created_dt"])
    out.attrs["simulated_export"] = simulated
    return out


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
