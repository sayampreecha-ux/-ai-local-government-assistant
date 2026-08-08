const OFFICIAL_SOURCES = Object.freeze([
  { host: 'ratchakitcha.soc.go.th', name: 'ราชกิจจานุเบกษา', priority: 100 },
  { host: 'krisdika.go.th', name: 'สำนักงานคณะกรรมการกฤษฎีกา', priority: 98 },
  { host: 'cgd.go.th', name: 'กรมบัญชีกลาง', priority: 96 },
  { host: 'moi.go.th', name: 'กระทรวงมหาดไทย', priority: 94 },
  { host: 'dla.go.th', name: 'กรมส่งเสริมการปกครองท้องถิ่น', priority: 93 },
  { host: 'admincourt.go.th', name: 'ศาลปกครอง', priority: 92 },
  { host: 'coj.go.th', name: 'สำนักงานศาลยุติธรรม', priority: 91 },
  { host: 'bb.go.th', name: 'สำนักงบประมาณ', priority: 90 },
  { host: 'nacc.go.th', name: 'สำนักงาน ป.ป.ช.', priority: 90 },
  { host: 'pacc.go.th', name: 'สำนักงาน ป.ป.ท.', priority: 89 },
  { host: 'audit.go.th', name: 'สำนักงานการตรวจเงินแผ่นดิน', priority: 89 },
  { host: 'supremecourt.or.th', name: 'ศาลฎีกา', priority: 88 }
]);

const OFFICIAL_HOSTS = new Set(OFFICIAL_SOURCES.map(source => source.host));
const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': FRONTEND_ORIGIN,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'vary': 'Origin'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

function normalizeHost(value) {
  return String(value || '').trim().toLowerCase().replace(/^www\./, '');
}

function sourceForHost(host) {
  const normalized = normalizeHost(host);
  return OFFICIAL_SOURCES.find(source => normalized === source.host || normalized.endsWith(`.${source.host}`)) || null;
}

function isOfficialHost(host) {
  return Boolean(sourceForHost(host));
}

function cleanText(value, max = 500) {
  return String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeDate(value) {
  const raw = cleanText(value, 100);
  if (!raw) return '';
  const iso = /(20\d{2}|19\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})/.exec(raw);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString().slice(0, 10) : '';
}

function parseRequestBody(body) {
  const query = cleanText(body?.query, 400);
  const sites = Array.isArray(body?.sites)
    ? body.sites.map(normalizeHost).filter(isOfficialHost).slice(0, 10)
    : [];
  const count = Math.min(Math.max(Number(body?.count) || 10, 1), 20);
  return { query, sites, count };
}

function normalizeForMatch(value) {
  return cleanText(value, 2000).normalize('NFKC').toLowerCase();
}

function queryTerms(query) {
  return normalizeForMatch(query)
    .split(/[\s,.;:()\[\]{}"'\/\\|+-]+/)
    .map(term => term.trim())
    .filter(term => term.length >= 2 && !['ล่าสุด', 'ปัจจุบัน', 'เรื่อง', 'และ', 'หรือ', 'ของ', 'ให้', 'กับ'].includes(term));
}

function freshnessScore(date, wantsLatest) {
  if (!date) return wantsLatest ? -8 : 0;
  const ageDays = Math.max(0, (Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86400000);
  if (ageDays <= 30) return 20;
  if (ageDays <= 180) return 14;
  if (ageDays <= 365) return 10;
  if (ageDays <= 1095) return 4;
  return wantsLatest ? -4 : 0;
}

function normalizeResult(item) {
  const url = cleanText(item?.url, 1200);
  let host = '';
  try { host = new URL(url).hostname; } catch {}
  const source = sourceForHost(host);
  if (!url || !source) return null;
  return {
    title: cleanText(item?.title, 300),
    url,
    snippet: cleanText(item?.content ?? item?.description ?? item?.snippet, 700),
    host: normalizeHost(host),
    sourceName: source.name,
    sourceTier: 'primary',
    sourcePriority: source.priority,
    documentDate: normalizeDate(item?.published_date ?? item?.page_age),
    effectiveDate: '',
    status: 'unknown',
    lastVerifiedAt: ''
  };
}

function rankResults(results, query, count) {
  const terms = queryTerms(query);
  const wantsLatest = /(ล่าสุด|ปัจจุบัน|แก้ไขล่าสุด|ฉบับปัจจุบัน)/.test(normalizeForMatch(query));
  const seen = new Set();

  return results
    .filter(result => {
      const key = result.url.replace(/[?#].*$/, '').replace(/\/$/, '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(result => {
      const title = normalizeForMatch(result.title);
      const snippet = normalizeForMatch(result.snippet);
      const matchedTerms = terms.reduce((sum, term) => sum + (title.includes(term) ? 8 : 0) + (snippet.includes(term) ? 3 : 0), 0);
      const score = result.sourcePriority + matchedTerms + freshnessScore(result.documentDate, wantsLatest);
      return { ...result, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore || (b.documentDate || '').localeCompare(a.documentDate || '') || b.sourcePriority - a.sourcePriority)
    .slice(0, count);
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
      max_results: Math.min(Math.max(payload.count * 2, 10), 20),
      include_answer: false,
      include_raw_content: false,
      include_domains: payload.sites
    })
  });

  if (!response.ok) {
    return { ok: false, status: 502, error: 'SEARCH_PROVIDER_ERROR', providerStatus: response.status };
  }

  const data = await response.json();
  const normalized = (Array.isArray(data?.results) ? data.results : []).map(normalizeResult).filter(Boolean);
  return { ok: true, results: rankResults(normalized, payload.query, payload.count), provider: 'tavily' };
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
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
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
