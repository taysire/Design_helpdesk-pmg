"""Tests admin — CRUD catalogue portail et RBAC (Phase 7)."""

import os
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(
    os.getenv("PMG_SKIP_DB_TESTS") == "1",
    reason="PMG_SKIP_DB_TESTS=1",
)

ADMIN = {"X-Dev-Role": "admin"}
IT = {"X-Dev-Role": "it"}
ENDUSER = {"X-Dev-Role": "enduser"}


@pytest.fixture
def client():
    return TestClient(app)


def _uid(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# ── RBAC ───────────────────────────────────────────────────────────────────--

def test_admin_requires_admin_role(client: TestClient):
    # enduser et it sont refusés ; admin est autorisé.
    assert client.get("/api/admin/portal/incidents", headers=ENDUSER).status_code == 403
    assert client.get("/api/admin/portal/incidents", headers=IT).status_code == 403
    assert client.get("/api/admin/portal/incidents", headers=ADMIN).status_code == 200


def test_admin_list_is_seeded(client: TestClient):
    services = client.get("/api/admin/portal/services", headers=ADMIN).json()
    ids = [s["id"] for s in services]
    assert "special-it" in ids
    assert "it-equipment" in ids


# ── CRUD incidents ────────────────────────────────────────────────────────────

def test_incident_item_crud(client: TestClient):
    item_id = _uid("test-inc")
    create = client.post(
        "/api/admin/portal/incidents",
        json={"id": item_id, "icon": "box", "ticket_category": "apps", "prefill_problem_area": "Test App"},
        headers=ADMIN,
    )
    assert create.status_code == 201
    assert create.json()["form_type"] == "dynamic_incident"

    # Doublon → 409
    dup = client.post(
        "/api/admin/portal/incidents",
        json={"id": item_id, "icon": "box", "ticket_category": "apps"},
        headers=ADMIN,
    )
    assert dup.status_code == 409

    # PATCH
    patched = client.patch(
        f"/api/admin/portal/incidents/{item_id}",
        json={"prefill_problem_area": "Updated"},
        headers=ADMIN,
    )
    assert patched.status_code == 200
    assert patched.json()["prefill_problem_area"] == "Updated"

    # Visible sur l'endpoint public + schéma de formulaire résolu
    public = client.get("/api/portal/incidents").json()
    assert item_id in [i["id"] for i in public]
    schema = client.get(f"/api/portal/forms/{item_id}")
    assert schema.status_code == 200
    assert schema.json()["ticket_type"] == "incident"

    # DELETE
    assert client.delete(f"/api/admin/portal/incidents/{item_id}", headers=ADMIN).status_code == 204
    assert client.get(f"/api/admin/portal/incidents/{item_id}", headers=ADMIN).status_code == 404


def test_incident_inactive_hidden_from_public(client: TestClient):
    item_id = _uid("test-inc")
    client.post(
        "/api/admin/portal/incidents",
        json={"id": item_id, "icon": "box", "ticket_category": "apps", "is_active": False},
        headers=ADMIN,
    )
    public_ids = [i["id"] for i in client.get("/api/portal/incidents").json()]
    assert item_id not in public_ids
    # Mais toujours visible côté admin
    admin_ids = [i["id"] for i in client.get("/api/admin/portal/incidents", headers=ADMIN).json()]
    assert item_id in admin_ids
    client.delete(f"/api/admin/portal/incidents/{item_id}", headers=ADMIN)


# ── CRUD services + préfixe d'ID ──────────────────────────────────────────────

def test_service_item_crud_and_prefix(client: TestClient):
    svc_id = _uid("test-svc")
    create = client.post(
        "/api/admin/portal/services",
        json={
            "id": svc_id,
            "icon": "package",
            "request_type": "service",
            "ticket_category": "service",
            "form_type": "service_wizard",
            "id_prefix": "TST",
        },
        headers=ADMIN,
    )
    assert create.status_code == 201

    # Schéma public résolu
    schema = client.get(f"/api/portal/forms/{svc_id}").json()
    assert schema["ticket_type"] == "service"
    assert schema["service_id"] == svc_id

    # Un ticket de service créé pour ce service utilise le préfixe configuré
    ticket = client.post(
        "/api/tickets",
        json={
            "ticket_type": "service",
            "service_id": svc_id,
            "title": "Demande test",
            "priority": "P4",
            "status": "new",
            "reporter_id": "me",
        },
        headers=ENDUSER,
    )
    assert ticket.status_code == 201
    assert ticket.json()["ticket"]["id"].startswith("TST-")

    client.delete(f"/api/admin/portal/services/{svc_id}", headers=ADMIN)


# ── CRUD groupes ──────────────────────────────────────────────────────────────

def test_incident_group_crud(client: TestClient):
    group_id = _uid("test-grp")
    create = client.post(
        "/api/admin/portal/incident-groups",
        json={"id": group_id, "item_ids": ["kroll", "dsq"], "sort_order": 99},
        headers=ADMIN,
    )
    assert create.status_code == 201

    patched = client.patch(
        f"/api/admin/portal/incident-groups/{group_id}",
        json={"item_ids": ["kroll"]},
        headers=ADMIN,
    )
    assert patched.status_code == 200
    assert patched.json()["item_ids"] == ["kroll"]

    assert client.delete(f"/api/admin/portal/incident-groups/{group_id}", headers=ADMIN).status_code == 204
