"""Service catalogue portail — persistance PostgreSQL + seed (Phase 7).

Le catalogue (cartes d'incidents, groupes, services) était auparavant figé dans
``app/data/portal_catalog.py``. Ces constantes servent désormais de **source de
seed** : au premier accès sur une base vide, elles sont insérées en base, puis
toute la lecture/écriture passe par PostgreSQL pour permettre l'administration.
"""

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.data.portal_catalog import (
    INCIDENT_FORM_TYPES,
    PORTAL_INCIDENT_GROUPS,
    PORTAL_INCIDENT_ITEMS,
    SERVICE_CATALOG,
    SERVICE_FORM_TYPES,
    SERVICE_ID_PREFIX,
)
from app.models.portal_catalog import (
    PortalIncidentGroup,
    PortalIncidentItem,
    ServiceCatalogItem,
)


# ── Seed idempotent ─────────────────────────────────────────────────────────--

def ensure_seeded(db: Session) -> None:
    """Insère le catalogue par défaut sur les tables encore vides."""

    seeded = False

    if db.scalar(select(func.count()).select_from(PortalIncidentItem)) == 0:
        for order, item in enumerate(PORTAL_INCIDENT_ITEMS):
            db.add(
                PortalIncidentItem(
                    id=item["id"],
                    icon=item["icon"],
                    ticket_category=item["ticket_category"],
                    portal_flow=item.get("portal_flow"),
                    prefill_problem_area=item.get("prefill_problem_area"),
                    form_type=INCIDENT_FORM_TYPES.get(item["id"], "dynamic_incident"),
                    sort_order=order,
                    is_active=True,
                )
            )
        seeded = True

    if db.scalar(select(func.count()).select_from(PortalIncidentGroup)) == 0:
        for order, group in enumerate(PORTAL_INCIDENT_GROUPS):
            db.add(
                PortalIncidentGroup(
                    id=group["id"],
                    item_ids=list(group["item_ids"]),
                    sort_order=order,
                )
            )
        seeded = True

    if db.scalar(select(func.count()).select_from(ServiceCatalogItem)) == 0:
        for order, svc in enumerate(SERVICE_CATALOG):
            db.add(
                ServiceCatalogItem(
                    id=svc["id"],
                    icon=svc["icon"],
                    request_type=svc["request_type"],
                    ticket_category=svc["ticket_category"],
                    form_type=SERVICE_FORM_TYPES.get(svc["id"]),
                    id_prefix=SERVICE_ID_PREFIX.get(svc["id"]),
                    sort_order=order,
                    is_active=True,
                )
            )
        seeded = True

    if seeded:
        db.commit()


# ── Lectures publiques (portail) ──────────────────────────────────────────────

def list_incident_items_public(db: Session) -> list[dict]:
    ensure_seeded(db)
    rows = db.scalars(
        select(PortalIncidentItem)
        .where(PortalIncidentItem.is_active.is_(True))
        .order_by(PortalIncidentItem.sort_order, PortalIncidentItem.id)
    ).all()
    return [
        {
            "id": r.id,
            "icon": r.icon,
            "ticket_category": r.ticket_category,
            "portal_flow": r.portal_flow,
            "prefill_problem_area": r.prefill_problem_area,
        }
        for r in rows
    ]


def list_incident_groups_public(db: Session) -> list[dict]:
    ensure_seeded(db)
    active_ids = set(
        db.scalars(
            select(PortalIncidentItem.id).where(PortalIncidentItem.is_active.is_(True))
        ).all()
    )
    rows = db.scalars(
        select(PortalIncidentGroup).order_by(PortalIncidentGroup.sort_order, PortalIncidentGroup.id)
    ).all()
    groups = []
    for r in rows:
        items = [i for i in (r.item_ids or []) if i in active_ids]
        if items:
            groups.append({"id": r.id, "item_ids": items})
    return groups


