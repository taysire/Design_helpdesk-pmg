"""Load Azure / email settings from environment (supports MS_* aliases)."""

from __future__ import annotations

import os

_PLACEHOLDERS = frozenset({
    "your-tenant-id",
    "your-client-id",
    "your-client-secret",
    "contoso.sharepoint.com",
    "helpdesk@contoso.com",
    "manager@contoso.com",
})


def _first_env(*keys: str) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value and value.strip() and value.strip() not in _PLACEHOLDERS:
            return value.strip()
    return None


def azure_credentials() -> tuple[str, str, str]:
    tenant = _first_env("AZURE_TENANT_ID", "MS_TENANT_ID")
    client_id = _first_env("AZURE_CLIENT_ID", "MS_CLIENT_ID")
    secret = _first_env("AZURE_CLIENT_SECRET", "MS_CLIENT_SECRET")
    missing = [
        name
        for name, val in (
            ("AZURE_TENANT_ID / MS_TENANT_ID", tenant),
            ("AZURE_CLIENT_ID / MS_CLIENT_ID", client_id),
            ("AZURE_CLIENT_SECRET / MS_CLIENT_SECRET", secret),
        )
        if not val
    ]
    if missing:
        raise KeyError(", ".join(missing))
    return tenant, client_id, secret


def graph_email_recipients() -> list[str]:
    raw = _first_env("GRAPH_EMAIL_TO", "SMTP_TO", "EMAIL", "MS_EMAIL")
    if not raw:
        return []
    return [addr.strip() for addr in raw.split(",") if addr.strip()]


def graph_sender_upn() -> str | None:
    return _first_env(
        "GRAPH_SENDER_UPN",
        "MS_SENDER_UPN",
        "SMTP_FROM",
        "MS_SENDER",
        "EMAIL",
    )
