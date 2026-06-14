from typing import Any

from pydantic import BaseModel


class SlaStats(BaseModel):
    rate: int
    met: int
    total: int


class ChartItem(BaseModel):
    label: str
    value: int
    pct: int | None = None
    rank: int | None = None


class WeeklyTrendItem(BaseModel):
    label: str
    created: int
    resolved: int
    week_start: str


class OverdueTicketItem(BaseModel):
    id: str
    title: str
    priority: str
    hours: int


class AnalyticsCounts(BaseModel):
    created_today: int
    created_week: int
    created_month: int
    resolved_today: int
    resolved_week: int
    resolved_month: int
    closed_today: int
    closed_week: int
    closed_month: int
    open: int
    waiting: int
    overdue: int


class AnalyticsTrends(BaseModel):
    created_week_delta: int
    resolved_week_delta: int
    created_prev_week: int
    resolved_prev_week: int


class DashboardAnalytics(BaseModel):
    generated_at: str
    counts: AnalyticsCounts
    trends: AnalyticsTrends
    sla: SlaStats
    mttfr: float | None = None
    mttr: float | None = None
    by_priority: list[ChartItem]
    by_category: list[ChartItem]
    by_department: list[ChartItem]
    dept_total: int
    top_incidents: list[ChartItem]
    incident_total: int
    weekly_trend: list[WeeklyTrendItem]
    users_affected: list[ChartItem]
    overdue_tickets: list[OverdueTicketItem]


class WeeklyReportSection(BaseModel):
    title_key: str
    lines: list[str]


class WeeklyReport(BaseModel):
    subject_key: str
    subject_params: dict[str, Any]
    sections: list[WeeklyReportSection]
    analytics: DashboardAnalytics
