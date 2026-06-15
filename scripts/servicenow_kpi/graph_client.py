"""Microsoft Graph API client (MSAL client-credentials)."""

from __future__ import annotations

import os
from typing import Any

import msal
import requests

from env_loader import azure_credentials

GRAPH_SCOPE = ["https://graph.microsoft.com/.default"]
GRAPH_BASE = "https://graph.microsoft.com/v1.0"


class GraphClient:
    """Authenticate and call Microsoft Graph with application permissions."""

    def __init__(
        self,
        tenant_id: str | None = None,
        client_id: str | None = None,
        client_secret: str | None = None,
    ) -> None:
        if tenant_id and client_id and client_secret:
            self.tenant_id, self.client_id, self.client_secret = tenant_id, client_id, client_secret
        else:
            self.tenant_id, self.client_id, self.client_secret = azure_credentials()
        self._token: str | None = None
        self._app = msal.ConfidentialClientApplication(
            self.client_id,
            authority=f"https://login.microsoftonline.com/{self.tenant_id}",
            client_credential=self.client_secret,
        )

    def _acquire_token(self) -> str:
        result = self._app.acquire_token_for_client(scopes=GRAPH_SCOPE)
        if "access_token" not in result:
            detail = result.get("error_description") or result.get("error") or result
            raise RuntimeError(f"Graph authentication failed: {detail}")
        return result["access_token"]

    @property
    def token(self) -> str:
        if not self._token:
            self._token = self._acquire_token()
        return self._token

    @property
    def headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.token}"}

    def get(self, url: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        response = requests.get(url, headers=self.headers, params=params, timeout=90)
        response.raise_for_status()
        return response.json()

    def post(self, url: str, payload: dict[str, Any]) -> None:
        response = requests.post(
            url,
            headers={**self.headers, "Content-Type": "application/json"},
            json=payload,
            timeout=90,
        )
        response.raise_for_status()

    def get_paginated(self, url: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        next_url: str | None = url
        first = True
        while next_url:
            data = self.get(next_url, params=params if first else None)
            items.extend(data.get("value", []))
            next_url = data.get("@odata.nextLink")
            first = False
        return items
