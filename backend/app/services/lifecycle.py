from datetime import UTC, datetime

from app.models.ticket import Ticket
from app.models.ticket_activity import TicketActivity

STATUS_LEGACY = {"triaged": "inprog", "waiting": "waiting_info"}


def normalize_status(status: str | None) -> str:
    if not status:
        return "new"
    return STATUS_LEGACY.get(status, status)


def _now() -> datetime:
    return datetime.now(UTC)


def record_opened(ticket: Ticket, who_id: str = "me", text: str | None = None) -> TicketActivity:
    activity = TicketActivity(
        ticket_id=ticket.id,
        kind="opened",
        who_id=who_id,
        text=text,
    )
    ticket.activities.append(activity)
    return activity


def apply_status_change(
    ticket: Ticket,
    new_status: str,
    who_id: str = "me",
) -> TicketActivity | None:
    old_status = normalize_status(ticket.status)
    next_status = normalize_status(new_status)
    if old_status == next_status:
        return None

    ticket.status = next_status
    now = _now()

    if next_status == "resolved" and old_status != "resolved":
        ticket.resolved_at = now
    if next_status == "closed" and old_status != "closed":
        ticket.closed_at = now
    if next_status == "inprog" and old_status in ("resolved", "closed"):
        ticket.resolved_at = None
        ticket.closed_at = None

    if old_status == "new" and next_status == "inprog" and ticket.first_response_at is None:
        ticket.first_response_at = now

    activity = TicketActivity(
        ticket_id=ticket.id,
        kind="status_change",
        who_id=who_id,
        from_status=old_status,
        to_status=next_status,
    )
    ticket.activities.append(activity)
    return activity


def apply_reopen(ticket: Ticket, who_id: str = "me", note: str | None = None) -> list[TicketActivity]:
    events: list[TicketActivity] = []
    status_evt = apply_status_change(ticket, "inprog", who_id)
    if status_evt:
        events.append(status_evt)
    reopen_evt = TicketActivity(
        ticket_id=ticket.id,
        kind="reopened",
        who_id=who_id,
        text=note,
    )
    ticket.activities.append(reopen_evt)
    events.append(reopen_evt)
    return events


def apply_comment(
    ticket: Ticket,
    text: str,
    who_id: str = "me",
    author_role: str = "it",
) -> TicketActivity:
    now = _now()
    if author_role in ("it", "admin") and ticket.first_response_at is None:
        ticket.first_response_at = now

    activity = TicketActivity(
        ticket_id=ticket.id,
        kind="comment",
        who_id=who_id,
        text=text,
        author_role=author_role,
    )
    ticket.activities.append(activity)
    return activity
