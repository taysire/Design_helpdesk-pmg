"""Tests notifications."""

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


def test_notification_config(client: TestClient):
    res = client.get("/api/notifications/config")
    assert res.status_code == 200
    data = res.json()
    assert data["enabled"] is True
    assert "email" in data["channels"]
    assert "slack" in data["channels"]
    assert "jira" in data["channels"]


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
