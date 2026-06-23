"""Automatic bi-weekly period calculation for Monday KPI runs."""

from __future__ import annotations

import os
from datetime import date, timedelta


def reference_friday(d: date) -> date:
    """Friday on or before date d (sem. 2 ends on this day)."""
    wd = d.weekday()
    if wd == 4:
        return d
    if wd < 4:
        return d - timedelta(days=wd + 3)
    return d - timedelta(days=wd - 4)


def compute_biweekly_period(run_date: date | None = None) -> tuple[str, str, str]:
    """
    Compute (period_start, period_end, reference_date) for automated Monday reports.

    Rules:
    - Semaine courante (lun en cours) exclue.
    - Semaine 2 = lun–ven de la semaine calendaire précédente.
    - Semaine 1 = lun–ven de la semaine d'avant.
    - reference_date = vendredi fin de semaine 2.

    Example: lundi 22/06/2026 →
      Sem. 1 : 08/06 – 12/06 · Sem. 2 : 15/06 – 19/06 · période 08/06 – 19/06
    """
    override_start = os.getenv("SNOW_PERIOD_START")
    override_end = os.getenv("SNOW_PERIOD_END")
    if override_start and override_end:
        ref = reference_friday(date.fromisoformat(override_end))
        return override_start, override_end, ref.isoformat()

    today = run_date or date.today()
    current_week_monday = today - timedelta(days=today.weekday())
    week2_monday = current_week_monday - timedelta(days=7)
    week1_monday = current_week_monday - timedelta(days=14)
    period_start = week1_monday
    period_end = week2_monday + timedelta(days=4)
    return (
        period_start.isoformat(),
        period_end.isoformat(),
        period_end.isoformat(),
    )


def compute_test_current_period(run_date: date | None = None) -> tuple[str, str, str]:
    """
    Test mode: semaine courante (sem. 2) + semaine précédente (sem. 1).

    Sem. 2 = lundi courant → date du jour (ou vendredi si week-end).
    Sem. 1 = lun–ven de la semaine calendaire précédente.
    """
    today = run_date or date.today()
    if today.weekday() >= 5:
        today = today - timedelta(days=today.weekday() - 4)
    current_week_monday = today - timedelta(days=today.weekday())
    week1_monday = current_week_monday - timedelta(days=7)
    period_start = week1_monday
    period_end = today
    return (
        period_start.isoformat(),
        period_end.isoformat(),
        period_end.isoformat(),
    )


def resolve_period_and_mode(
    *,
    week_mode: str | None = None,
    period_start: str | None = None,
    period_end: str | None = None,
    run_date: date | None = None,
) -> tuple[str, str, str, str]:
    """
    Return (period_start, period_end, reference_date, effective_week_mode).

    Modes:
      - current_vs_previous : semaine courante vs semaine précédente
      - production          : 2 semaines complètes passées (rapport lundi)
    """
    mode = week_mode or os.getenv("KPI_WEEK_MODE", "production")
    if period_start and period_end:
        ref = period_end if mode == "current_vs_previous" else reference_friday(
            date.fromisoformat(period_end)
        ).isoformat()
        return period_start, period_end, ref, mode
    if mode == "current_vs_previous":
        p_start, p_end, ref = compute_test_current_period(run_date)
        return p_start, p_end, ref, mode
    p_start, p_end, ref = compute_biweekly_period(run_date)
    return p_start, p_end, ref, "production"
