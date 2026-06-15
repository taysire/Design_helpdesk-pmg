// admin-client — CRUD catalogue portail (Phase 7 admin UI)

const ADMIN_BASE = '/api/admin/portal';

function mapIncidentFromApi(row) {
  return {
    id: row.id,
    icon: row.icon,
    ticketCategory: row.ticket_category,
    portalFlow: row.portal_flow || '',
    prefillProblemArea: row.prefill_problem_area || '',
    formType: row.form_type || 'dynamic_incident',
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active !== false,
  };
}

function mapIncidentToApi(item) {
  const out = {};
  if (item.id != null) out.id = item.id;
  if (item.icon != null) out.icon = item.icon;
  if (item.ticketCategory != null) out.ticket_category = item.ticketCategory;
  if (item.portalFlow != null) out.portal_flow = item.portalFlow || null;
  if (item.prefillProblemArea != null) out.prefill_problem_area = item.prefillProblemArea || null;
  if (item.formType != null) out.form_type = item.formType;
  if (item.sortOrder != null) out.sort_order = Number(item.sortOrder);
  if (item.isActive != null) out.is_active = !!item.isActive;
  return out;
}

function mapGroupFromApi(row) {
  return {
    id: row.id,
    itemIds: row.item_ids || [],
    sortOrder: row.sort_order ?? 0,
  };
}

function mapGroupToApi(group) {
  const out = {};
  if (group.id != null) out.id = group.id;
  if (group.itemIds != null) out.item_ids = group.itemIds;
  if (group.sortOrder != null) out.sort_order = Number(group.sortOrder);
  return out;
}

function mapServiceFromApi(row) {
  return {
    id: row.id,
    icon: row.icon,
    requestType: row.request_type,
    ticketCategory: row.ticket_category,
    formType: row.form_type || '',
    idPrefix: row.id_prefix || '',
    sortOrder: row.sort_order ?? 0,
    isActive: row.is_active !== false,
  };
}

function mapServiceToApi(item) {
  const out = {};
  if (item.id != null) out.id = item.id;
  if (item.icon != null) out.icon = item.icon;
  if (item.requestType != null) out.request_type = item.requestType;
  if (item.ticketCategory != null) out.ticket_category = item.ticketCategory;
  if (item.formType != null) out.form_type = item.formType || null;
  if (item.idPrefix != null) out.id_prefix = item.idPrefix || null;
  if (item.sortOrder != null) out.sort_order = Number(item.sortOrder);
  if (item.isActive != null) out.is_active = !!item.isActive;
  return out;
}

async function fetchAdminIncidents() {
  const rows = await apiRequest(`${ADMIN_BASE}/incidents`);
  return rows.map(mapIncidentFromApi);
}

async function createAdminIncident(payload) {
  const row = await apiRequest(`${ADMIN_BASE}/incidents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapIncidentToApi(payload)),
  });
  return mapIncidentFromApi(row);
}

async function updateAdminIncident(id, payload) {
  const row = await apiRequest(`${ADMIN_BASE}/incidents/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapIncidentToApi(payload)),
  });
  return mapIncidentFromApi(row);
}

async function deleteAdminIncident(id) {
  return apiRequest(`${ADMIN_BASE}/incidents/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function fetchAdminGroups() {
  const rows = await apiRequest(`${ADMIN_BASE}/incident-groups`);
  return rows.map(mapGroupFromApi);
}

async function createAdminGroup(payload) {
  const row = await apiRequest(`${ADMIN_BASE}/incident-groups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapGroupToApi(payload)),
  });
  return mapGroupFromApi(row);
}

async function updateAdminGroup(id, payload) {
  const row = await apiRequest(`${ADMIN_BASE}/incident-groups/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapGroupToApi(payload)),
  });
  return mapGroupFromApi(row);
}

async function deleteAdminGroup(id) {
  return apiRequest(`${ADMIN_BASE}/incident-groups/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function fetchAdminServices() {
  const rows = await apiRequest(`${ADMIN_BASE}/services`);
  return rows.map(mapServiceFromApi);
}

async function createAdminService(payload) {
  const row = await apiRequest(`${ADMIN_BASE}/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapServiceToApi(payload)),
  });
  return mapServiceFromApi(row);
}

async function updateAdminService(id, payload) {
  const row = await apiRequest(`${ADMIN_BASE}/services/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapServiceToApi(payload)),
  });
  return mapServiceFromApi(row);
}

async function deleteAdminService(id) {
  return apiRequest(`${ADMIN_BASE}/services/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

Object.assign(window, {
  fetchAdminIncidents,
  createAdminIncident,
  updateAdminIncident,
  deleteAdminIncident,
  fetchAdminGroups,
  createAdminGroup,
  updateAdminGroup,
  deleteAdminGroup,
  fetchAdminServices,
  createAdminService,
  updateAdminService,
  deleteAdminService,
});
