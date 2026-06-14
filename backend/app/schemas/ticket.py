from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ActivityRead(BaseModel):
    id: int
    kind: str
    who_id: str
    text: str | None = None
    from_status: str | None = None
    to_status: str | None = None
    author_role: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


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


class TicketUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    category: str | None = None
    service_id: str | None = None
    request_type: str | None = None
    priority: str | None = None
    status: str | None = None
    assignee_id: str | None = None
    department: str | None = None
    body: str | None = None
    form_answers: dict[str, Any] | None = None
    jira_key: str | None = None
    slack_channel: str | None = None
    reopen_note: str | None = None


class CommentCreate(BaseModel):
    text: str = Field(min_length=1, max_length=10000)
    who_id: str = "me"
    author_role: str = "it"


class TicketRead(TicketBase):
    id: str
    ticket_type: str
    created_at: datetime
    first_response_at: datetime | None = None
    resolved_at: datetime | None = None
    closed_at: datetime | None = None
    updated_at: datetime
    activities: list[ActivityRead] = []

    model_config = {"from_attributes": True}
