from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class TicketBase(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    category: str | None = None
    service_id: str | None = None
    request_type: str | None = None
    priority: str = "P3"
    status: str = "new"
    reporter_id: str = "me"
    assignee_id: str | None = None
    department: str | None = None
    body: str | None = None
    form_answers: dict[str, Any] | None = None
    jira_key: str | None = None
    slack_channel: str | None = None


class TicketCreate(TicketBase):
    id: str | None = None
    ticket_type: str = "incident"


class TicketRead(TicketBase):
    id: str
    ticket_type: str
    created_at: datetime
    first_response_at: datetime | None = None
    resolved_at: datetime | None = None
    closed_at: datetime | None = None
    updated_at: datetime

    model_config = {"from_attributes": True}
