"""Microsoft Graph sendMail client for ticket notifications."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import httpx
import msal

if TYPE_CHECKING:
    from app.config import Settings

logger = logging.getLogger(__name__)

GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]
GRAPH_BASE = "https://graph.microsoft.com/v1.0"


class GraphMailError(Exception):
    """Raised when Graph authentication or sendMail fails."""


class GraphMailClient:
    """Send transactional email via Microsoft Graph (application permissions)."""

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._token: str | None = None
        self._msal_app: msal.ConfidentialClientApplication | None = None

    def is_configured(self) -> bool:
        return bool(
            self._settings.graph_tenant_id
            and self._settings.graph_client_id
            and self._settings.graph_client_secret
            and self._settings.graph_sender_email
        )

    def _msal(self) -> msal.ConfidentialClientApplication:
        if self._msal_app is None:
            self._msal_app = msal.ConfidentialClientApplication(
                self._settings.graph_client_id,
                authority=f"https://login.microsoftonline.com/{self._settings.graph_tenant_id}",
                client_credential=self._settings.graph_client_secret,
            )
        return self._msal_app

    def _acquire_token(self) -> str:
        result = self._msal().acquire_token_for_client(scopes=GRAPH_SCOPE)
        if "access_token" not in result:
            detail = result.get("error_description") or result.get("error") or result
            raise GraphMailError(f"Graph authentication failed: {detail}")
        return result["access_token"]

    @property
    def token(self) -> str:
        if self._token is None:
            self._token = self._acquire_token()
        return self._token

    def send_mail(
        self,
        *,
        to: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> None:
        if not self.is_configured():
            raise GraphMailError("Graph mail is not configured (missing GRAPH_* settings).")

        payload = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML",
                    "content": html_body,
                },
                "toRecipients": [{"emailAddress": {"address": to}}],
            },
            "saveToSentItems": True,
        }

        url = f"{GRAPH_BASE}/users/{self._settings.graph_sender_email}/sendMail"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

        try:
            with httpx.Client(timeout=20.0) as client:
                response = client.post(url, headers=headers, json=payload)
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise GraphMailError(f"Graph sendMail failed: {exc}") from exc

        logger.info("Graph email sent to %s | %s", to, subject)
