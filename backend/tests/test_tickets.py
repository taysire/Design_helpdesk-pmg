"""Tests tickets — necessitent PostgreSQL (docker compose up)."""

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


def _create_ticket(client: TestClient, title: str = "Test ticket", **extra) -> dict:
    payload = {
        "ticket_type": "incident",
        "title": title,
        "category": "hardware",
        "priority": "P3",
        "reporter_id": "me",
        "body": "Created by pytest",
        **extra,
    }
    res = client.post("/api/tickets", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_create_and_list_ticket(client: TestClient):
    created = _create_ticket(client, "Test pytest — KROLL lent", category="kroll", priority="P2")
    assert created["id"].startswith("INC-")
    assert created["activities"]
    assert created["activities"][0]["kind"] == "opened"

    res = client.get("/api/tickets")
    assert res.status_code == 200
    ids = [t["id"] for t in res.json()]
    assert created["id"] in ids


def test_patch_status_and_comment(client: TestClient):
    created = _create_ticket(client, "Printer offline")
    ticket_id = created["id"]

    res = client.patch(f"/api/tickets/{ticket_id}", json={"status": "inprog"})
    assert res.status_code == 200, res.text
    updated = res.json()
    assert updated["status"] == "inprog"
    kinds = [a["kind"] for a in updated["activities"]]
    assert "status_change" in kinds

    res = client.post(
        f"/api/tickets/{ticket_id}/comments",
        json={"text": "Looking into it", "who_id": "jd", "author_role": "it"},
    )
    assert res.status_code == 201, res.text
    commented = res.json()
    assert any(a["kind"] == "comment" for a in commented["activities"])
    assert commented["first_response_at"] is not None

    res = client.patch(f"/api/tickets/{ticket_id}", json={"status": "resolved"})
    assert res.status_code == 200
    assert res.json()["resolved_at"] is not None


def test_search_tickets(client: TestClient):
    created = _create_ticket(client, "Unique search marker XYZ-123")
    res = client.get("/api/tickets", params={"q": "XYZ-123"})
    assert res.status_code == 200
    ids = [t["id"] for t in res.json()]
    assert created["id"] in ids

    res = client.get("/api/tickets", params={"q": "no-match-zzzz"})
    assert res.status_code == 200
    assert res.json() == []


def test_assign_ticket(client: TestClient):
    created = _create_ticket(client, "Assign me")
    ticket_id = created["id"]
    res = client.patch(f"/api/tickets/{ticket_id}", json={"assignee_id": "jd"})
    assert res.status_code == 200
    assert res.json()["assignee_id"] == "jd"


def test_imprimante_incident_flow(client: TestClient):
    payload = {
        "ticket_type": "incident",
        "title": "Imprimante — Connexion avec Kroll",
        "category": "hardware",
        "priority": "P3",
        "reporter_id": "me",
        "body": "Imprimante 3e etage hors ligne",
        "form_answers": {
            "_portalCategory": "imprimante",
            "problem_area": "Imprimante",
            "printer_problem": "Connexion avec Kroll",
            "users_affected": "Juste moi",
            "department": "Administration",
        },
    }
    res = client.post("/api/tickets", json=payload)
    assert res.status_code == 201, res.text
    created = res.json()
    assert created["id"].startswith("INC-")
    assert created["form_answers"]["_portalCategory"] == "imprimante"

    res = client.get("/api/tickets", params={"category": "hardware", "q": "Imprimante"})
    assert res.status_code == 200
    assert any(t["id"] == created["id"] for t in res.json())


def test_it_equipment_service_flow(client: TestClient):
    payload = {
        "ticket_type": "service",
        "title": "Demande de materiel informatique — Remplacement",
        "category": "service",
        "service_id": "it-equipment",
        "request_type": "equipment",
        "priority": "P4",
        "reporter_id": "me",
        "body": "Remplacement laptop",
        "form_answers": {"_equipmentWizard": True, "requestType": "replacement"},
    }
    res = client.post("/api/tickets", json=payload)
    assert res.status_code == 201, res.text
    created = res.json()
    assert created["id"].startswith("EQP-")
    assert created["service_id"] == "it-equipment"

    res = client.get("/api/tickets", params={"service_id": "it-equipment"})
    assert res.status_code == 200
    assert any(t["id"] == created["id"] for t in res.json())

