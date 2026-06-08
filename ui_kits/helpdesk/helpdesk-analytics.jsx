// helpdesk-analytics — KPI, SLA, agrégations et rapport hebdomadaire (mock)

const SLA_FIRST_RESPONSE_HOURS = { P1: 1, P2: 4, P3: 8, P4: 24 };
const SLA_RESOLUTION_HOURS = { P1: 4, P2: 8, P3: 24, P4: 48 };

const CHART_COLORS = [
  '#1660CF', '#9333EA', '#0891B2', '#D97706', '#16A34A',
  '#DC2626', '#6366F1', '#DB2777', '#0D9488', '#CA8A04',
];

const DEPARTMENT_CHART_COLORS = [
  '#1660CF', '#2563EB', '#3B82F6', '#60A5FA', '#0891B2',
  '#0E7490', '#6366F1', '#818CF8',
];

const INCIDENT_CHART_COLORS = [
  '#C2410C', '#D97706', '#EA580C', '#F59E0B', '#FB923C',
  '#F97316', '#EF4444', '#DC2626', '#B45309', '#92400E',
];

const SUPPORT_INCIDENT_CATEGORIES = new Set(['hardware', 'avd', 'kroll', 'apps', 'access', 'materials']);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function hoursBetween(a, b) {
  return Math.abs(b - a) / 36e5;
}

function parseRelativeDate(str, now = new Date()) {
  if (!str) return null;
  const s = String(str).toLowerCase();
  const n = new Date(now);
  if (s.includes('just now') || s.includes('à l\'instant')) return n;
  const minMatch = s.match(/(\d+)\s*min/);
  if (minMatch) { n.setMinutes(n.getMinutes() - +minMatch[1]); return n; }
  const hrMatch = s.match(/(\d+)\s*hour/);
  if (hrMatch) { n.setHours(n.getHours() - +hrMatch[1]); return n; }
  if (s.includes('yesterday') || s.includes('hier')) {
    n.setDate(n.getDate() - 1);
    return n;
  }
  const dayMatch = s.match(/(\d+)\s*day/);
  if (dayMatch) { n.setDate(n.getDate() - +dayMatch[1]); return n; }
  const weekMatch = s.match(/(\d+)\s*week/);
  if (weekMatch) { n.setDate(n.getDate() - +weekMatch[1] * 7); return n; }
  return null;
}

function getTicketCreatedAt(ticket) {
  if (ticket.createdAt) return new Date(ticket.createdAt);
  const parsed = parseRelativeDate(ticket.opened);
  return parsed || new Date();
}

function getTicketResolvedAt(ticket) {
  if (ticket.resolvedAt) return new Date(ticket.resolvedAt);
  if (normalizeStatus(ticket.status) !== 'resolved') return null;
  return parseRelativeDate(ticket.updated) || getTicketCreatedAt(ticket);
}

function getTicketClosedAt(ticket) {
  if (ticket.closedAt) return new Date(ticket.closedAt);
  if (normalizeStatus(ticket.status) !== 'closed') return null;
  return parseRelativeDate(ticket.updated) || getTicketCreatedAt(ticket);
}

function getTicketDepartment(ticket) {
  return ticket.department
    || ticket.formAnswers?.department
    || 'Non spécifié';
}

function getFirstResponseAt(ticket) {
  if (ticket.firstResponseAt) return new Date(ticket.firstResponseAt);
  const created = getTicketCreatedAt(ticket);
  const activity = ticket.activity || [];
  for (const entry of activity) {
    if (['triaged', 'comment', 'status_change'].includes(entry.kind) && entry.who !== ticket.reporter) {
      return new Date(created.getTime() + 15 * 60000);
    }
  }
  if (ticket.assignee && normalizeStatus(ticket.status) !== 'new') {
    return new Date(created.getTime() + 30 * 60000);
  }
  return null;
}

function isSupportIncident(ticket) {
  if (SUPPORT_INCIDENT_CATEGORIES.has(ticket.category)) return true;
  const fa = ticket.formAnswers || {};
  return !!(fa.problem_area || fa.avd_issue || fa.kroll_issue || fa.dsq_error
    || fa.printer_problem || fa.ringcentral_issue || fa.access_issue);
}

