"""Tests authentification — Phase 1."""

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.auth import DEV_BEARER

pytestmark = pytest.mark.skipif(
    os.getenv("PMG_SKIP_DB_TESTS") == "1",
    reason="PMG_SKIP_DB_TESTS=1",
)


@pytest.fixture
def client():
    return TestClient(app)


def test_auth_config_dev_mode(client: TestClient):
    res = client.get("/api/auth/config")
    assert res.status_code == 200
    data = res.json()
    assert data["mode"] == "dev"
    assert data["entra_configured"] is False


def test_me_dev_default(client: TestClient):
    res = client.get("/api/me")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "me"
    assert data["role"] == "it"
    assert data["is_it"] is True


def test_me_dev_bearer_enduser(client: TestClient):
    res = client.get(
        "/api/me",
        headers={
            "Authorization": f"Bearer {DEV_BEARER}",
            "X-Dev-Role": "enduser",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "enduser"
    assert data["is_it"] is False


def test_me_dev_role_header(client: TestClient):
    res = client.get("/api/me", headers={"X-Dev-Role": "admin"})
    assert res.status_code == 200
    data = res.json()
    assert data["role"] == "admin"
    assert data["is_admin"] is True


def test_tickets_patch_requires_it_role(client: TestClient):
    create = client.post(
        "/api/tickets",
        json={
            "ticket_type": "incident",
            "title": "Auth RBAC test",
            "priority": "P3",
            "status": "new",
            "reporter_id": "me",
        },
        headers={"X-Dev-Role": "enduser"},
    )
    assert create.status_code == 201
    ticket_id = create.json()["ticket"]["id"]

    denied = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"status": "inprog"},
        headers={"X-Dev-Role": "enduser"},
    )
    assert denied.status_code == 403

    allowed = client.patch(
        f"/api/tickets/{ticket_id}",
        json={"status": "inprog"},
        headers={"X-Dev-Role": "it"},
    )
    assert allowed.status_code == 200


def test_analytics_requires_it_role(client: TestClient):
    denied = client.get("/api/analytics/dashboard", headers={"X-Dev-Role": "enduser"})
    assert denied.status_code == 403

    allowed = client.get("/api/analytics/dashboard", headers={"X-Dev-Role": "it"})
    assert allowed.status_code == 200
