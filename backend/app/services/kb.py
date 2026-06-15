"""Services KB et recherche unifiée."""

from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.data.kb_catalog import (
    HELP_ARTICLES,
    PORTAL_ANNOUNCEMENTS,
    SERVICE_STATUS_ITEMS,
    localize_announcement,
    localize_article,
    localize_service_status,
)
from app.data.portal_catalog import PORTAL_INCIDENT_ITEMS, get_incident_item
from app.models.ticket import Ticket


def list_help_articles(lang: str = "fr", q: str | None = None) -> list[dict]:
    articles = [localize_article(a, lang) for a in HELP_ARTICLES]
    if not q:
        return articles
    query = q.strip().lower()
    return [
        a
        for a in articles
        if query in " ".join([a["title"], a["excerpt"], a["body"], a["keywords"], a["id"]]).lower()
    ]


def get_help_article(article_id: str, lang: str = "fr") -> dict | None:
    raw = next((a for a in HELP_ARTICLES if a["id"] == article_id), None)
    if not raw:
        return None
    return localize_article(raw, lang)


def list_announcements(lang: str = "fr") -> list[dict]:
    return [
        localize_announcement(a, lang)
        for a in sorted(PORTAL_ANNOUNCEMENTS, key=lambda x: x["sort_order"])
        if a.get("active", True)
    ]


def list_service_status(lang: str = "fr") -> list[dict]:
    return [localize_service_status(s, lang) for s in SERVICE_STATUS_ITEMS]


def unified_search(db: Session, q: str, lang: str = "fr", limit: int = 8) -> dict:
    query = (q or "").strip()
    if not query:
        return {"query": "", "articles": [], "tickets": [], "portal": []}

    ql = query.lower()
    articles = []
    for art in list_help_articles(lang, query)[:limit]:
        articles.append({
            "type": "article",
            "id": art["id"],
            "title": art["title"],
            "subtitle": art["excerpt"],
            "route": f"article:{art['id']}",
        })

    portal = []
    for item in PORTAL_INCIDENT_ITEMS:
        label = item["id"]
        prefill = item.get("prefill_problem_area") or ""
        haystack = f"{label} {prefill} {item.get('ticket_category', '')}".lower()
        if ql in haystack:
            portal.append({
                "type": "portal",
                "id": item["id"],
                "title": prefill or label,
                "subtitle": item.get("ticket_category"),
                "route": f"new:{item['id']}",
            })
        if len(portal) >= limit:
            break

    pattern = f"%{query}%"
    tickets_db = list(
        db.scalars(
            select(Ticket)
            .where(
                or_(
                    Ticket.id.ilike(pattern),
                    Ticket.title.ilike(pattern),
                    Ticket.body.ilike(pattern),
                )
            )
            .order_by(Ticket.created_at.desc())
            .limit(limit)
        ).all()
    )
    tickets = [
        {
            "type": "ticket",
            "id": tk.id,
            "title": tk.title,
            "subtitle": tk.status,
            "route": f"ticket:{tk.id}",
        }
        for tk in tickets_db
    ]

    return {"query": query, "articles": articles, "tickets": tickets, "portal": portal}
