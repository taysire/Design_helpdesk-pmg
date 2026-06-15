"""Routes admin — CRUD catalogue portail (Phase 7). Réservé au rôle admin."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps.auth import require_admin_user
from app.db.session import get_db
from app.schemas.admin import (
    IncidentGroupCreate,
    IncidentGroupRead,
    IncidentGroupUpdate,
    IncidentItemCreate,
    IncidentItemRead,
    IncidentItemUpdate,
    ServiceItemCreate,
    ServiceItemRead,
    ServiceItemUpdate,
)
from app.services import portal_store as store

router = APIRouter(
    prefix="/api/admin/portal",
    tags=["admin"],
    dependencies=[Depends(require_admin_user)],
)


# ── Incident items ────────────────────────────────────────────────────────────

@router.get("/incidents", response_model=list[IncidentItemRead])
def admin_list_incidents(db: Session = Depends(get_db)) -> list:
    return store.list_incident_items(db)


@router.post("/incidents", response_model=IncidentItemRead, status_code=201)
def admin_create_incident(payload: IncidentItemCreate, db: Session = Depends(get_db)) -> object:
    if store.get_incident_item(db, payload.id):
        raise HTTPException(status_code=409, detail="Incident item already exists")
    return store.create_incident_item(db, payload.model_dump())


@router.get("/incidents/{item_id}", response_model=IncidentItemRead)
def admin_get_incident(item_id: str, db: Session = Depends(get_db)) -> object:
    row = store.get_incident_item(db, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Incident item not found")
    return row


@router.patch("/incidents/{item_id}", response_model=IncidentItemRead)
def admin_update_incident(item_id: str, payload: IncidentItemUpdate, db: Session = Depends(get_db)) -> object:
    row = store.get_incident_item(db, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Incident item not found")
    return store.update_incident_item(db, row, payload.model_dump(exclude_unset=True))


@router.delete("/incidents/{item_id}", status_code=204)
def admin_delete_incident(item_id: str, db: Session = Depends(get_db)) -> None:
    row = store.get_incident_item(db, item_id)
    if not row:
        raise HTTPException(status_code=404, detail="Incident item not found")
    store.delete_incident_item(db, row)


# ── Incident groups ───────────────────────────────────────────────────────────

@router.get("/incident-groups", response_model=list[IncidentGroupRead])
def admin_list_groups(db: Session = Depends(get_db)) -> list:
    return store.list_incident_groups(db)


@router.post("/incident-groups", response_model=IncidentGroupRead, status_code=201)
def admin_create_group(payload: IncidentGroupCreate, db: Session = Depends(get_db)) -> object:
    if store.get_incident_group(db, payload.id):
        raise HTTPException(status_code=409, detail="Incident group already exists")
    return store.create_incident_group(db, payload.model_dump())


@router.get("/incident-groups/{group_id}", response_model=IncidentGroupRead)
def admin_get_group(group_id: str, db: Session = Depends(get_db)) -> object:
    row = store.get_incident_group(db, group_id)
    if not row:
        raise HTTPException(status_code=404, detail="Incident group not found")
    return row


@router.patch("/incident-groups/{group_id}", response_model=IncidentGroupRead)
def admin_update_group(group_id: str, payload: IncidentGroupUpdate, db: Session = Depends(get_db)) -> object:
    row = store.get_incident_group(db, group_id)
    if not row:
        raise HTTPException(status_code=404, detail="Incident group not found")
    return store.update_incident_group(db, row, payload.model_dump(exclude_unset=True))


@router.delete("/incident-groups/{group_id}", status_code=204)
def admin_delete_group(group_id: str, db: Session = Depends(get_db)) -> None:
    row = store.get_incident_group(db, group_id)
    if not row:
        raise HTTPException(status_code=404, detail="Incident group not found")
    store.delete_incident_group(db, row)


# ── Service catalog ───────────────────────────────────────────────────────────

@router.get("/services", response_model=list[ServiceItemRead])
def admin_list_services(db: Session = Depends(get_db)) -> list:
    return store.list_service_items(db)


@router.post("/services", response_model=ServiceItemRead, status_code=201)
def admin_create_service(payload: ServiceItemCreate, db: Session = Depends(get_db)) -> object:
    if store.get_service_item(db, payload.id):
        raise HTTPException(status_code=409, detail="Service item already exists")
    return store.create_service_item(db, payload.model_dump())


@router.get("/services/{service_id}", response_model=ServiceItemRead)
def admin_get_service(service_id: str, db: Session = Depends(get_db)) -> object:
    row = store.get_service_item(db, service_id)
    if not row:
        raise HTTPException(status_code=404, detail="Service item not found")
    return row


@router.patch("/services/{service_id}", response_model=ServiceItemRead)
def admin_update_service(service_id: str, payload: ServiceItemUpdate, db: Session = Depends(get_db)) -> object:
    row = store.get_service_item(db, service_id)
    if not row:
        raise HTTPException(status_code=404, detail="Service item not found")
    return store.update_service_item(db, row, payload.model_dump(exclude_unset=True))


@router.delete("/services/{service_id}", status_code=204)
def admin_delete_service(service_id: str, db: Session = Depends(get_db)) -> None:
    row = store.get_service_item(db, service_id)
    if not row:
        raise HTTPException(status_code=404, detail="Service item not found")
    store.delete_service_item(db, row)
