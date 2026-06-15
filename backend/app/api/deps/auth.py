from fastapi import Depends, Header, HTTPException

from app.config import get_settings
from app.services.auth import AuthUser, auth_mode, require_roles, resolve_user


def get_current_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_dev_user_id: str | None = Header(default=None, alias="X-Dev-User-Id"),
    x_dev_role: str | None = Header(default=None, alias="X-Dev-Role"),
) -> AuthUser:
    settings = get_settings()
    try:
        return resolve_user(
            authorization=authorization,
            dev_user_id=x_dev_user_id,
            dev_role=x_dev_role,
            settings=settings,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def get_optional_user(
    authorization: str | None = Header(default=None, alias="Authorization"),
    x_dev_user_id: str | None = Header(default=None, alias="X-Dev-User-Id"),
    x_dev_role: str | None = Header(default=None, alias="X-Dev-Role"),
) -> AuthUser | None:
    if not authorization and auth_mode() == "entra":
        return None
    try:
        return resolve_user(
            authorization=authorization,
            dev_user_id=x_dev_user_id,
            dev_role=x_dev_role,
        )
    except Exception:
        return None


def require_it_user(user: AuthUser = Depends(get_current_user)) -> AuthUser:
    try:
        require_roles(user, "it", "admin")
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    return user
