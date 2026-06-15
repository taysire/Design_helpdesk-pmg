"""Tests notifications."""

import os
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.graph_mail import GraphMailError

pytestmark = pytest.mark.skipif(
    os.getenv("PMG_SKIP_DB_TESTS") == "1",
    reason="PMG_SKIP_DB_TESTS=1",
)


@pytest.fixture
def client():
    return TestClient(app)


def test_notification_config(client: TestClient):
    res = client.get("/api/notifications/config")
    assert res.status_code == 200
    data = res.json()
    assert data["enabled"] is True
    assert "email" in data["channels"]
    assert data["channels"]["email"]["mode"] == "log"
    assert "graph_configured" in data["channels"]["email"]
    assert "slack" in data["channels"]
    assert "jira" in data["channels"]


def test_status_change_graph_mode_api_still_succeeds_when_send_fails(client: TestClient, monkeypatch):
    """Ticket PATCH must succeed even if Graph sendMail fails."""
    from app.config import Settings, get_settings

    def _graph_settings():
        return Settings(
            notify_email_mode="graph",
            graph_tenant_id="tenant",
            graph_client_id="client",
            graph_client_secret="secret",
            graph_sender_email="ti@example.com",
        )

    monkeypatch.setattr("app.services.notifications.get_settings", _graph_settings)
    get_settings.cache_clear()

    graph = MagicMock()
    graph.is_configured.return_value = True
    graph.send_mail.side_effect = GraphMailError("network error")
    monkeypatch.setattr(
        "app.services.notifications.GraphMailClient",
        lambda settings: graph,
    )

    created = client.post("/api/tickets", json={
        "ticket_type": "incident",
        "title": "Graph fail test",
        "category": "hardware",
        "priority": "P3",
        "reporter_id": "me",
        "body": "Test",
    }).json()
    ticket_id = created["ticket"]["id"]

    res = client.patch(f"/api/tickets/{ticket_id}", json={"status": "inprog"})
    assert res.status_code == 200
    emails = [n for n in res.json()["notifications"] if n["channel"] == "email"]
    assert emails
    assert emails[-1]["status"] == "failed"

    get_settings.cache_clear()


def test_status_change_sends_email(client: TestClient):
    created = client.post("/api/tickets", json={
        "ticket_type": "incident",
        "title": "Notify test",
        "category": "hardware",
        "priority": "P3",
        "reporter_id": "me",
        "body": "Test",
    }).json()
    ticket_id = created["ticket"]["id"]

    res = client.patch(f"/api/tickets/{ticket_id}", json={"status": "inprog"})
    assert res.status_code == 200
    data = res.json()
    assert data["ticket"]["status"] == "inprog"
    emails = [n for n in data["notifications"] if n["channel"] == "email" and n["status"] == "sent"]
    assert emails

    res = client.get("/api/notifications", params={"ticket_id": ticket_id})
    assert res.status_code == 200
    assert len(res.json()) >= 1


def test_kroll_ticket_creates_jira(client: TestClient):
    res = client.post("/api/tickets", json={
        "ticket_type": "incident",
        "title": "KROLL down",
        "category": "kroll",
        "priority": "P1",
        "reporter_id": "pr",
        "body": "Pharmacy floor",
    })
    assert res.status_code == 201
    data = res.json()
    jira_notifs = [n for n in data["notifications"] if n["channel"] == "jira"]
    assert jira_notifs
    assert data["ticket"]["jira_key"] is not None

    slack_notifs = [n for n in data["notifications"] if n["channel"] == "slack"]
    assert slack_notifs


def test_it_comment_notifies_reporter(client: TestClient):
    created = client.post("/api/tickets", json={
        "ticket_type": "incident",
        "title": "Comment notify",
        "category": "apps",
        "priority": "P3",
        "reporter_id": "me",
    }).json()
    ticket_id = created["ticket"]["id"]

    res = client.post(f"/api/tickets/{ticket_id}/comments", json={
        "text": "We are looking into it",
        "who_id": "jd",
        "author_role": "it",
    })
    assert res.status_code == 201
    emails = [n for n in res.json()["notifications"] if n["channel"] == "email"]
    assert emails
