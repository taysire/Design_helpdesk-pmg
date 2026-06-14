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


def test_create_and_list_ticket(client: TestClient):
    payload = {
        "ticket_type": "incident",
        "title": "Test pytest — KROLL lent",
        "category": "kroll",
        "priority": "P2",
        "reporter_id": "me",
        "body": "Created by pytest",
    }
    res = client.post("/api/tickets", json=payload)
    assert res.status_code == 201, res.text
    created = res.json()
    assert created["id"].startswith("INC-")
    assert created["title"] == payload["title"]

    res = client.get("/api/tickets")
    assert res.status_code == 200
    ids = [t["id"] for t in res.json()]
    assert created["id"] in ids
