from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics_router, health_router, kb_router, notifications_router, portal_router, tickets_router
from app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="PMG Helpdesk API",
    description="Backend Python (FastAPI) — tickets, portail, SLA, analytics",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(portal_router)
app.include_router(tickets_router)
app.include_router(analytics_router)
app.include_router(notifications_router)
app.include_router(kb_router)
