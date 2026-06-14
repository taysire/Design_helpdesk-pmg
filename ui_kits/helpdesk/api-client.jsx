// api-client — couche HTTP vers le backend FastAPI

function getApiBase() {
  try {
    return localStorage.getItem('pmg-api-base') || 'http://127.0.0.1:8001';
  } catch (e) {
    return 'http://127.0.0.1:8001';
  }
}

function inferTicketType(ticket) {
  if (ticket.ticketType || ticket.ticket_type) return ticket.ticketType || ticket.ticket_type;
  const id = (ticket.id || '').toUpperCase();
  if (id.startsWith('REQ') || id.startsWith('ONB') || id.startsWith('OFF')) return 'service';
  if (ticket.serviceId || ticket.service_id) return 'service';
  return 'incident';
}

function formatRelativeFromIso(iso) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}

function apiActivityToUi(activity) {
  const date = new Date(activity.created_at);
  return {
    who: activity.who_id,
    kind: activity.kind,
    text: activity.text || '',
    at: formatActivityTime(Number.isNaN(date.getTime()) ? new Date() : date),
    fromStatus: activity.from_status || undefined,
    toStatus: activity.to_status || undefined,
    authorRole: activity.author_role || undefined,
  };
}

function uiTicketToApi(ticket) {
  return {
    id: ticket.id || undefined,
    ticket_type: inferTicketType(ticket),
    title: ticket.title,
    category: ticket.category || null,
    service_id: ticket.serviceId || ticket.service_id || null,
    request_type: ticket.requestType || ticket.request_type || null,
    priority: ticket.priority || 'P3',
    status: normalizeStatus(ticket.status || 'new'),
    reporter_id: ticket.reporter || 'me',
    assignee_id: ticket.assignee || null,
    department: ticket.department || ticket.formAnswers?.department || null,
    body: ticket.body || null,
    form_answers: ticket.formAnswers || ticket.form_answers || null,
    jira_key: ticket.jira || null,
    slack_channel: ticket.slack || null,
  };
}

function apiTicketToUi(api) {
  const reporter = api.reporter_id || 'me';
  const activities = (api.activities || []).map(apiActivityToUi);
  return {
    id: api.id,
    title: api.title,
    category: api.category,
    serviceId: api.service_id,
    priority: api.priority,
    status: normalizeStatus(api.status),
    reporter,
    assignee: api.assignee_id,
    department: api.department,
    createdAt: api.created_at,
    firstResponseAt: api.first_response_at,
    resolvedAt: api.resolved_at,
    closedAt: api.closed_at,
    opened: formatRelativeFromIso(api.created_at),
    updated: formatRelativeFromIso(api.updated_at),
    body: api.body || '',
    jira: api.jira_key,
    slack: api.slack_channel,
    formAnswers: api.form_answers,
    activity: activities.length ? activities : [buildOpenedActivity(reporter)],
  };
}

async function apiRequest(path, options = {}) {
  const base = getApiBase();
  const res = await fetch(`${base}${path}`, options);
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`${options.method || 'GET'} ${path} failed (${res.status}) ${detail}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function checkApiHealth() {
  const base = getApiBase();
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return { ok: false, base };
    const data = await res.json();
    return { ok: data.status === 'ok' && data.database === 'connected', base };
  } catch (e) {
    return { ok: false, base };
  }
}

async function fetchTicketsFromApi(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '' && value !== 'all') qs.set(key, value);
  });
  const query = qs.toString();
  const items = await apiRequest(`/api/tickets${query ? `?${query}` : ''}`);
  return items.map(apiTicketToUi);
}

async function fetchTicketFromApi(ticketId) {
  const item = await apiRequest(`/api/tickets/${encodeURIComponent(ticketId)}`);
  return apiTicketToUi(item);
}

async function createTicketViaApi(ticket) {
  const item = await apiRequest('/api/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(uiTicketToApi(ticket)),
  });
  return apiTicketToUi(item);
}

async function updateTicketViaApi(ticketId, patch) {
  const body = {};
  if (patch.status != null) body.status = normalizeStatus(patch.status);
  if (patch.assignee != null) body.assignee_id = patch.assignee;
  if (patch.assignee_id != null) body.assignee_id = patch.assignee_id;
  if (patch.priority != null) body.priority = patch.priority;
  if (patch.title != null) body.title = patch.title;
  if (patch.reopen_note != null) body.reopen_note = patch.reopen_note;

  const item = await apiRequest(`/api/tickets/${encodeURIComponent(ticketId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return apiTicketToUi(item);
}

async function addCommentViaApi(ticketId, { text, who_id = 'me', author_role = 'it' }) {
  const item = await apiRequest(`/api/tickets/${encodeURIComponent(ticketId)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, who_id, author_role }),
  });
  return apiTicketToUi(item);
}

const PMG_API = {
  getBase: getApiBase,
  checkHealth: checkApiHealth,
  fetchTickets: fetchTicketsFromApi,
  fetchTicket: fetchTicketFromApi,
  createTicket: createTicketViaApi,
  updateTicket: updateTicketViaApi,
  addComment: addCommentViaApi,
  toApi: uiTicketToApi,
  fromApi: apiTicketToUi,
};

Object.assign(window, {
  PMG_API,
  checkApiHealth,
  fetchTicketsFromApi,
  fetchTicketFromApi,
  createTicketViaApi,
  updateTicketViaApi,
  addCommentViaApi,
  uiTicketToApi,
  apiTicketToUi,
});
