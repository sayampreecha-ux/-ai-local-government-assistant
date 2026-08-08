const OFFICIAL_HOSTS = new Set([
  'ratchakitcha.soc.go.th',
  'krisdika.go.th',
  'cgd.go.th',
  'moi.go.th',
  'dla.go.th',
  'bb.go.th',
  'admincourt.go.th',
  'coj.go.th',
  'supremecourt.or.th',
  'nacc.go.th',
  'pacc.go.th',
  'audit.go.th'
]);

const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normalizeHost(value) {
  return String(value || '').trim().toLowerCase().replace(/^www\./, '');
}

function isOfficialHost(host) {
  const normalized = normalizeHost(host);
  return [...OFFICIAL_HOSTS].some(allowed => normalized === allowed || normalized.endsWith(`.${allowed}`));
}

function cleanText(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function parseRequestBody(body) {
  const query = cleanText(body?.query, 400);
  const sites = Array.isArray(body?.sites)
    ? body.sites.map(normalizeHost).filter(isOfficialHost).slice(0, 10)
    : [];
  const count = Math.min(Math.max(Number(body?.count) || 10, 1), 20);
  return { query, sites, count };
}

function buildProviderQuery(query, sites) {
  const siteClause = sites.length ? ` (${sites.map(site => `site:${site}`).join(' OR ')})` : '';
  return `${query}${siteClause}`.trim();
}

function normalizeResult(item) {
  const url = cleanText(item?.url, 1200);
  let host = '';
  try { host = new URL(url).hostname; } catch {}
  if (!url || !isOfficialHost(host)) return null;
  return {
    title: cleanText(item?.title, 300),
    url,
    snippet: cleanText(item?.description ?? item?.snippet, 700),
    host: normalizeHost(host),
    sourceTier: 'primary'
  };
}

async function searchBrave(env, payload) {
  if (!env.BRAVE_SEARCH_API_KEY) {
    return { ok: false, status: 503, error: 'SEARCH_PROVIDER_NOT_CONFIGURED' };
  }
  const providerQuery = buildProviderQuery(payload.query, payload.sites);
  const endpoint = new URL('https://api.search.brave.com/res/v1/web/search');
  endpoint.searchParams.set('q', providerQuery);
  endpoint.searchParams.set('count', String(payload.count));
  endpoint.searchParams.set('search_lang', 'th');
  endpoint.searchParams.set('safesearch', 'moderate');

  const response = await fetch(endpoint, {
    headers: {
      accept: 'application/json',
      'x-subscription-token': env.BRAVE_SEARCH_API_KEY
    }
  });
  if (!response.ok) {
    return { ok: false, status: 502, error: 'SEARCH_PROVIDER_ERROR', providerStatus: response.status };
  }
  const data = await response.json();
  const results = (data?.web?.results || []).map(normalizeResult).filter(Boolean);
  return { ok: true, results, provider: 'brave' };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/official-search') return env.ASSETS.fetch(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS' } });
    if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
    const payload = parseRequestBody(body);
    if (!payload.query) return json({ ok: false, error: 'QUERY_REQUIRED' }, 400);

    const search = await searchBrave(env, payload);
    if (!search.ok) return json({ ok: false, error: search.error, providerStatus: search.providerStatus ?? null }, search.status);

    return json({
      ok: true,
      query: payload.query,
      sites: payload.sites,
      provider: search.provider,
      searchedAt: new Date().toISOString(),
      results: search.results
    });
  }
};
