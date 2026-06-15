from datetime import datetime

from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: int
    ticket_id: str
    channel: str
    event: str
    recipient: str
    status: str
    subject: str | None = None
    body: str | None = None
    detail: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationConfig(BaseModel):
    enabled: bool
    channels: dict
