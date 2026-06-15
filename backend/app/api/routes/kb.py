from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.kb import (
    AnnouncementRead,
    HelpArticleRead,
    SearchResults,
    ServiceStatusRead,
)
from app.services.kb import (
    get_help_article,
    list_announcements,
    list_help_articles,
    list_service_status,
    unified_search,
)

router = APIRouter(tags=["kb"])


@router.get("/api/kb/articles", response_model=list[HelpArticleRead])
def kb_list_articles(
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
    q: str | None = Query(default=None),
) -> list[dict]:
    return list_help_articles(lang=lang, q=q)


@router.get("/api/kb/articles/{article_id}", response_model=HelpArticleRead)
def kb_get_article(
    article_id: str,
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
) -> dict:
    article = get_help_article(article_id, lang)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.get("/api/search", response_model=SearchResults)
def search_unified(
    q: str = Query(min_length=1),
    lang: str = Query(default="fr", pattern="^(fr|en)$"),
    db: Session = Depends(get_db),
) -> dict:
    return unified_search(db, q, lang=lang)
