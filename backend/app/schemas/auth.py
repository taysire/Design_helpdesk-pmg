from pydantic import BaseModel


class AuthConfigRead(BaseModel):
    mode: str
    entra_configured: bool
    tenant_id: str | None = None
    client_id: str | None = None
    api_scope: str | None = None


class UserRead(BaseModel):
    id: str
    name: str
    email: str
    role: str
    roles: list[str] = []
    is_it: bool = False
    is_admin: bool = False
