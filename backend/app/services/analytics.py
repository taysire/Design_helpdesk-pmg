"""Analytics helpdesk — KPI, SLA, agrégations (miroir de helpdesk-analytics.jsx)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from app.models.ticket import Ticket
from app.services.lifecycle import normalize_status

SLA_RESOLUTION_HOURS = {"P1": 4, "P2": 8, "P3": 24, "P4": 48}

SUPPORT_INCIDENT_CATEGORIES = frozenset(
    {"hardware", "avd", "kroll", "apps", "access", "materials"}
)

CATEGORY_LABELS: dict[str, dict[str, str]] = {
    "hardware": {"en": "Hardware", "fr": "Matériel"},
    "avd": {"en": "AVD", "fr": "AVD"},
    "kroll": {"en": "KROLL", "fr": "KROLL"},
    "apps": {"en": "In-house apps", "fr": "Applications internes"},
    "access": {"en": "Access", "fr": "Accès"},
    "materials": {"en": "Materials", "fr": "Matériel bureau"},
    "service": {"en": "Service", "fr": "Service"},
    "onboard": {"en": "Onboarding", "fr": "Intégration"},
    "offboard": {"en": "Offboarding", "fr": "Départ"},
}


def _now() -> datetime:
    return datetime.now(UTC)


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt


def start_of_day(d: datetime) -> datetime:
    x = _aware(d) or _now()
    return x.replace(hour=0, minute=0, second=0, microsecond=0)


def start_of_week(d: datetime) -> datetime:
    x = start_of_day(d)
    day = x.weekday()
    return x - timedelta(days=day)


def start_of_month(d: datetime) -> datetime:
    x = start_of_day(d)
    return x.replace(day=1)


def hours_between(a: datetime, b: datetime) -> float:
    return abs((_aware(b) or _now()) - (_aware(a) or _now())).total_seconds() / 3600


def is_ticket_active(status: str) -> bool:
    return normalize_status(status) not in ("resolved", "closed")


def is_waiting_status(status: str) -> bool:
    s = normalize_status(status)
    return s in ("waiting_info", "waiting_vendor")


def get_ticket_department(ticket: Ticket) -> str:
    if ticket.department:
        return ticket.department
    fa = ticket.form_answers or {}
    return fa.get("department") or "Non spécifié"


def get_ticket_created_at(ticket: Ticket) -> datetime:
    return _aware(ticket.created_at) or _now()


def get_ticket_resolved_at(ticket: Ticket) -> datetime | None:
    if ticket.resolved_at:
        return _aware(ticket.resolved_at)
    if normalize_status(ticket.status) != "resolved":
        return None
    return _aware(ticket.updated_at)


def get_ticket_closed_at(ticket: Ticket) -> datetime | None:
    if ticket.closed_at:
        return _aware(ticket.closed_at)
    if normalize_status(ticket.status) != "closed":
        return None
    return _aware(ticket.updated_at)


def get_first_response_at(ticket: Ticket) -> datetime | None:
    return _aware(ticket.first_response_at)


def is_support_incident(ticket: Ticket) -> bool:
    if ticket.category in SUPPORT_INCIDENT_CATEGORIES:
        return True
    fa = ticket.form_answers or {}
    return bool(
        fa.get("problem_area")
        or fa.get("avd_issue")
        or fa.get("kroll_issue")
        or fa.get("dsq_error")
        or fa.get("printer_problem")
        or fa.get("ringcentral_issue")
        or fa.get("access_issue")
    )


def get_incident_app_label(ticket: Ticket, lang: str = "fr") -> str | None:
    fa = ticket.form_answers or {}
    if fa.get("problem_area"):
        return fa["problem_area"]
    mapping = {
        "avd_issue": "AVD",
        "kroll_issue": "Kroll",
        "dsq_error": "DSQ",
        "printer_problem": "Imprimante",
        "ringcentral_issue": "RingCentral",
        "excel_issue": "Excel",
        "pbi_issue": "Power BI",
        "crm_issue": "Parcours CRM",
        "biometrx_issue": "BioMetrx",
        "access_issue": "Accès",
    }
    for key, label in mapping.items():
        if fa.get(key):
            return label
    if ticket.category in SUPPORT_INCIDENT_CATEGORIES:
        labels = CATEGORY_LABELS.get(ticket.category or "", {})
        return labels.get(lang) or labels.get("en") or ticket.category
    return None


def category_label(category: str | None, lang: str) -> str:
    if not category:
        return "—"
    labels = CATEGORY_LABELS.get(category, {})
    return labels.get(lang) or labels.get("en") or category


def is_in_range(date: datetime, start: datetime, end: datetime) -> bool:
    return start <= date < end


def count_in_period(tickets: list[Ticket], get_date, start: datetime, end: datetime) -> int:
    return sum(1 for tk in tickets if (d := get_date(tk)) and is_in_range(d, start, end))


def is_overdue(ticket: Ticket, now: datetime) -> bool:
    if not is_ticket_active(ticket.status):
        return False
    created = get_ticket_created_at(ticket)
    limit = SLA_RESOLUTION_HOURS.get(ticket.priority, SLA_RESOLUTION_HOURS["P4"])
    return hours_between(created, now) > limit


def compute_sla_compliance(tickets: list[Ticket]) -> dict[str, int]:
    closed = [
        tk
        for tk in tickets
        if normalize_status(tk.status) in ("resolved", "closed")
    ]
    if not closed:
        return {"rate": 100, "met": 0, "total": 0}
    met = 0
    for tk in closed:
        created = get_ticket_created_at(tk)
        done = get_ticket_resolved_at(tk) or get_ticket_closed_at(tk) or created
        limit = SLA_RESOLUTION_HOURS.get(tk.priority, SLA_RESOLUTION_HOURS["P4"])
        if hours_between(created, done) <= limit:
            met += 1
    total = len(closed)
    return {"rate": round((met / total) * 100), "met": met, "total": total}


def average_hours(tickets: list[Ticket], get_start, get_end) -> float | None:
    vals = []
    for tk in tickets:
        a, b = get_start(tk), get_end(tk)
        if a and b:
            h = hours_between(a, b)
            if h >= 0:
                vals.append(h)
    if not vals:
        return None
    return sum(vals) / len(vals)


def group_count(tickets: list[Ticket], key_fn) -> list[dict[str, Any]]:
    counts: dict[str, int] = {}
    for tk in tickets:
        key = key_fn(tk) or "—"
        counts[key] = counts.get(key, 0) + 1
    return [{"label": k, "value": v} for k, v in sorted(counts.items(), key=lambda x: -x[1])]


def with_percentages(items: list[dict[str, Any]], total_override: int | None = None) -> list[dict[str, Any]]:
    total = total_override or sum(d["value"] for d in items) or 1
    return [
        {**d, "pct": round((d["value"] / total) * 100), "rank": i + 1}
        for i, d in enumerate(items)
    ]


def weekly_volume(tickets: list[Ticket], weeks: int = 8) -> list[dict[str, Any]]:
    now = _now()
    result = []
    for i in range(weeks - 1, -1, -1):
        week_start = start_of_week(now) - timedelta(days=i * 7)
        week_end = week_start + timedelta(days=7)
        created = count_in_period(tickets, get_ticket_created_at, week_start, week_end)
        resolved = sum(
            1
            for tk in tickets
            if (d := get_ticket_resolved_at(tk) or get_ticket_closed_at(tk))
            and is_in_range(d, week_start, week_end)
        )
        label = week_start.strftime("%b %d")
        result.append(
            {
                "label": label,
                "created": created,
                "resolved": resolved,
                "week_start": week_start.isoformat(),
            }
        )
    return result


def compute_dashboard(tickets: list[Ticket], lang: str = "fr") -> dict[str, Any]:
    now = _now()
    today_start = start_of_day(now)
    tomorrow = today_start + timedelta(days=1)
    week_start = start_of_week(now)
    next_week = week_start + timedelta(days=7)
    month_start = start_of_month(now)
    if month_start.month == 12:
        next_month = month_start.replace(year=month_start.year + 1, month=1)
    else:
        next_month = month_start.replace(month=month_start.month + 1)
    prev_week_start = week_start - timedelta(days=7)

    open_tickets = [tk for tk in tickets if is_ticket_active(tk.status)]
    waiting = [tk for tk in tickets if is_waiting_status(tk.status)]
    overdue = [tk for tk in open_tickets if is_overdue(tk, now)]

    created_today = count_in_period(tickets, get_ticket_created_at, today_start, tomorrow)
    created_week = count_in_period(tickets, get_ticket_created_at, week_start, next_week)
    created_month = count_in_period(tickets, get_ticket_created_at, month_start, next_month)
    created_prev_week = count_in_period(tickets, get_ticket_created_at, prev_week_start, week_start)

    resolved_today = sum(
        1
        for tk in tickets
        if (d := get_ticket_resolved_at(tk)) and is_in_range(d, today_start, tomorrow)
    )
    resolved_week = sum(
        1
        for tk in tickets
        if (d := get_ticket_resolved_at(tk)) and is_in_range(d, week_start, next_week)
    )
    resolved_month = sum(
        1
        for tk in tickets
        if (d := get_ticket_resolved_at(tk)) and is_in_range(d, month_start, next_month)
    )
    resolved_prev_week = sum(
        1
        for tk in tickets
        if (d := get_ticket_resolved_at(tk)) and is_in_range(d, prev_week_start, week_start)
    )

    closed_today = sum(
        1
        for tk in tickets
        if (d := get_ticket_closed_at(tk)) and is_in_range(d, today_start, tomorrow)
    )
    closed_week = sum(
        1
        for tk in tickets
        if (d := get_ticket_closed_at(tk)) and is_in_range(d, week_start, next_week)
    )
    closed_month = sum(
        1
        for tk in tickets
        if (d := get_ticket_closed_at(tk)) and is_in_range(d, month_start, next_month)
    )

    sla = compute_sla_compliance(tickets)
    mttfr = average_hours(
        [tk for tk in tickets if get_first_response_at(tk)],
        get_ticket_created_at,
        get_first_response_at,
    )
    mttr = average_hours(
        [tk for tk in tickets if get_ticket_resolved_at(tk) or get_ticket_closed_at(tk)],
        get_ticket_created_at,
        lambda tk: get_ticket_resolved_at(tk) or get_ticket_closed_at(tk),
    )

    by_priority = group_count(tickets, lambda tk: tk.priority or "P4")
    by_category = group_count(tickets, lambda tk: category_label(tk.category, lang))
    dept_total = len(tickets)
    by_department = with_percentages(group_count(tickets, get_ticket_department)[:8], dept_total)

    incident_tickets = [tk for tk in tickets if is_support_incident(tk)]
    incident_total = len(incident_tickets) or 1
    top_incidents = with_percentages(
        [
            d
            for d in group_count(incident_tickets, lambda tk: get_incident_app_label(tk, lang))
            if d["label"] and d["label"] != "—"
        ][:10],
        incident_total,
    )

    weekly_trend = weekly_volume(tickets, 8)
    users_affected = group_count(
        [tk for tk in tickets if (tk.form_answers or {}).get("users_affected")],
        lambda tk: (tk.form_answers or {}).get("users_affected"),
    )

    return {
        "generated_at": now.isoformat(),
        "counts": {
            "created_today": created_today,
            "created_week": created_week,
            "created_month": created_month,
            "resolved_today": resolved_today,
            "resolved_week": resolved_week,
            "resolved_month": resolved_month,
            "closed_today": closed_today,
            "closed_week": closed_week,
            "closed_month": closed_month,
            "open": len(open_tickets),
            "waiting": len(waiting),
            "overdue": len(overdue),
        },
        "trends": {
            "created_week_delta": created_week - created_prev_week,
            "resolved_week_delta": resolved_week - resolved_prev_week,
            "created_prev_week": created_prev_week,
            "resolved_prev_week": resolved_prev_week,
        },
        "sla": sla,
        "mttfr": mttfr,
        "mttr": mttr,
        "by_priority": by_priority,
        "by_category": by_category,
        "by_department": by_department,
        "dept_total": dept_total,
        "top_incidents": top_incidents,
        "incident_total": len(incident_tickets),
        "weekly_trend": weekly_trend,
        "users_affected": users_affected,
        "overdue_tickets": [
            {
                "id": tk.id,
                "title": tk.title,
                "priority": tk.priority,
                "hours": round(hours_between(get_ticket_created_at(tk), now)),
            }
            for tk in overdue[:8]
        ],
    }
