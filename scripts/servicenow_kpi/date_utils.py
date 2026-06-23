"""Date / timezone helpers for ServiceNow KPI reporting."""

from __future__ import annotations

from zoneinfo import ZoneInfo

import pandas as pd

REPORT_TZ = ZoneInfo("America/Toronto")


def localize_created(series: pd.Series, *, source: str = "csv") -> pd.Series:
    """
    Normalize created timestamps to report timezone (America/Toronto).

    CSV exports use local Quebec time (naive). API returns UTC (aware or Z suffix).
    """
    parsed = pd.to_datetime(series, errors="coerce")
    if parsed.dt.tz is not None:
        return parsed.dt.tz_convert(REPORT_TZ)
    if source in ("api", "graph"):
        return parsed.dt.tz_localize("UTC").dt.tz_convert(REPORT_TZ)
    return parsed.dt.tz_localize(REPORT_TZ, ambiguous="infer", nonexistent="shift_forward")


def period_bounds(
    period_start: str | pd.Timestamp,
    period_end: str | pd.Timestamp,
) -> tuple[pd.Timestamp, pd.Timestamp]:
    """Inclusive local bounds [start, end] in America/Toronto."""
    start = pd.Timestamp(period_start).tz_localize(REPORT_TZ).normalize()
    end = (
        pd.Timestamp(period_end).tz_localize(REPORT_TZ).normalize()
        + pd.Timedelta(days=1)
        - pd.Timedelta(microseconds=1)
    )
    return start, end


def to_local_date(dt: pd.Timestamp) -> pd.Timestamp:
    ts = pd.Timestamp(dt)
    if ts.tzinfo is None:
        ts = ts.tz_localize(REPORT_TZ)
    else:
        ts = ts.tz_convert(REPORT_TZ)
    return ts.normalize()


def snow_query_datetimes(
    period_start: str | pd.Timestamp,
    period_end: str | pd.Timestamp,
) -> tuple[str, str]:
    """UTC ISO strings for ServiceNow sys_created_on query."""
    start, end = period_bounds(period_start, period_end)
    start_utc = start.tz_convert("UTC")
    end_utc = end.tz_convert("UTC")
    fmt = "%Y-%m-%d %H:%M:%S"
    return start_utc.strftime(fmt), end_utc.strftime(fmt)


def is_weekday(dt: pd.Timestamp) -> bool:
    """True if Monday–Friday (America/Toronto)."""
    ts = pd.Timestamp(dt)
    if ts.tzinfo is None:
        ts = ts.tz_localize(REPORT_TZ)
    else:
        ts = ts.tz_convert(REPORT_TZ)
    return ts.weekday() < 5


def exclude_weekend_tickets(df: pd.DataFrame) -> tuple[pd.DataFrame, int]:
    """
    Remove tickets created on Saturday/Sunday (local TZ).
    Returns (filtered_df, excluded_count).
    """
    if df.empty:
        return df, 0
    weekdays = df["created_dt"].apply(lambda dt: is_weekday(pd.Timestamp(dt)))
    excluded = int((~weekdays).sum())
    out = df.loc[weekdays].copy()
    out.attrs.update({k: v for k, v in df.attrs.items()})
    out.attrs["weekend_tickets_excluded"] = excluded
    return out, excluded
