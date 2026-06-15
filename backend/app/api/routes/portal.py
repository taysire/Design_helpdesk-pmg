from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.kb import AnnouncementRead, ServiceStatusRead
from app.schemas.portal import (
    FormSchemaRead,
    PortalIncidentGroup,
    PortalIncidentItem,
    PortalServiceItem,
)
from app.services import portal_store as store
from app.services.kb import list_announcements, list_service_status

router = APIRouter(prefix="/api/portal", tags=["portal"])


@router.get("/incidents", response_model=list[PortalIncidentItem])
def list_portal_incidents(db: Session = Depends(get_db)) -> list[PortalIncidentItem]:
    return [PortalIncidentItem.model_validate(item) for item in store.list_incident_items_public(db)]


@router.get("/incident-groups", response_model=list[PortalIncidentGroup])
def list_portal_incident_groups(db: Session = Depends(get_db)) -> list[PortalIncidentGroup]:
    return [PortalIncidentGroup.model_validate(group) for group in store.list_incident_groups_public(db)]


@router.get("/services", response_model=list[PortalServiceItem])
def list_portal_services(db: Session = Depends(get_db)) -> list[PortalServiceItem]:
    return [PortalServiceItem.model_validate(item) for item in store.list_service_items_public(db)]


@router.get("/announcements", response_model=list[AnnouncementRead])
def list_portal_announcements(
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
) -> list[dict]:
    return list_announcements(lang=lang)


@router.get("/service-status", response_model=list[ServiceStatusRead])
def list_service_status_endpoint(
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
) -> list[dict]:
    return list_service_status(lang=lang)


@router.get("/forms/{portal_id}", response_model=FormSchemaRead)
def get_form_schema(portal_id: str, db: Session = Depends(get_db)) -> FormSchemaRead:
    schema = store.resolve_form_schema(db, portal_id)
    if not schema:
        raise HTTPException(status_code=404, detail="Form schema not found")
    return FormSchemaRead.model_validate(schema)
