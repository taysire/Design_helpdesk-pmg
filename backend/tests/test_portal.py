"""Tests portail — catalogue et schemas formulaires."""

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = pytest.mark.skipif(
    os.getenv("PMG_SKIP_DB_TESTS") == "1",
    reason="PMG_SKIP_DB_TESTS=1",
)


@pytest.fixture
def client():
    return TestClient(app)


def test_portal_incidents_catalog(client: TestClient):
    res = client.get("/api/portal/incidents")
    assert res.status_code == 200
    items = res.json()
    ids = [i["id"] for i in items]
    assert "imprimante" in ids
    assert "kroll" in ids


def test_portal_services_catalog(client: TestClient):
    res = client.get("/api/portal/services")
    assert res.status_code == 200
    ids = [s["id"] for s in res.json()]
    assert "special-it" in ids
    assert "it-equipment" in ids


def test_form_schema_imprimante(client: TestClient):
    res = client.get("/api/portal/forms/imprimante")
    assert res.status_code == 200
    data = res.json()
    assert data["portal_id"] == "imprimante"
    assert data["ticket_type"] == "incident"
    assert data["prefill_problem_area"] == "Imprimante"
    assert data["route"] == "new:imprimante"


def test_form_schema_service(client: TestClient):
    res = client.get("/api/portal/forms/it-equipment")
    assert res.status_code == 200
    data = res.json()
    assert data["ticket_type"] == "service"
    assert data["service_id"] == "it-equipment"
    assert data["form_type"] == "equipment_wizard"


def test_form_schema_not_found(client: TestClient):
    res = client.get("/api/portal/forms/unknown-item")
    assert res.status_code == 404
