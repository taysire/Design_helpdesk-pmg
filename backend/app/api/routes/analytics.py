from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ticket import Ticket
from app.schemas.analytics import DashboardAnalytics
from app.services.analytics import compute_dashboard

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _load_tickets(db: Session) -> list[Ticket]:
    return list(db.scalars(select(Ticket).order_by(Ticket.created_at.desc())).all())


@router.get("/dashboard", response_model=DashboardAnalytics)
def get_dashboard(
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
    db: Session = Depends(get_db),
) -> dict:
    tickets = _load_tickets(db)
    return compute_dashboard(tickets, lang=lang)


@router.get("/weekly-report", response_model=DashboardAnalytics)
def get_weekly_report(
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
    db: Session = Depends(get_db),
) -> dict:
    """Données KPI pour le rapport hebdomadaire (même agrégation que le dashboard)."""
    tickets = _load_tickets(db)
    return compute_dashboard(tickets, lang=lang)
