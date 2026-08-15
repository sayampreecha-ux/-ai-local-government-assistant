import baseWorker from './search-worker.js';

const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const SECURITY_POLICY_VERSION = '2026-08-15.budget-reader-v2';
const MAX_REQUEST_BYTES = 16 * 1024;
const MAX_EXTRACT_CHARS = 800_000;
const OFFICIAL_EXACT_HOSTS = new Set([
  'ratchakitcha.soc.go.th', 'krisdika.go.th', 'cgd.go.th', 'moi.go.th', 'dla.go.th', 'bb.go.th',
  'admincourt.go.th', 'coj.go.th', 'supremecourt.or.th', 'nacc.go.th', 'pacc.go.th', 'audit.go.th'
]);
const SENSITIVE = Object.freeze([
  /\b\d(?:[ -]?\d){12}\b/g,
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
  /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g,
  /(?:password|passwd|api\s*key|secret|token|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /(?:ข้อมูลลับของราชการ|ชั้นความลับ|ลับมาก|ลับที่สุด)\s*[:：-]?\s*[^,;\n]{1,120}/gi,
  /(?:HN|AN|เลขผู้ป่วย|รหัสผู้ป่วย)\s*[:：-]?\s*[A-Za-z0-9/-]{3,30}/gi
]);
const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store', 'pragma': 'no-cache', 'x-content-type-options': 'nosniff', 'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer', 'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()', 'x-govprompt-security': SECURITY_POLICY_VERSION,
  'access-control-allow-origin': FRONTEND_ORIGIN, 'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type', 'access-control-expose-headers': 'x-govprompt-security',
  'access-control-max-age': '600', 'vary': 'Origin'
});

const encoder = new TextEncoder();
const clean = (value, max = 1200) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const normalizeHost = value => clean(value, 260).toLowerCase().replace(/^www\./, '');
function json(body, status = 200, extraHeaders = {}) { return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } }); }
function isOfficialHost(hostname) {
  const host = normalizeHost(hostname);
  return Boolean(host.endsWith('.go.th') || host === 'go.th' || [...OFFICIAL_EXACT_HOSTS].some(allowed => host === allowed || host.endsWith(`.${allowed}`)));
}
function parseOfficialUrl(value) {
  try { const url = new URL(clean(value, 1800)); if (url.protocol !== 'https:' || !isOfficialHost(url.hostname)) return null; url.hash = ''; return url; }
  catch { return null; }
}
function containsSensitive(value) {
  const query = String(value || '');
  return SENSITIVE.some(pattern => { pattern.lastIndex = 0; return pattern.test(query); });
}
async function sha256Text(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}
async function readJsonBody(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(length) && length > MAX_REQUEST_BYTES) return { ok: false, error: 'REQUEST_TOO_LARGE' };
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_REQUEST_BYTES) return { ok: false, error: 'REQUEST_TOO_LARGE' };
  try { return { ok: true, body: JSON.parse(new TextDecoder().decode(bytes)) }; }
  catch { return { ok: false, error: 'INVALID_JSON' }; }
}
async function rateLimit(request, env, key) {
  const limiter = env?.OFFICIAL_SEARCH_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== 'function') return { allowed: true, configured: false };
  try { return { allowed: Boolean((await limiter.limit({ key }))?.success), configured: true }; }
  catch { return { allowed: false, configured: true }; }
}
function corsGuard(request, requestId) {
  if (request.headers.get('origin') !== FRONTEND_ORIGIN) return json({ ok: false, error: 'ORIGIN_NOT_ALLOWED', requestId }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED', requestId }, 405);
  return null;
}

function normalizeSearchResult(item) {
  const parsed = parseOfficialUrl(item?.url);
  if (!parsed) return null;
  return Object.freeze({
    title: clean(item?.title, 300),
    url: parsed.toString(),
    snippet: clean(item?.content ?? item?.description ?? item?.snippet, 700),
    host: normalizeHost(parsed.hostname),
    sourceTier: 'primary',
    documentDate: clean(item?.published_date ?? item?.page_age, 80).match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || '',
    effectiveDate: '', status: 'unknown', lastVerifiedAt: ''
  });
}

async function tavilySearchOfficial(env, query, count) {
  if (!env?.TAVILY_API_KEY) return { ok: false, status: 503, error: 'SEARCH_PROVIDER_NOT_CONFIGURED' };
  let response;
  try {
    response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { accept: 'application/json', authorization: `Bearer ${env.TAVILY_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ query, search_depth: 'advanced', max_results: Math.min(20, Math.max(8, count * 2)), include_answer: false, include_raw_content: false })
    });
  } catch { return { ok: false, status: 502, error: 'SEARCH_PROVIDER_NETWORK_ERROR' }; }
  if (!response.ok) return { ok: false, status: 502, error: 'SEARCH_PROVIDER_ERROR', providerStatus: response.status };
  let body;
  try { body = await response.json(); } catch { return { ok: false, status: 502, error: 'SEARCH_PROVIDER_INVALID_RESPONSE' }; }
  const results = (Array.isArray(body?.results) ? body.results : []).map(normalizeSearchResult).filter(Boolean).slice(0, count);
  return { ok: true, results, provider: 'tavily' };
}

async function handleOfficialSearch(request, env) {
  const requestId = request.headers.get('cf-ray') || crypto.randomUUID();
  const guard = corsGuard(request, requestId); if (guard) return guard;
  const limited = await rateLimit(request, env, 'public-web:/api/official-search-v2');
  if (!limited.allowed) return json({ ok: false, error: 'RATE_LIMITED', requestId }, 429, { 'retry-after': '60' });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error, requestId }, parsed.error === 'REQUEST_TOO_LARGE' ? 413 : 400);
  const query = clean(parsed.body?.query, 600);
  const count = Math.min(20, Math.max(1, Number(parsed.body?.count) || 10));
  if (!query) return json({ ok: false, error: 'QUERY_REQUIRED', requestId }, 400);
  if (containsSensitive(query)) return json({ ok: false, error: 'SENSITIVE_QUERY_BLOCKED', requestId }, 422);
  const search = await tavilySearchOfficial(env, query, count);
  if (!search.ok) return json({ ok: false, error: search.error, providerStatus: search.providerStatus ?? null, requestId }, search.status);
  return json({ ok: true, requestId, sites: [], provider: search.provider, searchedAt: new Date().toISOString(), results: search.results, officialDomainPolicy: 'thai-go-th-and-registered-official' });
}

async function tavilyExtract(env, url) {
  if (!env?.TAVILY_API_KEY) return { ok: false, status: 503, error: 'DOCUMENT_EXTRACT_PROVIDER_NOT_CONFIGURED' };
  let response;
  try {
    response = await fetch('https://api.tavily.com/extract', {
      method: 'POST', headers: { accept: 'application/json', authorization: `Bearer ${env.TAVILY_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ urls: url.toString(), extract_depth: 'advanced', format: 'markdown', include_images: false, timeout: 45 })
    });
  } catch { return { ok: false, status: 502, error: 'DOCUMENT_EXTRACT_NETWORK_ERROR' }; }
  if (!response.ok) return { ok: false, status: 502, error: 'DOCUMENT_EXTRACT_PROVIDER_ERROR', providerStatus: response.status };
  let body; try { body = await response.json(); } catch { return { ok: false, status: 502, error: 'DOCUMENT_EXTRACT_INVALID_RESPONSE' }; }
  const result = Array.isArray(body?.results) ? body.results[0] : null;
  const rawContent = typeof result?.raw_content === 'string' ? result.raw_content : '';
  if (!rawContent.trim()) return { ok: false, status: 422, error: 'DOCUMENT_CONTENT_EMPTY' };
  const resolved = parseOfficialUrl(result?.url || url.toString());
  if (!resolved) return { ok: false, status: 422, error: 'DOCUMENT_REDIRECTED_OUTSIDE_OFFICIAL_DOMAIN' };
  const trimmed = rawContent.slice(0, MAX_EXTRACT_CHARS);
  return { ok: true, sourceUrl: url.toString(), resolvedUrl: resolved.toString(), rawContent: trimmed, truncated: rawContent.length > trimmed.length, responseTime: Number(body?.response_time || 0), providerRequestId: clean(body?.request_id, 160) };
}

