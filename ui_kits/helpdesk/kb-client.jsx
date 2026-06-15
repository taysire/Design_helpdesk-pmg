// kb-client — base de connaissances et portail enrichi (Phase 6)

function mapApiHelpArticle(article) {
  return {
    id: article.id,
    icon: article.icon,
    portalId: article.portal_id,
    popular: article.popular,
    title: article.title,
    excerpt: article.excerpt,
    body: article.body,
    keywords: article.keywords || '',
  };
}

async function loadKbFromApi(lang = 'fr') {
  const [articles, announcements, serviceStatus] = await Promise.all([
    apiRequest(`/api/kb/articles?lang=${encodeURIComponent(lang)}`),
    apiRequest(`/api/portal/announcements?lang=${encodeURIComponent(lang)}`),
    apiRequest(`/api/portal/service-status?lang=${encodeURIComponent(lang)}`),
  ]);
  return {
    articles: articles.map(mapApiHelpArticle),
    announcements,
    serviceStatus,
  };
}

async function fetchHelpArticle(articleId, lang = 'fr') {
  const article = await apiRequest(`/api/kb/articles/${encodeURIComponent(articleId)}?lang=${encodeURIComponent(lang)}`);
  return mapApiHelpArticle(article);
}

async function searchUnified(q, lang = 'fr') {
  if (!q || !q.trim()) return { query: '', articles: [], tickets: [], portal: [] };
  return apiRequest(`/api/search?q=${encodeURIComponent(q.trim())}&lang=${encodeURIComponent(lang)}`);
}

async function syncKbCatalog(lang = 'fr') {
  const health = await checkApiHealth();
  if (!health.ok) return false;
  try {
    const kb = await loadKbFromApi(lang);
    window.PMG_KB = kb;
    if (kb.articles?.length && window.PMG_DATA) {
      window.PMG_DATA.HELP_ARTICLES = kb.articles.map(a => ({
        id: a.id,
        icon: a.icon,
        portalId: a.portalId,
        popular: a.popular,
      }));
    }
    window.dispatchEvent(new Event('pmg-kb-updated'));
    return true;
  } catch (e) {
    return false;
  }
}

Object.assign(window, {
  loadKbFromApi,
  fetchHelpArticle,
  searchUnified,
  syncKbCatalog,
  mapApiHelpArticle,
});
