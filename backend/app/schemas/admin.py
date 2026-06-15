"""Schémas admin — CRUD catalogue portail (Phase 7)."""

from pydantic import BaseModel, ConfigDict, Field


# ── Incident items ────────────────────────────────────────────────────────────

class IncidentItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    icon: str
    ticket_category: str
    portal_flow: str | None = None
    prefill_problem_area: str | None = None
    form_type: str = "dynamic_incident"
    sort_order: int = 0
    is_active: bool = True


class IncidentItemCreate(BaseModel):
    id: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    icon: str = Field(min_length=1, max_length=64)
    ticket_category: str = Field(min_length=1, max_length=64)
    portal_flow: str | None = Field(default=None, max_length=64)
    prefill_problem_area: str | None = Field(default=None, max_length=128)
    form_type: str = Field(default="dynamic_incident", max_length=64)
    sort_order: int = 0
    is_active: bool = True


class IncidentItemUpdate(BaseModel):
    icon: str | None = Field(default=None, min_length=1, max_length=64)
    ticket_category: str | None = Field(default=None, min_length=1, max_length=64)
    portal_flow: str | None = Field(default=None, max_length=64)
    prefill_problem_area: str | None = Field(default=None, max_length=128)
    form_type: str | None = Field(default=None, max_length=64)
    sort_order: int | None = None
    is_active: bool | None = None


# ── Incident groups ─────────────────────────────────────────────────────────--

class IncidentGroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    item_ids: list[str]
    sort_order: int = 0


class IncidentGroupCreate(BaseModel):
    id: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    item_ids: list[str] = Field(default_factory=list)
    sort_order: int = 0


class IncidentGroupUpdate(BaseModel):
    item_ids: list[str] | None = None
    sort_order: int | None = None


# ── Service catalog ───────────────────────────────────────────────────────────

class ServiceItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    icon: str
    request_type: str
    ticket_category: str
    form_type: str | None = None
    id_prefix: str | None = None
    sort_order: int = 0
    is_active: bool = True


class ServiceItemCreate(BaseModel):
    id: str = Field(min_length=1, max_length=64, pattern=r"^[a-z0-9-]+$")
    icon: str = Field(min_length=1, max_length=64)
    request_type: str = Field(min_length=1, max_length=64)
    ticket_category: str = Field(min_length=1, max_length=64)
    form_type: str | None = Field(default=None, max_length=64)
    id_prefix: str | None = Field(default=None, max_length=8)
    sort_order: int = 0
    is_active: bool = True


class ServiceItemUpdate(BaseModel):
    icon: str | None = Field(default=None, min_length=1, max_length=64)
    request_type: str | None = Field(default=None, min_length=1, max_length=64)
    ticket_category: str | None = Field(default=None, min_length=1, max_length=64)
    form_type: str | None = Field(default=None, max_length=64)
    id_prefix: str | None = Field(default=None, max_length=8)
    sort_order: int | None = None
    is_active: bool | None = None
