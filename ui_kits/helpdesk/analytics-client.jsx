// analytics-client — KPI dashboard depuis l'API (Phase 5)

function apiAnalyticsToUi(data) {
  const c = data.counts || {};
  const tr = data.trends || {};
  return {
    generatedAt: data.generated_at,
    counts: {
      createdToday: c.created_today,
      createdWeek: c.created_week,
      createdMonth: c.created_month,
      resolvedToday: c.resolved_today,
      resolvedWeek: c.resolved_week,
      resolvedMonth: c.resolved_month,
      closedToday: c.closed_today,
      closedWeek: c.closed_week,
      closedMonth: c.closed_month,
      open: c.open,
      waiting: c.waiting,
      overdue: c.overdue,
    },
    trends: {
      createdWeekDelta: tr.created_week_delta,
      resolvedWeekDelta: tr.resolved_week_delta,
      createdPrevWeek: tr.created_prev_week,
      resolvedPrevWeek: tr.resolved_prev_week,
    },
    sla: data.sla,
    mttfr: data.mttfr,
    mttr: data.mttr,
    byPriority: data.by_priority || [],
    byCategory: data.by_category || [],
    byDepartment: data.by_department || [],
    deptTotal: data.dept_total,
    topIncidents: data.top_incidents || [],
    incidentTotal: data.incident_total,
    weeklyTrend: (data.weekly_trend || []).map(w => ({
      label: w.label,
      created: w.created,
      resolved: w.resolved,
      weekStart: w.week_start,
    })),
    usersAffected: data.users_affected || [],
    overdueTickets: data.overdue_tickets || [],
  };
}

async function fetchAnalyticsDashboard(lang = 'fr') {
  const data = await apiRequest(`/api/analytics/dashboard?lang=${encodeURIComponent(lang)}`);
  return apiAnalyticsToUi(data);
}

async function fetchWeeklyReportAnalytics(lang = 'fr') {
  const data = await apiRequest(`/api/analytics/weekly-report?lang=${encodeURIComponent(lang)}`);
  return apiAnalyticsToUi(data);
}

Object.assign(window, {
  apiAnalyticsToUi,
  fetchAnalyticsDashboard,
  fetchWeeklyReportAnalytics,
});
