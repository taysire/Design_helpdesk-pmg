from app.api.routes.health import router as health_router
from app.api.routes.portal import router as portal_router
from app.api.routes.tickets import router as tickets_router

__all__ = ["health_router", "portal_router", "tickets_router"]
