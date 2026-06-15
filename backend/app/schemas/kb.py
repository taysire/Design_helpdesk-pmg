from pydantic import BaseModel


class HelpArticleRead(BaseModel):
    id: str
    icon: str
    portal_id: str | None = None
    popular: bool = False
    title: str
    excerpt: str
    body: str
    keywords: str = ""


class AnnouncementRead(BaseModel):
    id: str
    severity: str
    title: str
    body: str


class ServiceStatusRead(BaseModel):
    id: str
    icon: str
    status: str
    label: str
    message: str


class SearchResultItem(BaseModel):
    type: str
    id: str
    title: str
    subtitle: str | None = None
    route: str | None = None


class SearchResults(BaseModel):
    query: str
    articles: list[SearchResultItem]
    tickets: list[SearchResultItem]
    portal: list[SearchResultItem]