/** Libellé détaillé (sous-type) — affichage ticket. */
function getIncidentLabel(ticket, lang) {
  const fa = ticket.formAnswers || {};
  if (fa.problem_area) return fa.problem_area;
  if (fa.kroll_issue) return `Kroll — ${fa.kroll_issue}`;
  if (fa.avd_issue) return `AVD — ${fa.avd_issue}`;
  if (fa.dsq_error) return `DSQ — ${fa.dsq_error}`;
  if (fa.printer_problem) return `Imprimante — ${fa.printer_problem}`;
  if (fa.ringcentral_issue) return `RingCentral — ${fa.ringcentral_issue}`;
  if (fa.excel_issue) return `Excel — ${fa.excel_issue}`;
  if (fa.pbi_issue) return `Power BI — ${fa.pbi_issue}`;
  if (fa.crm_issue) return `Parcours CRM — ${fa.crm_issue}`;
  if (fa.biometrx_issue) return `BioMetrx — ${fa.biometrx_issue}`;
  const cat = getLocalizedCategory(ticket.category, lang);
  return cat?.label || ticket.category || ticket.title?.slice(0, 48) || '—';
}

/** Libellé application / système — top incidents (regroupement). */
function getIncidentAppLabel(ticket, lang) {
  const fa = ticket.formAnswers || {};
  if (fa.problem_area) return fa.problem_area;
  if (fa.avd_issue) return 'AVD';
  if (fa.kroll_issue) return 'Kroll';
  if (fa.dsq_error) return 'DSQ';
  if (fa.printer_problem) return 'Imprimante';
  if (fa.ringcentral_issue) return 'RingCentral';
  if (fa.excel_issue) return 'Excel';
  if (fa.pbi_issue) return 'Power BI';
  if (fa.crm_issue) return 'Parcours CRM';
  if (fa.biometrx_issue) return 'BioMetrx';
  if (fa.access_issue) return 'Accès';
  if (SUPPORT_INCIDENT_CATEGORIES.has(ticket.category)) {
    const cat = getLocalizedCategory(ticket.category, lang);
    return cat?.label || ticket.category;
  }
  return null;
}

function withPercentages(items, totalOverride) {
  const total = totalOverride || items.reduce((s, d) => s + d.value, 0) || 1;
  return items.map((d, i) => ({
    ...d,
    pct: Math.round((d.value / total) * 100),
    rank: i + 1,
  }));
}

function isInRange(date, from, to) {
  return date >= from && date < to;
}

function countInPeriod(tickets, getDate, from, to) {
  return tickets.filter(tk => {
    const d = getDate(tk);
    return d && isInRange(d, from, to);
  }).length;
}

function isWaitingStatus(ticket) {
  const s = normalizeStatus(ticket.status);
  return s === 'waiting_info' || s === 'waiting_vendor';
}

function isOverdue(ticket, now = new Date()) {
  if (!isTicketActive(ticket.status)) return false;
  const created = getTicketCreatedAt(ticket);
  const limit = SLA_RESOLUTION_HOURS[ticket.priority] || SLA_RESOLUTION_HOURS.P4;
  return hoursBetween(created, now) > limit;
}

function computeSlaCompliance(tickets) {
  const closed = tickets.filter(tk => {
    const s = normalizeStatus(tk.status);
    return s === 'resolved' || s === 'closed';
  });
  if (!closed.length) return { rate: 100, met: 0, total: 0 };
  let met = 0;
  closed.forEach(tk => {
    const created = getTicketCreatedAt(tk);
    const done = getTicketResolvedAt(tk) || getTicketClosedAt(tk) || getTicketCreatedAt(tk);
    const limit = SLA_RESOLUTION_HOURS[tk.priority] || SLA_RESOLUTION_HOURS.P4;
    if (hoursBetween(created, done) <= limit) met++;
  });
  return { rate: Math.round((met / closed.length) * 100), met, total: closed.length };
}

function averageHours(tickets, getStart, getEnd) {
  const vals = tickets.map(tk => {
    const a = getStart(tk);
    const b = getEnd(tk);
    if (!a || !b) return null;
    return hoursBetween(a, b);
  }).filter(v => v != null && v >= 0);
  if (!vals.length) return null;
  return vals.reduce((s, v) => s + v, 0) / vals.length;
}

