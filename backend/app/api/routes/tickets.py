import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ticket import Ticket
from app.schemas.ticket import TicketCreate, TicketRead

router = APIRouter(prefix="/api/tickets", tags=["tickets"])


def _next_ticket_id(ticket_type: str, db: Session) -> str:
    prefix = "REQ" if ticket_type == "service" else "INC"
    suffix = uuid.uuid4().hex[:4].upper()
    return f"{prefix}-{suffix}"


@router.get("", response_model=list[TicketRead])
def list_tickets(db: Session = Depends(get_db)) -> list[Ticket]:
    return list(db.scalars(select(Ticket).order_by(Ticket.created_at.desc())).all())


@router.get("/{ticket_id}", response_model=TicketRead)
def get_ticket(ticket_id: str, db: Session = Depends(get_db)) -> Ticket:
    ticket = db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.post("", response_model=TicketRead, status_code=201)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)) -> Ticket:
    ticket_id = payload.id or _next_ticket_id(payload.ticket_type, db)
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
        status=payload.status,
        reporter_id=payload.reporter_id,
        assignee_id=payload.assignee_id,
        department=payload.department,
        body=payload.body,
        form_answers=payload.form_answers,
        jira_key=payload.jira_key,
        slack_channel=payload.slack_channel,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket
