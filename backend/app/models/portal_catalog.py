"""Modèles catalogue portail — incidents, groupes, services (Phase 7)."""

from sqlalchemy import Boolean, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PortalIncidentItem(Base):
    """Carte portail d'incident (AVD, Kroll, Imprimante, etc.)."""

    __tablename__ = "portal_incident_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    icon: Mapped[str] = mapped_column(String(64), nullable=False)
    ticket_category: Mapped[str] = mapped_column(String(64), nullable=False)
    portal_flow: Mapped[str | None] = mapped_column(String(64))
    prefill_problem_area: Mapped[str | None] = mapped_column(String(128))
    form_type: Mapped[str] = mapped_column(String(64), nullable=False, default="dynamic_incident")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class PortalIncidentGroup(Base):
    """Regroupement de cartes d'incidents pour l'affichage portail."""

    __tablename__ = "portal_incident_groups"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class ServiceCatalogItem(Base):
    """Demande de service planifiée (demande spéciale, arrivée, départ, matériel)."""

    __tablename__ = "service_catalog_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    icon: Mapped[str] = mapped_column(String(64), nullable=False)
    request_type: Mapped[str] = mapped_column(String(64), nullable=False)
    ticket_category: Mapped[str] = mapped_column(String(64), nullable=False)
    form_type: Mapped[str | None] = mapped_column(String(64))
    id_prefix: Mapped[str | None] = mapped_column(String(8))
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
