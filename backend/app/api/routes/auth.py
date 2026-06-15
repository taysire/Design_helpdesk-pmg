from fastapi import APIRouter, Depends

from app.api.deps.auth import get_current_user
from app.schemas.auth import AuthConfigRead, UserRead
from app.services.auth import AuthUser, auth_config_payload

router = APIRouter(prefix="/api", tags=["auth"])


@router.get("/auth/config", response_model=AuthConfigRead)
def get_auth_config() -> dict:
    return auth_config_payload()


@router.get("/me", response_model=UserRead)
def get_me(user: AuthUser = Depends(get_current_user)) -> dict:
    return user.to_dict()
