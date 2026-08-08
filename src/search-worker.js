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

function normalizeDate(value) {
  const raw = cleanText(value, 80);
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(raw);
  return match ? match[1] : '';
}

function parseRequestBody(body) {
  const query = cleanText(body?.query, 400);
  const sites = Array.isArray(body?.sites)
    ? body.sites.map(normalizeHost).filter(isOfficialHost).slice(0, 10)
    : [];
  const count = Math.min(Math.max(Number(body?.count) || 10, 1), 20);
  return { query, sites, count };
}

function normalizeResult(item) {
  const url = cleanText(item?.url, 1200);
  let host = '';
  try { host = new URL(url).hostname; } catch {}
  if (!url || !isOfficialHost(host)) return null;
  return {
    title: cleanText(item?.title, 300),
    url,
    snippet: cleanText(item?.content ?? item?.description ?? item?.snippet, 700),
    host: normalizeHost(host),
    sourceTier: 'primary',
    documentDate: normalizeDate(item?.published_date ?? item?.page_age),
    effectiveDate: '',
    status: 'unknown',
    lastVerifiedAt: ''
  };
}

async function searchTavily(env, payload) {
  if (!env.TAVILY_API_KEY) {
    return { ok: false, status: 503, error: 'SEARCH_PROVIDER_NOT_CONFIGURED' };
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${env.TAVILY_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      query: payload.query,
      search_depth: 'advanced',
      max_results: payload.count,
      include_answer: false,
      include_raw_content: false,
      include_domains: payload.sites
    })
  });

  if (!response.ok) {
    return { ok: false, status: 502, error: 'SEARCH_PROVIDER_ERROR', providerStatus: response.status };
  }

  const data = await response.json();
  const results = (Array.isArray(data?.results) ? data.results : []).map(normalizeResult).filter(Boolean);
  return { ok: true, results, provider: 'tavily' };
}

async function fetchAsset(request, env, url) {
  if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    return new Response('Not Found', { status: 404 });
  }

  if (url.pathname === '/') {
    const indexUrl = new URL(request.url);
    indexUrl.pathname = '/index.html';
    return env.ASSETS.fetch(new Request(indexUrl, request));
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/official-search') return fetchAsset(request, env, url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { allow: 'POST, OPTIONS' } });
    if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'INVALID_JSON' }, 400); }
    const payload = parseRequestBody(body);
    if (!payload.query) return json({ ok: false, error: 'QUERY_REQUIRED' }, 400);

    const search = await searchTavily(env, payload);
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
