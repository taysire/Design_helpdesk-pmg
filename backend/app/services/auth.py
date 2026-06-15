"""Authentification Entra ID (JWT) et mode dev."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from functools import lru_cache

import jwt
from jwt import PyJWKClient

from app.config import Settings, get_settings

logger = logging.getLogger(__name__)

APP_ROLES_IT = {"Helpdesk.Agent", "Helpdesk.IT", "IT.Agent"}
APP_ROLES_ADMIN = {"Helpdesk.Admin", "IT.Admin", "Administrator"}
DEV_BEARER = "dev-token"


@dataclass(frozen=True)
class AuthUser:
    id: str
    name: str
    email: str
    role: str
    roles: tuple[str, ...] = ()

    @property
    def is_it(self) -> bool:
        return self.role in ("it", "admin")

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "roles": list(self.roles),
            "is_it": self.is_it,
            "is_admin": self.is_admin,
        }


def auth_mode(settings: Settings | None = None) -> str:
    settings = settings or get_settings()
    if (
        settings.auth_mode == "entra"
        and settings.entra_tenant_id
        and settings.entra_client_id
    ):
        return "entra"
    return "dev"


def entra_is_configured(settings: Settings | None = None) -> bool:
    settings = settings or get_settings()
    return bool(settings.entra_tenant_id and settings.entra_client_id)


def api_scope(settings: Settings | None = None) -> str | None:
    settings = settings or get_settings()
    if settings.entra_api_scope:
        return settings.entra_api_scope
    if settings.entra_client_id:
        return f"api://{settings.entra_client_id}/access_as_user"
    return None


def auth_config_payload(settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    mode = auth_mode(settings)
    return {
        "mode": mode,
        "entra_configured": entra_is_configured(settings),
        "tenant_id": settings.entra_tenant_id or None,
        "client_id": settings.entra_client_id or None,
        "api_scope": api_scope(settings) if entra_is_configured(settings) else None,
    }


def _map_entra_roles(claim_roles: list[str] | None) -> str:
    roles = set(claim_roles or [])
    if roles & APP_ROLES_ADMIN:
        return "admin"
    if roles & APP_ROLES_IT:
        return "it"
    return "enduser"


def dev_user(
    user_id: str | None = None,
    role: str | None = None,
    settings: Settings | None = None,
) -> AuthUser:
    settings = settings or get_settings()
    uid = (user_id or settings.auth_dev_user_id or "me").strip()
    app_role = (role or settings.auth_dev_role or "it").strip().lower()
    if app_role not in ("enduser", "it", "admin"):
        app_role = "enduser"
    names = {
        "me": ("You", "you@pmg.com"),
        "jd": ("Jordan D.", "jordan@pmg.com"),
        "sc": ("Sarah C.", "sarah@pmg.com"),
    }
    name, email = names.get(uid, (uid, f"{uid}@pmg.com"))
    return AuthUser(id=uid, name=name, email=email, role=app_role, roles=(app_role,))


@lru_cache
def _jwks_client(tenant_id: str) -> PyJWKClient:
    url = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
    return PyJWKClient(url)


def decode_entra_token(token: str, settings: Settings | None = None) -> dict:
    settings = settings or get_settings()
    if not settings.entra_tenant_id:
        raise ValueError("Entra tenant not configured")
    client = _jwks_client(settings.entra_tenant_id)
    signing_key = client.get_signing_key_from_jwt(token)
    audiences = [a for a in (settings.entra_audience, settings.entra_client_id, api_scope(settings)) if a]
    last_error: Exception | None = None
    for audience in audiences:
        try:
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=f"https://login.microsoftonline.com/{settings.entra_tenant_id}/v2.0",
                options={"verify_aud": bool(audience)},
            )
        except jwt.PyJWTError as exc:
            last_error = exc
    if last_error:
        raise last_error
    raise jwt.PyJWTError("No valid audience configured")


def user_from_claims(claims: dict) -> AuthUser:
    user_id = (
        claims.get("oid")
        or claims.get("sub")
        or claims.get("preferred_username")
        or "unknown"
    )
    email = (
        claims.get("preferred_username")
        or claims.get("email")
        or claims.get("upn")
        or ""
    )
    name = claims.get("name") or email.split("@")[0] or "User"
    entra_roles = claims.get("roles") or []
    app_role = _map_entra_roles(entra_roles if isinstance(entra_roles, list) else [])
    return AuthUser(
        id=str(user_id),
        name=str(name),
        email=str(email),
        role=app_role,
        roles=tuple(entra_roles) if isinstance(entra_roles, list) else (),
    )


def resolve_user(
    authorization: str | None = None,
    dev_user_id: str | None = None,
    dev_role: str | None = None,
    settings: Settings | None = None,
) -> AuthUser:
    settings = settings or get_settings()
    mode = auth_mode(settings)

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
        if mode == "dev" and token == DEV_BEARER:
            return dev_user(dev_user_id, dev_role, settings)
        if mode == "entra":
            claims = decode_entra_token(token, settings)
            return user_from_claims(claims)
        if mode == "dev":
            return dev_user(dev_user_id, dev_role, settings)

    if mode == "dev":
        return dev_user(dev_user_id, dev_role, settings)

    raise PermissionError("Authentication required")


def require_roles(user: AuthUser, *allowed: str) -> None:
    if user.role not in allowed:
        raise PermissionError(f"Role '{user.role}' is not allowed for this action")
