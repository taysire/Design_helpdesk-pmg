from pydantic import BaseModel


class PortalIncidentItem(BaseModel):
    id: str
    icon: str
    ticket_category: str
    portal_flow: str | None = None
    prefill_problem_area: str | None = None


class PortalIncidentGroup(BaseModel):
    id: str
    item_ids: list[str]


class PortalServiceItem(BaseModel):
    id: str
    icon: str
    request_type: str
    ticket_category: str


class FormSchemaRead(BaseModel):
    portal_id: str
    form_type: str
    ticket_type: str
    ticket_category: str
    portal_flow: str | None = None
    prefill_problem_area: str | None = None
    service_id: str | None = None
    request_type: str | None = None
    route: str
