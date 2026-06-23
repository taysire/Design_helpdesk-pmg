"""KPI calculations for weekly ServiceNow reporting."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from comparison_tables import build_comparison_rows, build_summary_comparison
from config import PRIORITY_ORDER
from date_utils import period_bounds, to_local_date
from period_utils import reference_friday
from ticket_classifier import apply_classification, count_by_column, count_combined_problems


@dataclass
class WeekWindow:
    label: str
    start: pd.Timestamp
    end: pd.Timestamp
    business: bool = False

    @property
    def range_label(self) -> str:
        if self.business or self.end.weekday() == 4:
            return (
                f"Lun {self.start.strftime('%d/%m')} – "
                f"Ven {self.end.strftime('%d/%m/%Y')}"
            )
        return f"{self.start.strftime('%d/%m/%Y')} – {self.end.strftime('%d/%m/%Y')}"


def _week_start(dt: pd.Timestamp) -> pd.Timestamp:
    """Monday 00:00 of the week containing dt."""
    ts = pd.Timestamp(dt).normalize()
    return ts - pd.Timedelta(days=ts.weekday())


def build_week_windows(reference: pd.Timestamp) -> tuple[WeekWindow, WeekWindow]:
    ref = pd.Timestamp(reference)
    if ref.tzinfo is not None:
        ref = ref.tz_convert("America/Toronto")
    this_start = _week_start(ref)
    this_end = this_start + pd.Timedelta(days=7) - pd.Timedelta(seconds=1)
    last_start = this_start - pd.Timedelta(days=7)
    last_end = this_start - pd.Timedelta(seconds=1)
    return (
        WeekWindow("current", this_start, this_end),
        WeekWindow("previous", last_start, last_end),
    )


def _business_friday(reference: pd.Timestamp) -> pd.Timestamp:
    ref = pd.Timestamp(reference)
    if ref.tzinfo is not None:
        ref = ref.tz_convert("America/Toronto")
    fri = reference_friday(ref.date())
    ts = pd.Timestamp(fri)
    if ref.tzinfo is not None:
        ts = ts.tz_localize(ref.tzinfo)
    return ts


def build_business_week_windows(reference: pd.Timestamp) -> tuple[WeekWindow, WeekWindow]:
    """
    Two complete past business weeks (Mon–Fri), semaine courante exclue.

    reference = vendredi fin de semaine 2 (ou date remontée au vendredi précédent).
    """
    ref = pd.Timestamp(reference)
    if ref.tzinfo is not None:
        ref = ref.tz_convert("America/Toronto")
    week2_friday = _business_friday(ref)
    week2_monday = week2_friday - pd.Timedelta(days=4)
    week1_monday = week2_monday - pd.Timedelta(days=7)
    week1_friday = week1_monday + pd.Timedelta(days=4)

    def bounds(monday: pd.Timestamp, friday: pd.Timestamp) -> tuple[pd.Timestamp, pd.Timestamp]:
        start = pd.Timestamp(monday).normalize()
        end = pd.Timestamp(friday).normalize() + pd.Timedelta(hours=23, minutes=59, seconds=59)
        if ref.tzinfo is not None and start.tzinfo is None:
            start = start.tz_localize(ref.tzinfo)
            end = end.tz_localize(ref.tzinfo)
        return start, end

    w1s, w1e = bounds(week1_monday, week1_friday)
    w2s, w2e = bounds(week2_monday, week2_friday)
    return (
        WeekWindow("current", w2s, w2e, business=True),
        WeekWindow("previous", w1s, w1e, business=True),
    )


def build_test_business_week_windows(reference: pd.Timestamp) -> tuple[WeekWindow, WeekWindow]:
    """
    Mode test : semaine 2 = semaine courante (lun → date de référence),
    semaine 1 = semaine ouvrable précédente complète.
    """
    ref = pd.Timestamp(reference)
    if ref.tzinfo is not None:
        ref = ref.tz_convert("America/Toronto")
    week2_monday = ref.normalize() - pd.Timedelta(days=int(ref.weekday()))
    week2_end = ref.normalize() + pd.Timedelta(hours=23, minutes=59, seconds=59)
    week1_monday = week2_monday - pd.Timedelta(days=7)
    week1_friday = week1_monday + pd.Timedelta(days=4)

    def bounds(monday: pd.Timestamp, end_day: pd.Timestamp) -> tuple[pd.Timestamp, pd.Timestamp]:
        start = pd.Timestamp(monday).normalize()
        end = pd.Timestamp(end_day).normalize() + pd.Timedelta(hours=23, minutes=59, seconds=59)
        if ref.tzinfo is not None and start.tzinfo is None:
            start = start.tz_localize(ref.tzinfo)
            end = end.tz_localize(ref.tzinfo)
        return start, end

    w1s, w1e = bounds(week1_monday, week1_friday)
    w2s, w2e = bounds(week2_monday, week2_end)
    return (
        WeekWindow("current", w2s, w2e, business=True),
        WeekWindow("previous", w1s, w1e, business=True),
    )


def _align_window(window: WeekWindow, sample: pd.Timestamp) -> tuple[pd.Timestamp, pd.Timestamp]:
    start, end = window.start, window.end
    if sample.tzinfo is not None:
        tz = sample.tzinfo
        if start.tzinfo is None:
            start = start.tz_localize(tz)
            end = end.tz_localize(tz)
        else:
            start = start.tz_convert(tz)
            end = end.tz_convert(tz)
    elif start.tzinfo is not None:
        start = start.tz_localize(None)
        end = end.tz_localize(None)
    return start, end


def _in_window(df: pd.DataFrame, window: WeekWindow) -> pd.DataFrame:
    if df.empty:
        return df
    sample = df["created_dt"].iloc[0]
    start, end = _align_window(window, pd.Timestamp(sample))
    mask = (df["created_dt"] >= start) & (df["created_dt"] <= end)
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


def _count_all_by(df: pd.DataFrame, column: str) -> dict[str, int]:
    if df.empty:
        return {}
    return {str(k): int(v) for k, v in df[column].value_counts().items()}


def _priority_counts(df: pd.DataFrame) -> dict[str, int]:
    if df.empty:
        return {}
    order = {p: i for i, p in enumerate(PRIORITY_ORDER)}
    vc = df["priority"].value_counts()
    items = sorted(vc.items(), key=lambda x: order.get(x[0], 99))
    return {str(k): int(v) for k, v in items}


def weekly_volume_history(df: pd.DataFrame, reference: pd.Timestamp, weeks: int) -> list[dict[str, Any]]:
    ref = pd.Timestamp(reference)
    if not df.empty and df["created_dt"].dt.tz is not None:
        if ref.tzinfo is None:
            ref = ref.tz_localize(df["created_dt"].dt.tz)
        else:
            ref = ref.tz_convert(df["created_dt"].dt.tz)
    this_start = _week_start(ref)
    history = []
    for i in range(weeks - 1, -1, -1):
        start = this_start - pd.Timedelta(days=7 * i)
        end = start + pd.Timedelta(days=7) - pd.Timedelta(seconds=1)
        window = WeekWindow("history", start, end)
        subset = _in_window(df, window)
        history.append({
            "week_start": start,
            "label": start.strftime("%d/%m"),
            "created": len(subset),
            "completed": int(subset["is_completed"].sum()) if not subset.empty else 0,
            "open": int(subset["is_new"].sum()) if not subset.empty else 0,
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


def _subsample_stratified(df: pd.DataFrame, cap: int, seed: int = 42) -> pd.DataFrame:
    """Reduce an oversized simulated week to a realistic ticket count (~20-25)."""
    if len(df) <= cap:
        return df
    work = df.copy()
    if "status_norm" not in work.columns:
        work["status_norm"] = work.get("status", "")

    parts: list[pd.DataFrame] = []
    remaining = cap
    groups = list(work.groupby("status_norm", dropna=False))
    for idx, (status, group) in enumerate(groups):
        if idx == len(groups) - 1:
            n = min(len(group), remaining)
        else:
            n = min(len(group), max(0, round(cap * len(group) / len(work))))
            n = min(n, remaining)
        if n > 0:
            parts.append(group.sample(n=n, random_state=seed))
            remaining -= n

    result = pd.concat(parts) if parts else work.sample(n=cap, random_state=seed)
    if len(result) < cap:
        leftover = work.drop(result.index, errors="ignore")
        if not leftover.empty:
            extra = leftover.sample(n=min(cap - len(result), len(leftover)), random_state=seed)
            result = pd.concat([result, extra])
    if len(result) > cap:
        result = result.sample(n=cap, random_state=seed)
    return result


def scope_weekly_dataframe(
    df: pd.DataFrame,
    *,
    reference_date: pd.Timestamp | None = None,
    weekly_cap: int | None = 25,
    current_week_only: bool = True,
    include_previous_week: bool = True,
) -> pd.DataFrame:
    """
    Limit report data to the relevant week(s) and realistic volume.
    Simulated exports with inflated daily counts are subsampled to weekly_cap.
    """
    reference = reference_date or df["created_dt"].max()
    current, previous = build_week_windows(reference)
    current_df = _in_window(df, current)
    previous_df = _in_window(df, previous)

    simulated = bool(df.attrs.get("simulated_export"))
    cap = weekly_cap if simulated and weekly_cap else None

    if cap and len(current_df) > cap:
        current_df = _subsample_stratified(current_df, cap)

    if current_week_only:
        scoped = current_df
    elif include_previous_week:
        if cap and len(previous_df) > cap:
            previous_df = _subsample_stratified(previous_df, cap)
        scoped = pd.concat([previous_df, current_df], ignore_index=True)
    else:
        scoped = current_df

    scoped = scoped.copy()
    scoped.attrs["simulated_export"] = simulated
    scoped.attrs["weekly_scoped"] = True
    return scoped


def filter_period_dataframe(
    df: pd.DataFrame,
    period_start: str | pd.Timestamp,
    period_end: str | pd.Timestamp,
) -> pd.DataFrame:
    """Keep tickets whose sys_created_on / Created falls within [start, end] inclusive (local TZ)."""
    start, end = period_bounds(period_start, period_end)
    created = df["created_dt"]
    if created.dt.tz is None:
        start_cmp = start.tz_localize(None)
        end_cmp = end.tz_localize(None)
    else:
        start_cmp, end_cmp = start, end
    mask = (created >= start_cmp) & (created <= end_cmp)
    out = df.loc[mask].copy()
    out.attrs.update({k: v for k, v in df.attrs.items()})
    out.attrs["period_filtered"] = True
    return out


def daily_counts_in_period(
    df: pd.DataFrame,
    period_start: str,
    period_end: str,
) -> dict[str, int]:
    from data_quality import daily_ticket_counts

    return daily_ticket_counts(df, period_start, period_end)


class KpiCalculator:
    def __init__(
        self,
        df: pd.DataFrame,
        reference_date: pd.Timestamp | None = None,
        top_n: int = 10,
        trend_weeks: int = 8,
        volume_only: bool = False,
        week_mode: str = "production",
    ):
        self.df = df
        ref = reference_date or df["created_dt"].max()
        ref = pd.Timestamp(ref)
        if not df.empty and df["created_dt"].dt.tz is not None and ref.tzinfo is None:
            ref = ref.tz_localize(df["created_dt"].dt.tz)
        self.reference = ref
        self.top_n = top_n
        self.trend_weeks = trend_weeks
        self.volume_only = volume_only
        self.week_mode = week_mode
        if volume_only and week_mode == "test_current":
            self.current_week, self.previous_week = build_test_business_week_windows(self.reference)
        elif volume_only:
            self.current_week, self.previous_week = build_business_week_windows(self.reference)
        else:
            self.current_week, self.previous_week = build_week_windows(self.reference)
        if "application_label" in df.columns:
            self.df = df
        else:
            self.df = apply_classification(df)
        self.df_current = _in_window(self.df, self.current_week)
        self.df_previous = _in_window(self.df, self.previous_week)

    def compute(self) -> dict[str, Any]:
        total = len(self.df)
        created_current = len(self.df_current)
        created_previous = len(self.df_previous)

        if self.volume_only:
            open_new = 0
            completed_total = total
            closure_rate = None
            completed_current = created_current
            completed_previous = created_previous
            week_closure_current = None
            week_closure_previous = None
            sla_current = {"sla_compliance_pct": None, "sla_breaches": 0, "avg_resolution_min": None}
            sla_previous = {"sla_compliance_pct": None, "sla_breaches": 0, "avg_resolution_min": None}
            sla_two_weeks = {"sla_compliance_pct": None, "sla_breaches": 0, "avg_resolution_min": None}
        else:
            open_new = int(self.df["is_new"].sum())
            completed_total = int(self.df["is_completed"].sum())
            closure_rate = round(completed_total / total * 100, 1) if total else 0.0
            completed_current = int(self.df_current["is_completed"].sum())
            completed_previous = int(self.df_previous["is_completed"].sum())
            week_closure_current = round(completed_current / created_current * 100, 1) if created_current else 0.0
            week_closure_previous = round(completed_previous / created_previous * 100, 1) if created_previous else 0.0
            sla_current = _sla_metrics(self.df_current)
            sla_previous = _sla_metrics(self.df_previous)
            two_week_df_pre = pd.concat([self.df_previous, self.df_current])
            sla_two_weeks = _sla_metrics(two_week_df_pre)

        volume_change = _pct_change(created_current, created_previous)
        completed_change = _pct_change(completed_current, completed_previous) if not self.volume_only else volume_change

        critical_current = int(
            self.df_current["priority"].str.contains("Critique", case=False, na=False).sum()
        )
        critical_previous = int(
            self.df_previous["priority"].str.contains("Critique", case=False, na=False).sum()
        )

        two_week_df = pd.concat([self.df_previous, self.df_current])

        apps_current = self.df_current[self.df_current["application_label"].notna()]
        apps_previous = self.df_previous[self.df_previous["application_label"].notna()]
        apps_period = two_week_df[two_week_df["application_label"].notna()]

        equip_current = self.df_current[self.df_current["equipment_label"].notna()]
        equip_previous = self.df_previous[self.df_previous["equipment_label"].notna()]
        equip_period = two_week_df[two_week_df["equipment_label"].notna()]

        combined_current = self.df_current[self.df_current["problem_category"].notna()]
        combined_previous = self.df_previous[self.df_previous["problem_category"].notna()]
        combined_period = two_week_df[two_week_df["problem_category"].notna()]

        period_start = self.previous_week.start.strftime("%Y-%m-%d")
        period_end = self.current_week.end.strftime("%Y-%m-%d")

        summary = {
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
            **({} if self.volume_only else {f"sla_current_{k}": v for k, v in sla_current.items()}),
            **({} if self.volume_only else {f"sla_previous_{k}": v for k, v in sla_previous.items()}),
            **({} if self.volume_only else {f"sla_two_weeks_{k}": v for k, v in sla_two_weeks.items()}),
        }

        status_prev = _count_all_by(self.df_previous, "status")
        status_cur = _count_all_by(self.df_current, "status")
        app_prev = count_by_column(apps_previous, "application_label", 50)
        app_cur = count_by_column(apps_current, "application_label", 50)
        equip_prev = count_by_column(equip_previous, "equipment_label", 50)
        equip_cur = count_by_column(equip_current, "equipment_label", 50)

        comparison_tables = {
            "summary": build_summary_comparison(summary),
            "status": build_comparison_rows(status_prev, status_cur, top_n=20),
            "applications": build_comparison_rows(app_prev, app_cur, top_n=15),
            "equipment": build_comparison_rows(equip_prev, equip_cur, top_n=15),
            "combined": build_comparison_rows(
                count_combined_problems(combined_previous, 50),
                count_combined_problems(combined_current, 50),
                top_n=15,
            ),
        }

        return {
            "reference_date": self.reference,
            "current_week": self.current_week,
            "previous_week": self.previous_week,
            "report_options": {
                "volume_only": self.volume_only,
                "exclude_weekends": True,
                "week_mode": self.week_mode,
            },
            "two_week_period": {
                "label": f"{self.previous_week.start.strftime('%d/%m/%Y')} – {self.current_week.end.strftime('%d/%m/%Y')}",
                "created_total": created_previous + created_current,
                "completed_total": created_previous + created_current if self.volume_only else completed_previous + completed_current,
                **sla_two_weeks,
            },
            "summary": summary,
            "comparison_tables": comparison_tables,
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
            "by_application": {
                "current_week": count_by_column(apps_current, "application_label", self.top_n),
                "previous_week": count_by_column(apps_previous, "application_label", self.top_n),
                "period": count_by_column(apps_period, "application_label", 15),
            },
            "by_equipment": {
                "current_week": count_by_column(equip_current, "equipment_label", self.top_n),
                "previous_week": count_by_column(equip_previous, "equipment_label", self.top_n),
                "period": count_by_column(equip_period, "equipment_label", 15),
            },
            "by_combined": {
                "current_week": count_combined_problems(combined_current, 10),
                "previous_week": count_combined_problems(combined_previous, 10),
                "period": count_combined_problems(combined_period, 10),
                "period_all": count_by_column(combined_period, "problem_category", 20),
            },
            "daily_counts": daily_counts_in_period(self.df, period_start, period_end),
            "by_status": {
                "all_time": _count_by(self.df, "status", self.top_n),
                "current_week": _count_by(self.df_current, "status", self.top_n),
                "previous_week": _count_by(self.df_previous, "status", self.top_n),
                "two_weeks": _count_by(two_week_df, "status", self.top_n),
            },
            "volume_history": weekly_volume_history(self.df, self.reference, self.trend_weeks),
            "top_titles_current_week": _count_by(self.df_current, "title", 8),
        }
