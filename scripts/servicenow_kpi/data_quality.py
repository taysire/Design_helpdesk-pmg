"""Data quality checks before report generation."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import pandas as pd

from config import DATE_FIELD, SHAREPOINT_LIST_URL, UNIQUE_ID_FIELD
from date_utils import REPORT_TZ, is_weekday, period_bounds, to_local_date

logger = logging.getLogger("servicenow_kpi.qa")


@dataclass
class FetchMetadata:
    source: str = "csv"
    period_start: str | None = None
    period_end: str | None = None
    query: str | None = None
    total_fetched: int = 0
    total_expected: int | None = None
    pages_fetched: int = 0
    first_created: str | None = None
    last_created: str | None = None
    timezone: str = "America/Toronto"

    def log_summary(self) -> None:
        label = "SharePoint" if self.source == "sharepoint" else "ServiceNow"
        logger.info("--- Controle recuperation %s ---", label)
        logger.info("  Source            : %s", self.source)
        logger.info("  Periode           : %s -> %s (%s)", self.period_start, self.period_end, self.timezone)
        if self.query:
            logger.info("  Requête           : %s", self.query)
        logger.info("  Tickets récupérés : %s", self.total_fetched)
        if self.total_expected is not None:
            logger.info("  Total attendu SN  : %s", self.total_expected)
        logger.info("  Pages récupérées  : %s", self.pages_fetched)
        if self.first_created:
            logger.info("  Premier ticket    : %s", self.first_created)
        if self.last_created:
            logger.info("  Dernier ticket    : %s", self.last_created)


@dataclass
class ValidationResult:
    ok: bool
    daily_counts: dict[str, int] = field(default_factory=dict)
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    fetch_meta: FetchMetadata | None = None
    unclassified_titles: dict[str, int] = field(default_factory=dict)

    def raise_if_failed(self) -> None:
        if not self.ok:
            msg = "Contrôle qualité échoué — rapport non généré:\n" + "\n".join(
                f"  • {e}" for e in self.errors
            )
            raise ValueError(msg)


def daily_ticket_counts(
    df: pd.DataFrame,
    period_start: str,
    period_end: str,
    *,
    weekdays_only: bool = True,
) -> dict[str, int]:
    """Count tickets per calendar day (local TZ). Weekends omitted if weekdays_only."""
    start, end = period_bounds(period_start, period_end)
    freq = "B" if weekdays_only else "D"
    days = pd.date_range(start.normalize(), end.normalize(), freq=freq, tz=REPORT_TZ)
    counts: dict[str, int] = {d.strftime("%Y-%m-%d"): 0 for d in days}

    if df.empty:
        return counts

    for dt in df["created_dt"]:
        if weekdays_only and not is_weekday(pd.Timestamp(dt)):
            continue
        day = to_local_date(pd.Timestamp(dt)).strftime("%Y-%m-%d")
        if day in counts:
            counts[day] += 1

    return counts


def build_fetch_metadata(
    df: pd.DataFrame,
    *,
    source: str,
    period_start: str | None,
    period_end: str | None,
    query: str | None = None,
    total_expected: int | None = None,
    pages_fetched: int = 0,
) -> FetchMetadata:
    meta = FetchMetadata(
        source=source,
        period_start=period_start,
        period_end=period_end,
        query=query,
        total_fetched=len(df),
        total_expected=total_expected,
        pages_fetched=pages_fetched,
    )
    if not df.empty:
        meta.first_created = df["created_dt"].min().strftime("%Y-%m-%d %H:%M:%S %Z")
        meta.last_created = df["created_dt"].max().strftime("%Y-%m-%d %H:%M:%S %Z")
    return meta


def check_data_freshness(
    df: pd.DataFrame,
    period_end: str,
    *,
    source: str = "csv",
) -> dict[str, Any]:
    """Warn when export data ends before the requested period (stale CSV)."""
    if df.empty:
        return {
            "stale": True,
            "source": source,
            "message": "Aucun ticket dans la période — vérifiez la source ServiceNow.",
            "last_ticket": None,
            "period_end": period_end,
        }
    last = pd.Timestamp(df["created_dt"].max())
    end = pd.Timestamp(period_end)
    last_date = last.date() if hasattr(last, "date") else last
    end_date = end.date() if hasattr(end, "date") else end
    stale = last_date < end_date
    msg = ""
    if stale and source == "api":
        msg = (
            f"Dernière récupération ServiceNow : ticket au {last_date.strftime('%d/%m/%Y')} "
            f"— période demandée jusqu'au {end_date.strftime('%d/%m/%Y')}. "
            "Vérifiez la requête API ou la table SNOW_TABLE."
        )
    elif stale and source == "sharepoint":
        msg = (
            f"Dernier ticket au {last_date.strftime('%d/%m/%Y')} — "
            f"données incomplètes pour la période jusqu'au {end_date.strftime('%d/%m/%Y')}. "
            "Vérifiez la liste SharePoint Tickets."
        )
    elif stale and source == "csv":
        msg = (
            f"L'export CSV s'arrête au {last_date.strftime('%d/%m/%Y')} alors que la période "
            f"va jusqu'au {end_date.strftime('%d/%m/%Y')}. "
            "Configurez l'API ServiceNow (SNOW_INSTANCE, SNOW_USER, SNOW_PASSWORD) "
            "ou exportez un CSV à jour depuis ServiceNow."
        )
    elif stale:
        msg = (
            f"Dernier ticket au {last_date.strftime('%d/%m/%Y')} — données incomplètes "
            f"pour la période jusqu'au {end_date.strftime('%d/%m/%Y')}."
        )
    return {
        "stale": stale,
        "source": source,
        "message": msg,
        "last_ticket": last.strftime("%d/%m/%Y %H:%M"),
        "period_end": end_date.strftime("%d/%m/%Y"),
    }


def build_sharepoint_diagnostics(
    fetch_meta: dict[str, Any],
    *,
    weekend_excluded: int = 0,
    total_after_exclusion: int = 0,
) -> dict[str, Any]:
    """Build SharePoint-specific data quality block for the HTML report."""
    warnings: list[str] = []
    missing = int(fetch_meta.get("missing_created", 0))
    outside = int(fetch_meta.get("outside_period", 0))
    before = int(fetch_meta.get("total_in_period_before_weekend", fetch_meta.get("total_fetched", 0)))
    after = total_after_exclusion or int(fetch_meta.get("total_fetched", 0))

    if missing:
        warnings.append(
            f"{missing} élément(s) sans date « {DATE_FIELD} » — exclus du décompte."
        )
    if outside:
        warnings.append(
            f"{outside} élément(s) hors période analysée — exclus du décompte."
        )
    if weekend_excluded:
        warnings.append(
            f"{weekend_excluded} ticket(s) créés samedi/dimanche — exclus après filtrage."
        )
    if before == 0:
        warnings.append("Aucun ticket dans la période — vérifiez la liste SharePoint.")
    if after != before - weekend_excluded:
        warnings.append(
            f"Incohérence totaux : avant exclusion {before}, "
            f"weekends {weekend_excluded}, après {after}."
        )

    columns = fetch_meta.get("available_columns") or []
    return {
        "source": "sharepoint",
        "list_url": fetch_meta.get("list_url", SHAREPOINT_LIST_URL),
        "list_name": fetch_meta.get("list_name", "Tickets"),
        "site_url": fetch_meta.get("site_url", ""),
        "unique_id_field": fetch_meta.get("unique_id_field", UNIQUE_ID_FIELD),
        "date_field": fetch_meta.get("date_field", DATE_FIELD),
        "available_columns": columns,
        "total_list_items": fetch_meta.get("total_list_items", 0),
        "total_in_period_before_weekend": before,
        "weekend_excluded": weekend_excluded,
        "total_after_exclusion": after,
        "missing_created": missing,
        "outside_period": outside,
        "pages_fetched": fetch_meta.get("pages_fetched", 0),
        "warnings": warnings,
        "has_warnings": bool(warnings),
    }


def validate_report_data(
    df: pd.DataFrame,
    *,
    period_start: str,
    period_end: str,
    fetch_meta: FetchMetadata | None = None,
    expected_daily: dict[str, int] | None = None,
    week1_count: int | None = None,
    week2_count: int | None = None,
) -> ValidationResult:
    errors: list[str] = []
    warnings: list[str] = []

    daily = daily_ticket_counts(df, period_start, period_end)
    total = len(df)
    daily_sum = sum(daily.values())

    logger.info("--- Tickets par jour ---")
    for day, count in sorted(daily.items()):
        logger.info("  %s : %d", day, count)

    if daily_sum != total:
        errors.append(
            f"Somme journalière ({daily_sum}) ≠ total tickets ({total})"
        )

    if week1_count is not None and week2_count is not None:
        if week1_count + week2_count != total:
            errors.append(
                f"Sem.1 ({week1_count}) + Sem.2 ({week2_count}) ≠ total ({total})"
            )

    if fetch_meta and fetch_meta.total_expected is not None:
        if fetch_meta.total_fetched != fetch_meta.total_expected:
            errors.append(
                f"Pagination incomplète : {fetch_meta.total_fetched} récupérés "
                f"vs {fetch_meta.total_expected} attendus par ServiceNow"
            )

    if expected_daily:
        for day, expected in sorted(expected_daily.items()):
            actual = daily.get(day, 0)
            if actual != expected:
                errors.append(
                    f"{day} : {actual} tickets dans les données vs {expected} attendus (ServiceNow)"
                )

    unclassified: dict[str, int] = {}
    if "classification_kind" in df.columns:
        other_df = df[df["classification_kind"] == "other"]
        if not other_df.empty:
            unclassified = {
                str(k): int(v)
                for k, v in other_df["title"].value_counts().items()
            }
            if unclassified:
                warnings.append(
                    f"{len(other_df)} ticket(s) non classifiés — voir tableau de vérification"
                )

    return ValidationResult(
        ok=len(errors) == 0,
        daily_counts=daily,
        errors=errors,
        warnings=warnings,
        fetch_meta=fetch_meta,
        unclassified_titles=unclassified,
    )


def load_expected_daily(path: Path) -> dict[str, int]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(data, dict):
        return {str(k): int(v) for k, v in data.items()}
    raise ValueError("expected-daily JSON must be an object {YYYY-MM-DD: count}")
