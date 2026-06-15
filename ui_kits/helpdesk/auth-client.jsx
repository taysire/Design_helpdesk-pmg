// auth-client — Microsoft Entra ID (MSAL) + mode dev (Phase 1)

const PMG_AUTH_STORAGE = 'pmg-auth-session';
const DEV_BEARER = 'dev-token';

function emptyAuthState() {
  return { mode: 'dev', configured: false, user: null, accessToken: null, devRole: 'it' };
}

window.PMG_AUTH = window.PMG_AUTH || emptyAuthState();

function uiRoleFromApi(role) {
  if (role === 'enduser') return 'enduser';
  return 'it';
}

function apiRoleFromUi(role) {
  if (role === 'enduser') return 'enduser';
  if (role === 'admin') return 'admin';
  return 'it';
}

function persistAuthSession() {
  try {
    const { mode, user, accessToken, devRole } = window.PMG_AUTH;
    if (!user) {
      localStorage.removeItem(PMG_AUTH_STORAGE);
      return;
    }
    localStorage.setItem(PMG_AUTH_STORAGE, JSON.stringify({ mode, user, accessToken, devRole }));
  } catch (e) { /* ignore */ }
}

function restoreAuthSession() {
  try {
    const raw = localStorage.getItem(PMG_AUTH_STORAGE);
    if (!raw) return false;
    const data = JSON.parse(raw);
    window.PMG_AUTH = { ...emptyAuthState(), ...data };
    return !!data.user;
  } catch (e) {
    return false;
  }
}

function clearAuthSession() {
  window.PMG_AUTH = emptyAuthState();
  try { localStorage.removeItem(PMG_AUTH_STORAGE); } catch (e) { /* ignore */ }
  if (window._pmgMsal) {
    try { window._pmgMsal.logoutPopup({ mainWindowRedirectUri: window.location.href }); } catch (e) { /* ignore */ }
  }
  window.dispatchEvent(new Event('pmg-auth-updated'));
}

function getAuthHeaders() {
  const auth = window.PMG_AUTH || {};
  const headers = {};
  if (auth.accessToken) headers.Authorization = `Bearer ${auth.accessToken}`;
  if (auth.mode === 'dev') {
    if (auth.devRole) headers['X-Dev-Role'] = apiRoleFromUi(auth.devRole);
    if (auth.user?.id) headers['X-Dev-User-Id'] = auth.user.id;
  }
  return headers;
}

async function fetchAuthConfig() {
  const config = await apiRequest('/api/auth/config');
  window.PMG_AUTH.mode = config.mode || 'dev';
  window.PMG_AUTH.configured = !!config.entra_configured;
  window.PMG_AUTH.entra = config;
  return config;
}

async function fetchMe() {
  const me = await apiRequest('/api/me', { headers: getAuthHeaders() });
  window.PMG_AUTH.user = me;
  persistAuthSession();
  window.dispatchEvent(new Event('pmg-auth-updated'));
  return me;
}

async function signInDev(profile = { id: 'me', name: 'You', email: 'you@pmg.com' }, uiRole = 'it') {
  window.PMG_AUTH.mode = 'dev';
  window.PMG_AUTH.accessToken = DEV_BEARER;
  window.PMG_AUTH.devRole = uiRole;
  window.PMG_AUTH.user = {
    id: profile.id || 'me',
    name: profile.name || 'You',
    email: profile.email || 'you@pmg.com',
    role: apiRoleFromUi(uiRole),
    roles: [apiRoleFromUi(uiRole)],
    is_it: uiRole !== 'enduser',
    is_admin: false,
  };
  persistAuthSession();
  try {
    return await fetchMe();
  } catch (e) {
    window.dispatchEvent(new Event('pmg-auth-updated'));
    return window.PMG_AUTH.user;
  }
}

function buildMsalConfig(config) {
  return {
    auth: {
      clientId: config.client_id,
      authority: `https://login.microsoftonline.com/${config.tenant_id}`,
      redirectUri: window.location.origin + window.location.pathname,
    },
    cache: { cacheLocation: 'localStorage', storeAuthStateInCookie: false },
  };
}

async function getMsalInstance(config) {
  if (window._pmgMsal) return window._pmgMsal;
  if (!window.msal || !window.msal.PublicClientApplication) {
    throw new Error('MSAL not loaded');
  }
  const instance = new window.msal.PublicClientApplication(buildMsalConfig(config));
  await instance.initialize();
  window._pmgMsal = instance;
  return instance;
}

async function signInEntra() {
  const config = window.PMG_AUTH.entra || await fetchAuthConfig();
  if (!config.entra_configured) throw new Error('Entra ID not configured');
  const msal = await getMsalInstance(config);
  const scopes = ['openid', 'profile', 'email'];
  if (config.api_scope) scopes.push(config.api_scope);
  const result = await msal.loginPopup({ scopes, prompt: 'select_account' });
  window.PMG_AUTH.mode = 'entra';
  window.PMG_AUTH.accessToken = result.accessToken;
  persistAuthSession();
  return fetchMe();
}

async function signIn(profile, uiRole = 'it') {
  const config = window.PMG_AUTH.entra || await fetchAuthConfig();
  if (config.entra_configured && config.mode === 'entra') {
    return signInEntra();
  }
  return signInDev(profile, uiRole);
}

async function setDevAuthRole(uiRole) {
  if (window.PMG_AUTH.mode !== 'dev') return window.PMG_AUTH.user;
  window.PMG_AUTH.devRole = uiRole;
  persistAuthSession();
  try {
    return await fetchMe();
  } catch (e) {
    if (window.PMG_AUTH.user) {
      window.PMG_AUTH.user.role = apiRoleFromUi(uiRole);
      window.PMG_AUTH.user.is_it = uiRole !== 'enduser';
      window.PMG_AUTH.user.is_admin = uiRole === 'admin';
    }
    window.dispatchEvent(new Event('pmg-auth-updated'));
    return window.PMG_AUTH.user;
  }
}

async function bootstrapAuth(uiRole = 'it') {
  await fetchAuthConfig();
  const restored = restoreAuthSession();
  if (restored && window.PMG_AUTH.accessToken) {
    try {
      return await fetchMe();
    } catch (e) {
      clearAuthSession();
    }
  }
  return null;
}

Object.assign(window, {
  PMG_AUTH: window.PMG_AUTH,
  getAuthHeaders,
  fetchAuthConfig,
  fetchMe,
  signIn,
  signInDev,
  signInEntra,
  signOutAuth: clearAuthSession,
  bootstrapAuth,
  setDevAuthRole,
  uiRoleFromApi,
  apiRoleFromUi,
  clearAuthSession,
});