def list_service_items_public(db: Session) -> list[dict]:
    ensure_seeded(db)
    rows = db.scalars(
        select(ServiceCatalogItem)
        .where(ServiceCatalogItem.is_active.is_(True))
        .order_by(ServiceCatalogItem.sort_order, ServiceCatalogItem.id)
    ).all()
    return [
        {
            "id": r.id,
            "icon": r.icon,
            "request_type": r.request_type,
            "ticket_category": r.ticket_category,
        }
        for r in rows
    ]


def resolve_form_schema(db: Session, portal_id: str) -> dict | None:
    ensure_seeded(db)

    incident = db.get(PortalIncidentItem, portal_id)
    if incident:
        return {
            "portal_id": portal_id,
            "form_type": incident.form_type or "dynamic_incident",
            "ticket_type": "incident",
            "ticket_category": incident.ticket_category,
            "portal_flow": incident.portal_flow,
            "prefill_problem_area": incident.prefill_problem_area,
            "route": f"new:{portal_id}",
        }

    service = db.get(ServiceCatalogItem, portal_id)
    if service:
        return {
            "portal_id": portal_id,
            "form_type": service.form_type or "service_wizard",
            "ticket_type": "service",
            "ticket_category": service.ticket_category,
            "service_id": portal_id,
            "request_type": service.request_type,
            "route": f"service:{portal_id}",
        }

    return None


def get_service_id_prefix(db: Session, service_id: str | None) -> str:
    """Préfixe d'ID ticket pour une demande de service (REQ par défaut)."""
    if service_id:
        svc = db.get(ServiceCatalogItem, service_id)
        if svc and svc.id_prefix:
            return svc.id_prefix
    return "REQ"


# ── CRUD admin : incidents ────────────────────────────────────────────────────

def list_incident_items(db: Session) -> list[PortalIncidentItem]:
    ensure_seeded(db)
    return list(
        db.scalars(
            select(PortalIncidentItem).order_by(PortalIncidentItem.sort_order, PortalIncidentItem.id)
        ).all()
    )


def get_incident_item(db: Session, item_id: str) -> PortalIncidentItem | None:
    return db.get(PortalIncidentItem, item_id)


def create_incident_item(db: Session, data: dict) -> PortalIncidentItem:
    row = PortalIncidentItem(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_incident_item(db: Session, row: PortalIncidentItem, changes: dict) -> PortalIncidentItem:
    for key, value in changes.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_incident_item(db: Session, row: PortalIncidentItem) -> None:
    db.delete(row)
    db.commit()


# ── CRUD admin : groupes ──────────────────────────────────────────────────────

def list_incident_groups(db: Session) -> list[PortalIncidentGroup]:
    ensure_seeded(db)
    return list(
        db.scalars(
            select(PortalIncidentGroup).order_by(PortalIncidentGroup.sort_order, PortalIncidentGroup.id)
        ).all()
    )


def get_incident_group(db: Session, group_id: str) -> PortalIncidentGroup | None:
    return db.get(PortalIncidentGroup, group_id)


def create_incident_group(db: Session, data: dict) -> PortalIncidentGroup:
    row = PortalIncidentGroup(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_incident_group(db: Session, row: PortalIncidentGroup, changes: dict) -> PortalIncidentGroup:
    for key, value in changes.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_incident_group(db: Session, row: PortalIncidentGroup) -> None:
    db.delete(row)
    db.commit()


# ── CRUD admin : services ─────────────────────────────────────────────────────

def list_service_items(db: Session) -> list[ServiceCatalogItem]:
    ensure_seeded(db)
    return list(
        db.scalars(
            select(ServiceCatalogItem).order_by(ServiceCatalogItem.sort_order, ServiceCatalogItem.id)
        ).all()
    )


def get_service_item(db: Session, service_id: str) -> ServiceCatalogItem | None:
    return db.get(ServiceCatalogItem, service_id)


def create_service_item(db: Session, data: dict) -> ServiceCatalogItem:
    row = ServiceCatalogItem(**data)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_service_item(db: Session, row: ServiceCatalogItem, changes: dict) -> ServiceCatalogItem:
    for key, value in changes.items():
        setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_service_item(db: Session, row: ServiceCatalogItem) -> None:
    db.delete(row)
    db.commit()
