"""Load .env files and map MS_* aliases without exposing secrets."""

from __future__ import annotations

import os
from pathlib import Path


def bootstrap_env() -> None:
    """Load backend/.env then optional shared KPI .env; map legacy MS_* keys."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        load_dotenv = None

    backend_dir = Path(__file__).resolve().parents[1]
    candidates = [
        backend_dir / ".env",
        backend_dir.parent / "scripts" / "servicenow_kpi" / ".env",
    ]
    if load_dotenv:
        for path in candidates:
            if path.is_file():
                load_dotenv(path, override=False)

    _coalesce("GRAPH_TENANT_ID", "MS_TENANT_ID")
    _coalesce("GRAPH_CLIENT_ID", "MS_CLIENT_ID")
    _coalesce("GRAPH_CLIENT_SECRET", "MS_CLIENT_SECRET")
    _coalesce("GRAPH_SENDER_EMAIL", "GRAPH_SENDER_UPN", "EMAIL")


def _coalesce(target: str, *sources: str) -> None:
    if os.getenv(target):
        return
    for key in sources:
        value = os.getenv(key)
        if value:
            os.environ[target] = value
            return
