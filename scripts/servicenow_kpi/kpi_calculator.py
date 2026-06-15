"""KPI calculations for weekly ServiceNow reporting."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any

import pandas as pd

from config import PRIORITY_ORDER


@dataclass
class WeekWindow:
    label: str
    start: pd.Timestamp
    end: pd.Timestamp

    @property
    def range_label(self) -> str:
        return f"{self.start.strftime('%d/%m/%Y')} – {self.end.strftime('%d/%m/%Y')}"


def _week_start(dt: pd.Timestamp) -> pd.Timestamp:
    """Monday 00:00 of the week containing dt."""
    ts = pd.Timestamp(dt).normalize()
    return ts - pd.Timedelta(days=ts.weekday())


def build_week_windows(reference: pd.Timestamp) -> tuple[WeekWindow, WeekWindow]:
    this_start = _week_start(reference)
    this_end = this_start + pd.Timedelta(days=7) - pd.Timedelta(seconds=1)
    last_start = this_start - pd.Timedelta(days=7)
    last_end = this_start - pd.Timedelta(seconds=1)
    return (
        WeekWindow("current", this_start, this_end),
        WeekWindow("previous", last_start, last_end),
    )


def _in_window(df: pd.DataFrame, window: WeekWindow) -> pd.DataFrame:
    mask = (df["created_dt"] >= window.start) & (df["created_dt"] <= window.end)
    return df.loc[mask]


def _pct_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return None if current == 0 else 100.0
    return round((current - previous) / previous * 100, 1)


def _count_by(df: pd.DataFrame, column: str, top_n: int = 10) -> dict[str, int]:
    if df.empty:
        return {}
    counts = df[column].value_counts().head(top_n)
    return {str(k): int(v) for k, v in counts.items()}


def _priority_counts(df: pd.DataFrame) -> dict[str, int]:
    if df.empty:
        return {}
    order = {p: i for i, p in enumerate(PRIORITY_ORDER)}
    vc = df["priority"].value_counts()
    items = sorted(vc.items(), key=lambda x: order.get(x[0], 99))
    return {str(k): int(v) for k, v in items}


def weekly_volume_history(df: pd.DataFrame, reference: pd.Timestamp, weeks: int) -> list[dict[str, Any]]:
    this_start = _week_start(reference)
    history = []
    for i in range(weeks - 1, -1, -1):
        start = this_start - pd.Timedelta(days=7 * i)
        end = start + pd.Timedelta(days=7) - pd.Timedelta(seconds=1)
        subset = df[(df["created_dt"] >= start) & (df["created_dt"] <= end)]
        history.append({
            "week_start": start,
            "label": start.strftime("%d/%m"),
            "created": len(subset),
            "completed": int(subset["is_completed"].sum()),
            "open": int(subset["is_new"].sum()),
        })
    return history


def _sla_metrics(df: pd.DataFrame) -> dict[str, float | int]:
    if df.empty or "sla_ok" not in df.columns:
        return {"sla_compliance_pct": 0.0, "sla_breaches": 0, "avg_resolution_min": 0.0}
    total = len(df)
    breaches = int((~df["sla_ok"]).sum())
    compliance = round(df["sla_ok"].sum() / total * 100, 1) if total else 0.0
    avg_min = 0.0
    if "resolution_minutes" in df.columns:
        avg_min = round(float(df["resolution_minutes"].mean(skipna=True) or 0), 1)
    return {
        "sla_compliance_pct": compliance,
        "sla_breaches": breaches,
        "avg_resolution_min": avg_min,
    }


class KpiCalculator:
    def __init__(self, df: pd.DataFrame, reference_date: pd.Timestamp | None = None, top_n: int = 10, trend_weeks: int = 8):
        self.df = df
        self.reference = reference_date or df["created_dt"].max()
        self.top_n = top_n
        self.trend_weeks = trend_weeks
        self.current_week, self.previous_week = build_week_windows(self.reference)
        self.df_current = _in_window(df, self.current_week)
        self.df_previous = _in_window(df, self.previous_week)

    def compute(self) -> dict[str, Any]:
        total = len(self.df)
        created_current = len(self.df_current)
        created_previous = len(self.df_previous)

        # Snapshot backlog (all tickets in export)
        open_new = int(self.df["is_new"].sum())
        completed_total = int(self.df["is_completed"].sum())
        closure_rate = round(completed_total / total * 100, 1) if total else 0.0

        # Week-scoped completed among tickets created that week (proxy without resolved date)
        completed_current = int(self.df_current["is_completed"].sum())
        completed_previous = int(self.df_previous["is_completed"].sum())
        week_closure_current = round(completed_current / created_current * 100, 1) if created_current else 0.0
        week_closure_previous = round(completed_previous / created_previous * 100, 1) if created_previous else 0.0

        volume_change = _pct_change(created_current, created_previous)
        completed_change = _pct_change(completed_current, completed_previous)

        critical_current = int(
            self.df_current["priority"].str.contains("Critique", case=False, na=False).sum()
        )
        critical_previous = int(
            self.df_previous["priority"].str.contains("Critique", case=False, na=False).sum()
        )

        sla_current = _sla_metrics(self.df_current)
        sla_previous = _sla_metrics(self.df_previous)
        two_week_df = pd.concat([self.df_previous, self.df_current])
        sla_two_weeks = _sla_metrics(two_week_df)

        return {
            "reference_date": self.reference,
            "current_week": self.current_week,
            "previous_week": self.previous_week,
            "two_week_period": {
                "label": f"{self.previous_week.start.strftime('%d/%m/%Y')} – {self.current_week.end.strftime('%d/%m/%Y')}",
                "created_total": created_previous + created_current,
                "completed_total": completed_previous + completed_current,
                **sla_two_weeks,
            },
            "summary": {
                "total_tickets": total,
                "created_this_week": created_current,
                "created_last_week": created_previous,
                "volume_change_pct": volume_change,
                "new_tickets_open": open_new,
                "completed_tickets": completed_total,
                "closure_rate_pct": closure_rate,
                "completed_this_week": completed_current,
                "completed_last_week": completed_previous,
                "completed_change_pct": completed_change,
                "week_closure_rate_current": week_closure_current,
                "week_closure_rate_previous": week_closure_previous,
                "critical_this_week": critical_current,
                "critical_last_week": critical_previous,
                **{f"sla_current_{k}": v for k, v in sla_current.items()},
                **{f"sla_previous_{k}": v for k, v in sla_previous.items()},
                **{f"sla_two_weeks_{k}": v for k, v in sla_two_weeks.items()},
            },
            "by_priority": {
                "current_week": _priority_counts(self.df_current),
                "previous_week": _priority_counts(self.df_previous),
                "all_time": _priority_counts(self.df),
            },
            "by_category": {
                "current_week": _count_by(self.df_current, "category", self.top_n),
                "previous_week": _count_by(self.df_previous, "category", self.top_n),
                "all_time": _count_by(self.df, "category", self.top_n),
            },
            "by_requester": {
                "current_week": _count_by(self.df_current, "requester", self.top_n),
                "previous_week": _count_by(self.df_previous, "requester", self.top_n),
                "all_time": _count_by(self.df, "requester", self.top_n),
            },
            "by_assignee": {
                "current_week": _count_by(self.df_current, "assignee", self.top_n),
                "previous_week": _count_by(self.df_previous, "assignee", self.top_n),
                "all_time": _count_by(self.df, "assignee", self.top_n),
            },
            "by_status": {
                "all_time": _count_by(self.df, "status", self.top_n),
                "current_week": _count_by(self.df_current, "status", self.top_n),
                "previous_week": _count_by(self.df_previous, "status", self.top_n),
                "two_weeks": _count_by(two_week_df, "status", self.top_n),
            },
            "volume_history": weekly_volume_history(self.df, self.reference, self.trend_weeks),
            "top_titles_current_week": _count_by(self.df_current, "title", 8),
        }
