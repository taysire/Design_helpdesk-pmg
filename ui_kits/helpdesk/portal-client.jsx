// portal-client — catalogue portail depuis l'API (Phase 3)

function mapApiIncidentItem(item) {
  return {
    id: item.id,
    icon: item.icon,
    ticketCategory: item.ticket_category,
    portalFlow: item.portal_flow || undefined,
    prefillProblemArea: item.prefill_problem_area || undefined,
  };
}

function mapApiIncidentGroup(group) {
  return { id: group.id, itemIds: group.item_ids };
}

function mapApiServiceItem(item) {
  const existing = window.PMG_DATA?.SERVICE_CATALOG?.find(s => s.id === item.id);
  return {
    id: item.id,
    icon: item.icon,
    hint: existing?.hint || '',
  };
}

async function loadPortalCatalogFromApi() {
  const [incidents, groups, services] = await Promise.all([
    apiRequest('/api/portal/incidents'),
    apiRequest('/api/portal/incident-groups'),
    apiRequest('/api/portal/services'),
  ]);
  return {
    PORTAL_INCIDENT_ITEMS: incidents.map(mapApiIncidentItem),
    PORTAL_INCIDENT_GROUPS: groups.map(mapApiIncidentGroup),
    SERVICE_CATALOG: services.map(mapApiServiceItem),
  };
}

async function fetchFormSchema(portalId) {
  return apiRequest(`/api/portal/forms/${encodeURIComponent(portalId)}`);
}

async function syncPortalCatalog() {
  const health = await checkApiHealth();
  if (!health.ok) return false;
  try {
    const catalog = await loadPortalCatalogFromApi();
    if (!window.PMG_DATA) return false;
    window.PMG_DATA.PORTAL_INCIDENT_ITEMS = catalog.PORTAL_INCIDENT_ITEMS;
    window.PMG_DATA.PORTAL_INCIDENT_GROUPS = catalog.PORTAL_INCIDENT_GROUPS;
    window.PMG_DATA.SERVICE_CATALOG = catalog.SERVICE_CATALOG;
    return true;
  } catch (e) {
    return false;
  }
}

Object.assign(window, {
  loadPortalCatalogFromApi,
  fetchFormSchema,
  syncPortalCatalog,
});
