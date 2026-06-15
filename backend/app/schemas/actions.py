from pydantic import BaseModel

from app.schemas.notification import NotificationRead
from app.schemas.ticket import TicketRead


class TicketActionResponse(BaseModel):
    ticket: TicketRead
    notifications: list[NotificationRead] = []
