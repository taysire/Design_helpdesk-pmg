"""Tests KB et portail enrichi — Phase 6."""

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


def test_kb_articles_list_fr(client: TestClient):
    res = client.get("/api/kb/articles?lang=fr")
    assert res.status_code == 200
    articles = res.json()
    assert len(articles) >= 6
    ids = [a["id"] for a in articles]
    assert "printer-offline" in ids
    assert articles[0]["title"]


def test_kb_articles_search(client: TestClient):
    res = client.get("/api/kb/articles?lang=en&q=printer")
    assert res.status_code == 200
    articles = res.json()
    assert any(a["id"] == "printer-offline" for a in articles)


def test_kb_article_detail(client: TestClient):
    res = client.get("/api/kb/articles/printer-offline?lang=fr")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "printer-offline"
    assert data["portal_id"] == "imprimante"
    assert "imprimante" in data["keywords"].lower() or "offline" in data["title"].lower()


def test_kb_article_not_found(client: TestClient):
    res = client.get("/api/kb/articles/missing-article?lang=fr")
    assert res.status_code == 404


def test_portal_announcements(client: TestClient):
    res = client.get("/api/portal/announcements?lang=fr")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2
    assert items[0]["severity"] in ("info", "warning", "error")
    assert items[0]["title"]


def test_portal_service_status(client: TestClient):
    res = client.get("/api/portal/service-status?lang=en")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 4
    statuses = {i["id"]: i["status"] for i in items}
    assert statuses.get("kroll") == "degraded"
    assert statuses.get("avd") == "operational"


def test_unified_search_articles(client: TestClient):
    res = client.get("/api/search?q=password&lang=en")
    assert res.status_code == 200
    data = res.json()
    assert data["query"] == "password"
    assert any(a["id"] == "password-reset" for a in data["articles"])


def test_unified_search_requires_query(client: TestClient):
    res = client.get("/api/search?q=")
    assert res.status_code == 422
