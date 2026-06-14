from app.api.routes.health import router as health_router
from app.api.routes.tickets import router as tickets_router

__all__ = ["health_router", "tickets_router"]
