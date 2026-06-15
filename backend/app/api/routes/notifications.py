from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationConfig, NotificationRead
from app.services.notifications import get_notification_config

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("/config", response_model=NotificationConfig)
def notifications_config() -> dict:
    return get_notification_config()


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    ticket_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[Notification]:
    stmt = select(Notification).order_by(Notification.created_at.desc()).limit(limit)
    if ticket_id:
        stmt = stmt.where(Notification.ticket_id == ticket_id)
    return list(db.scalars(stmt).all())