function formatDurationHours(hours, t) {
  if (hours == null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} ${t('analytics.min')}`;
  if (hours < 24) return `${hours.toFixed(1)} ${t('analytics.hours')}`;
  return `${(hours / 24).toFixed(1)} ${t('analytics.days')}`;
}

function groupCount(tickets, keyFn) {
  const map = {};
  tickets.forEach(tk => {
    const k = keyFn(tk) || '—';
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function weeklyVolume(tickets, weeks = 8) {
  const now = new Date();
  const result = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const created = countInPeriod(tickets, getTicketCreatedAt, weekStart, weekEnd);
    const resolved = tickets.filter(tk => {
      const d = getTicketResolvedAt(tk) || getTicketClosedAt(tk);
      return d && isInRange(d, weekStart, weekEnd);
    }).length;
    const label = weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    result.push({ label, created, resolved, weekStart: weekStart.toISOString() });
  }
  return result;
}

function computeHelpdeskAnalytics(tickets, t, lang) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrow = new Date(todayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekStart = startOfWeek(now);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const monthStart = startOfMonth(now);
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const open = tickets.filter(tk => isTicketActive(tk.status));
  const waiting = tickets.filter(isWaitingStatus);
  const overdue = open.filter(tk => isOverdue(tk, now));

  const createdToday = countInPeriod(tickets, getTicketCreatedAt, todayStart, tomorrow);
  const createdWeek = countInPeriod(tickets, getTicketCreatedAt, weekStart, nextWeek);
  const createdMonth = countInPeriod(tickets, getTicketCreatedAt, monthStart, nextMonth);
  const createdPrevWeek = countInPeriod(tickets, getTicketCreatedAt, prevWeekStart, weekStart);

  const resolvedToday = tickets.filter(tk => {
    const d = getTicketResolvedAt(tk);
    return d && isInRange(d, todayStart, tomorrow);
  }).length;
  const resolvedWeek = tickets.filter(tk => {
    const d = getTicketResolvedAt(tk);
    return d && isInRange(d, weekStart, nextWeek);
  }).length;
  const resolvedMonth = tickets.filter(tk => {
    const d = getTicketResolvedAt(tk);
    return d && isInRange(d, monthStart, nextMonth);
  }).length;
  const resolvedPrevWeek = tickets.filter(tk => {
    const d = getTicketResolvedAt(tk);
    return d && isInRange(d, prevWeekStart, weekStart);
  }).length;

  const closedToday = tickets.filter(tk => {
    const d = getTicketClosedAt(tk);
    return d && isInRange(d, todayStart, tomorrow);
  }).length;
  const closedWeek = tickets.filter(tk => {
    const d = getTicketClosedAt(tk);
    return d && isInRange(d, weekStart, nextWeek);
  }).length;
  const closedMonth = tickets.filter(tk => {
    const d = getTicketClosedAt(tk);
    return d && isInRange(d, monthStart, nextMonth);
  }).length;

  const sla = computeSlaCompliance(tickets);
  const mttfr = averageHours(
    tickets.filter(tk => getFirstResponseAt(tk)),
    getTicketCreatedAt,
    getFirstResponseAt,
  );
  const mttr = averageHours(
    tickets.filter(tk => getTicketResolvedAt(tk) || getTicketClosedAt(tk)),
    getTicketCreatedAt,
    tk => getTicketResolvedAt(tk) || getTicketClosedAt(tk),
  );

  const byPriority = groupCount(tickets, tk => tk.priority || 'P4');
  const byCategory = groupCount(tickets, tk => {
    const c = getLocalizedCategory(tk.category, lang);
    return c?.label || tk.category;
  });
  const deptTotal = tickets.length;
  const byDepartment = withPercentages(
    groupCount(tickets, getTicketDepartment).slice(0, 8),
    deptTotal,
  );
  const incidentTickets = tickets.filter(isSupportIncident);
  const incidentTotal = incidentTickets.length || 1;
  const topIncidents = withPercentages(
    groupCount(incidentTickets, tk => getIncidentAppLabel(tk, lang))
      .filter(d => d.label && d.label !== '—')
      .slice(0, 10),
    incidentTotal,
  );
  const weeklyTrend = weeklyVolume(tickets, 8);

  const usersAffected = groupCount(
    tickets.filter(tk => tk.formAnswers?.users_affected),
    tk => tk.formAnswers.users_affected,
  );

  return {
    generatedAt: now.toISOString(),
    periods: { todayStart, weekStart, monthStart },
    counts: {
      createdToday, createdWeek, createdMonth,
      resolvedToday, resolvedWeek, resolvedMonth,
      closedToday, closedWeek, closedMonth,
      open: open.length,
      waiting: waiting.length,
      overdue: overdue.length,
    },
    trends: {
      createdWeekDelta: createdWeek - createdPrevWeek,
      resolvedWeekDelta: resolvedWeek - resolvedPrevWeek,
      createdPrevWeek,
      resolvedPrevWeek,
    },
    sla,
    mttfr,
    mttr,
    mttfrLabel: formatDurationHours(mttfr, t),
    mttrLabel: formatDurationHours(mttr, t),
    byPriority,
    byCategory,
    byDepartment,
    deptTotal,
    topIncidents,
    incidentTotal,
    weeklyTrend,
    usersAffected,
    overdueTickets: overdue.slice(0, 8).map(tk => ({
      id: tk.id,
      title: tk.title,
      priority: tk.priority,
      hours: Math.round(hoursBetween(getTicketCreatedAt(tk), now)),
    })),
  };
}

function buildWeeklyReport(analytics, t, lang) {
  const { counts, trends, sla, topIncidents, byDepartment, overdueTickets, weeklyTrend } = analytics;
  const lastWeek = weeklyTrend[weeklyTrend.length - 1] || {};
  const prevWeek = weeklyTrend[weeklyTrend.length - 2] || {};

  const attention = [];
  if (counts.overdue > 0) attention.push(t('analytics.attentionOverdue', { n: counts.overdue }));
  if (trends.createdWeekDelta > 3) attention.push(t('analytics.attentionVolumeUp'));
  if (sla.rate < 90) attention.push(t('analytics.attentionSla', { rate: sla.rate }));
  if (!attention.length) attention.push(t('analytics.attentionOk'));

  return {
    subject: t('analytics.weeklyEmailSubject', {
      week: new Date().toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', { month: 'long', day: 'numeric' }),
    }),
    sections: [
      {
        title: t('analytics.reportCurrentState'),
        lines: [
          `${t('analytics.openTickets')}: ${counts.open}`,
          `${t('analytics.waitingTickets')}: ${counts.waiting}`,
          `${t('analytics.overdueTickets')}: ${counts.overdue}`,
        ],
      },
      {
        title: t('analytics.reportWeekKpi'),
        lines: [
          `${t('analytics.created')}: ${counts.createdWeek} (${trends.createdWeekDelta >= 0 ? '+' : ''}${trends.createdWeekDelta} vs ${t('analytics.prevWeek')})`,
          `${t('analytics.resolved')}: ${counts.resolvedWeek} (${trends.resolvedWeekDelta >= 0 ? '+' : ''}${trends.resolvedWeekDelta} vs ${t('analytics.prevWeek')})`,
          `${t('analytics.closed')}: ${counts.closedWeek}`,
          `${t('analytics.slaCompliance')}: ${sla.rate}% (${sla.met}/${sla.total})`,
          `${t('analytics.avgFirstResponse')}: ${analytics.mttfrLabel}`,
          `${t('analytics.avgResolution')}: ${analytics.mttrLabel}`,
        ],
      },
      {
        title: t('analytics.reportTrend'),
        lines: [
          `${t('analytics.weekCreated')}: ${lastWeek.created || 0} (${t('analytics.prevWeek')}: ${prevWeek.created || 0})`,
          `${t('analytics.weekResolved')}: ${lastWeek.resolved || 0} (${t('analytics.prevWeek')}: ${prevWeek.resolved || 0})`,
        ],
      },
      {
        title: t('analytics.reportTopDepartments'),
        lines: byDepartment.slice(0, 5).map(item => `${item.label} — ${item.value} (${item.pct}%)`),
      },
      {
        title: t('analytics.reportTopIncidents'),
        lines: topIncidents.slice(0, 5).map(item => `#${item.rank} ${item.label} — ${item.value} (${item.pct}%)`),
      },
      {
        title: t('analytics.reportAttention'),
        lines: attention,
      },
      {
        title: t('analytics.reportOverdueList'),
        lines: overdueTickets.length
          ? overdueTickets.map(tk => `${tk.id} · ${tk.title} · ${tk.hours}h · ${tk.priority}`)
          : [t('analytics.noOverdue')],
      },
    ],
  };
}

Object.assign(window, {
  SLA_FIRST_RESPONSE_HOURS,
  SLA_RESOLUTION_HOURS,
  CHART_COLORS,
  DEPARTMENT_CHART_COLORS,
  INCIDENT_CHART_COLORS,
  getTicketCreatedAt,
  getTicketDepartment,
  getIncidentLabel,
  getIncidentAppLabel,
  isSupportIncident,
  withPercentages,
  computeHelpdeskAnalytics,
  buildWeeklyReport,
  formatDurationHours,
});
