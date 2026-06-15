from app.api.routes.kb import router as kb_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.health import router as health_router
from app.api.routes.notifications import router as notifications_router
from app.api.routes.portal import router as portal_router
from app.api.routes.tickets import router as tickets_router

__all__ = ["analytics_router", "health_router", "kb_router", "notifications_router", "portal_router", "tickets_router"]
