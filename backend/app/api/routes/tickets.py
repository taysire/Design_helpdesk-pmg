import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.data.portal_catalog import SERVICE_ID_PREFIX
from app.db.session import get_db
from app.models.ticket import Ticket
from app.schemas.actions import TicketActionResponse
from app.schemas.ticket import CommentCreate, TicketCreate, TicketRead, TicketUpdate
from app.services.lifecycle import (
    apply_comment,
    apply_reopen,
    apply_status_change,
    normalize_status,
    record_opened,
)
from app.services.notifications import (
    dispatch_comment,
    dispatch_status_change,
    dispatch_ticket_created,
)

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def _next_ticket_id(ticket_type: str, service_id: str | None = None) -> str:
    if ticket_type == "service":
        prefix = SERVICE_ID_PREFIX.get(service_id or "", "REQ")
    else:
        prefix = "INC"
    suffix = uuid.uuid4().hex[:4].upper()
    return f"{prefix}-{suffix}"


def _get_ticket_or_404(ticket_id: str, db: Session) -> Ticket:
    ticket = db.scalar(
        select(Ticket)
        .options(selectinload(Ticket.activities))
        .where(Ticket.id == ticket_id)
    )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


def _action_response(ticket: Ticket, notifications: list) -> dict:
    return {
        "ticket": ticket,
        "notifications": notifications,
    }


@router.get("", response_model=list[TicketRead])
def list_tickets(
    q: str | None = Query(default=None, description="Recherche texte (id, titre, corps)"),
    status: str | None = Query(default=None),
    category: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    reporter_id: str | None = Query(default=None),
    assignee_id: str | None = Query(default=None),
    service_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[Ticket]:
    stmt = select(Ticket).options(selectinload(Ticket.activities)).order_by(Ticket.created_at.desc())

    if q:
        pattern = f"%{q.strip()}%"
        stmt = stmt.where(
            or_(
                Ticket.id.ilike(pattern),
                Ticket.title.ilike(pattern),
                Ticket.body.ilike(pattern),
            )
        )
    if status:
        stmt = stmt.where(Ticket.status == normalize_status(status))
    if category:
        stmt = stmt.where(Ticket.category == category)
    if priority:
        stmt = stmt.where(Ticket.priority == priority)
    if reporter_id:
        stmt = stmt.where(Ticket.reporter_id == reporter_id)
    if assignee_id:
        stmt = stmt.where(Ticket.assignee_id == assignee_id)
    if service_id:
        stmt = stmt.where(Ticket.service_id == service_id)

    return list(db.scalars(stmt).all())


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)) -> Ticket:
    return _get_ticket_or_404(ticket_id, db)


@router.post("", response_model=TicketActionResponse, status_code=201)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)) -> dict:
    ticket_id = payload.id or _next_ticket_id(payload.ticket_type, payload.service_id)
    if db.get(Ticket, ticket_id):
        raise HTTPException(status_code=409, detail="Ticket id already exists")

    ticket = Ticket(
        id=ticket_id,
        ticket_type=payload.ticket_type,
        title=payload.title,
        category=payload.category,
        service_id=payload.service_id,
        request_type=payload.request_type,
        priority=payload.priority,
        status=normalize_status(payload.status),
        reporter_id=payload.reporter_id,
        assignee_id=payload.assignee_id,
        department=payload.department,
        body=payload.body,
        form_answers=payload.form_answers,
        jira_key=payload.jira_key,
        slack_channel=payload.slack_channel,
    )
    record_opened(ticket, who_id=payload.reporter_id)
    db.add(ticket)
    db.flush()
    notifications = dispatch_ticket_created(db, ticket)
    db.commit()
    return _action_response(_get_ticket_or_404(ticket.id, db), notifications)


@router.patch("/{ticket_id}", response_model=TicketActionResponse)
def update_ticket(ticket_id: str, payload: TicketUpdate, db: Session = Depends(get_db)) -> dict:
    ticket = _get_ticket_or_404(ticket_id, db)
    data = payload.model_dump(exclude_unset=True)
    reopen_note = data.pop("reopen_note", None)
    notifications: list = []
    old_status = normalize_status(ticket.status)

    if "status" in data:
        new_status = normalize_status(data.pop("status"))
        if new_status == "inprog" and old_status in ("resolved", "closed"):
            apply_reopen(ticket, who_id="me", note=reopen_note)
            notifications.extend(dispatch_status_change(db, ticket, old_status, new_status))
        elif new_status != old_status:
            apply_status_change(ticket, new_status, who_id="me")
            notifications.extend(dispatch_status_change(db, ticket, old_status, new_status))

    for field, value in data.items():
        if field == "status":
            continue
        setattr(ticket, field, value)

    db.commit()
    return _action_response(_get_ticket_or_404(ticket_id, db), notifications)


@router.post("/{ticket_id}/comments", response_model=TicketActionResponse, status_code=201)
def add_comment(ticket_id: str, payload: CommentCreate, db: Session = Depends(get_db)) -> dict:
    ticket = _get_ticket_or_404(ticket_id, db)
    apply_comment(
        ticket,
        text=payload.text.strip(),
        who_id=payload.who_id,
        author_role=payload.author_role,
    )
    notifications = dispatch_comment(db, ticket, payload.author_role, payload.text.strip())
    db.commit()
    return _action_response(_get_ticket_or_404(ticket_id, db), notifications)
