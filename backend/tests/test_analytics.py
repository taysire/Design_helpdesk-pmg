"""Tests analytics dashboard."""

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


def _seed_ticket(client: TestClient, **extra) -> dict:
    payload = {
        "ticket_type": "incident",
        "title": "Analytics seed ticket",
        "category": "hardware",
        "priority": "P3",
        "reporter_id": "me",
        "department": "Administration",
        "body": "Test",
        "form_answers": {"problem_area": "Imprimante", "users_affected": "Juste moi"},
        **extra,
    }
    res = client.post("/api/tickets", json=payload)
    assert res.status_code == 201, res.text
    return res.json()


def test_dashboard_empty(client: TestClient):
    res = client.get("/api/analytics/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "counts" in data
    assert "sla" in data
    assert data["sla"]["rate"] == 100
    assert isinstance(data["weekly_trend"], list)
    assert len(data["weekly_trend"]) == 8


def test_dashboard_with_tickets(client: TestClient):
    _seed_ticket(client, title="Printer offline", department="Pharmacie")
    _seed_ticket(
        client,
        ticket_type="service",
        title="Equipment request",
        category="service",
        service_id="it-equipment",
        request_type="equipment",
    )

    res = client.get("/api/analytics/dashboard", params={"lang": "fr"})
    assert res.status_code == 200
    data = res.json()
    assert data["counts"]["created_week"] >= 2
    assert data["dept_total"] >= 2
    assert any(d["label"] == "Pharmacie" for d in data["by_department"])
    assert any(d["label"] == "Imprimante" for d in data["top_incidents"])


def test_weekly_report_endpoint(client: TestClient):
    _seed_ticket(client)
    res = client.get("/api/analytics/weekly-report", params={"lang": "en"})
    assert res.status_code == 200
    data = res.json()
    assert data["counts"]["created_week"] >= 1
    assert "mttfr" in data