async function handleOfficialDocument(request, env) {
  const requestId = request.headers.get('cf-ray') || crypto.randomUUID();
  const guard = corsGuard(request, requestId); if (guard) return guard;
  const limited = await rateLimit(request, env, 'public-web:/api/official-document');
  if (!limited.allowed) return json({ ok: false, error: 'RATE_LIMITED', requestId }, 429, { 'retry-after': '60' });
  const parsed = await readJsonBody(request);
  if (!parsed.ok) return json({ ok: false, error: parsed.error, requestId }, parsed.error === 'REQUEST_TOO_LARGE' ? 413 : 400);
  const sourceUrl = parseOfficialUrl(parsed.body?.url);
  if (!sourceUrl) return json({ ok: false, error: 'OFFICIAL_HTTPS_URL_REQUIRED', requestId }, 422);
  const extracted = await tavilyExtract(env, sourceUrl);
  if (!extracted.ok) return json({ ok: false, error: extracted.error, providerStatus: extracted.providerStatus ?? null, requestId }, extracted.status);
  const contentHash = await sha256Text(extracted.rawContent);
  return json({
    ok: true, requestId, provider: 'tavily-extract', sourceUrl: extracted.sourceUrl, resolvedUrl: extracted.resolvedUrl,
    extractedAt: new Date().toISOString(), contentHash, contentLength: extracted.rawContent.length, truncated: extracted.truncated,
    rawContent: extracted.rawContent, providerRequestId: extracted.providerRequestId, responseTime: extracted.responseTime,
    governance: { sourceUrlValidatedBeforeExtraction: true, resolvedUrlMustRemainOfficial: true, searchSnippetNotUsedAsDocumentContent: true, extractionProviderIsNotSourceAuthority: true }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/official-search') return handleOfficialSearch(request, env);
    if (url.pathname === '/api/official-document') return handleOfficialDocument(request, env);
    return baseWorker.fetch(request, env, ctx);
  }
};
