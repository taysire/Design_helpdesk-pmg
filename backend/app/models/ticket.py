from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Ticket(Base):
    """Ticket helpdesk — incidents (INC) et demandes de service (REQ)."""

    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    ticket_type: Mapped[str] = mapped_column(String(16), default="incident", nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str | None] = mapped_column(String(64))
    service_id: Mapped[str | None] = mapped_column(String(64))
    request_type: Mapped[str | None] = mapped_column(String(64))
    priority: Mapped[str] = mapped_column(String(8), default="P3", nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="new", nullable=False)
    reporter_id: Mapped[str] = mapped_column(String(64), nullable=False)
    assignee_id: Mapped[str | None] = mapped_column(String(64))
    department: Mapped[str | None] = mapped_column(String(128))
    body: Mapped[str | None] = mapped_column(Text)
    form_answers: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    jira_key: Mapped[str | None] = mapped_column(String(64))
    slack_channel: Mapped[str | None] = mapped_column(String(128))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    first_response_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
