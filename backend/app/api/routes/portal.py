from fastapi import APIRouter, HTTPException

from app.data.portal_catalog import (
    PORTAL_INCIDENT_GROUPS,
    PORTAL_INCIDENT_ITEMS,
    SERVICE_CATALOG,
    get_form_schema as resolve_form_schema,
)
from app.schemas.portal import (
    FormSchemaRead,
    PortalIncidentGroup,
    PortalIncidentItem,
    PortalServiceItem,
)

router = APIRouter(prefix="/api/portal", tags=["portal"])


@router.get("/incidents", response_model=list[PortalIncidentItem])
def list_portal_incidents() -> list[PortalIncidentItem]:
    return [PortalIncidentItem.model_validate(item) for item in PORTAL_INCIDENT_ITEMS]


@router.get("/incident-groups", response_model=list[PortalIncidentGroup])
def list_portal_incident_groups() -> list[PortalIncidentGroup]:
    return [PortalIncidentGroup.model_validate(group) for group in PORTAL_INCIDENT_GROUPS]


@router.get("/services", response_model=list[PortalServiceItem])
def list_portal_services() -> list[PortalServiceItem]:
    return [PortalServiceItem.model_validate(item) for item in SERVICE_CATALOG]


@router.get("/forms/{portal_id}", response_model=FormSchemaRead)
def get_form_schema(portal_id: str) -> FormSchemaRead:
    schema = resolve_form_schema(portal_id)
    if not schema:
        raise HTTPException(status_code=404, detail="Form schema not found")
    return FormSchemaRead.model_validate(schema)
