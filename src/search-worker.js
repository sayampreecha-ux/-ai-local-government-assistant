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

const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const MAX_REQUEST_BYTES = 16 * 1024;
const SECURITY_POLICY_VERSION = '2026-08-09.1';
const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'pragma': 'no-cache',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-govprompt-security': SECURITY_POLICY_VERSION,
  'access-control-allow-origin': FRONTEND_ORIGIN,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-expose-headers': 'x-govprompt-security',
  'access-control-max-age': '600',
  'vary': 'Origin'
});

const HIGH_CONFIDENCE_SENSITIVE_PATTERNS = Object.freeze([
  /\b\d(?:[ -]?\d){12}\b/g,
  /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
  /(?:\+66|0)\s*\d(?:[\s-]*\d){7,8}\b/g,
  /(?:เลขบัญชี|บัญชีธนาคาร|พร้อมเพย์)\s*[:：-]?\s*[0-9\s-]{6,20}/gi,
  /(?:password|passwd|api\s*key|secret|token|รหัสผ่าน|กุญแจ\s*api)\s*[:=：-]?\s*[^\s,;]+/gi,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  /(?:ข้อมูลลับของราชการ|ชั้นความลับ|ลับมาก|ลับที่สุด)\s*[:：-]?\s*[^,;\n]{1,120}/gi,
  /(?:HN|AN|เลขผู้ป่วย|รหัสผู้ป่วย)\s*[:：-]?\s*[A-Za-z0-9/-]{3,30}/gi
]);

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders }
  });
}

function logSearch(level, fields) {
  const entry = JSON.stringify({ service: 'official-search', ...fields });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.log(entry);
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

function containsHighConfidenceSensitiveData(query) {
  return HIGH_CONFIDENCE_SENSITIVE_PATTERNS.some(pattern => {
    pattern.lastIndex = 0;
    return pattern.test(query);
  });
}

function isAllowedOrigin(request) {
  return request.headers.get('origin') === FRONTEND_ORIGIN;
}

function requestTooLargeByHeader(request) {
  const header = request.headers.get('content-length');
  if (!header) return false;
  const bytes = Number(header);
  return Number.isFinite(bytes) && bytes > MAX_REQUEST_BYTES;
}

async function readJsonBody(request) {
  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_REQUEST_BYTES) return { ok: false, error: 'REQUEST_TOO_LARGE' };
  try {
    const text = new TextDecoder().decode(raw);
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, error: 'INVALID_JSON' };
  }
}

async function checkRateLimit(request, env, url, requestId) {
  const limiter = env?.OFFICIAL_SEARCH_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== 'function') {
    logSearch('warn', {
      event: 'rate_limit_unavailable', requestId,
      reason: 'RATE_LIMIT_BINDING_MISSING'
    });
    return { allowed: true, configured: false };
  }

  const key = `public-web:${url.pathname}`;
  try {
    const result = await limiter.limit({ key });
    return { allowed: Boolean(result?.success), configured: true };
  } catch {
    logSearch('error', {
      event: 'rate_limit_error', requestId,
      reason: 'RATE_LIMIT_CHECK_FAILED'
    });
    return { allowed: false, configured: true };
  }
}

function normalizeResult(item) {
  const url = cleanText(item?.url, 1200);
  let parsed;
  try { parsed = new URL(url); } catch { return null; }
  const host = parsed.hostname;
  if (!url || parsed.protocol !== 'https:' || !isOfficialHost(host)) return null;
  return {
    title: cleanText(item?.title, 300),
    url: parsed.toString(),
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

  let response;
  try {
    response = await fetch('https://api.tavily.com/search', {
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
  } catch {
    return { ok: false, status: 502, error: 'SEARCH_PROVIDER_NETWORK_ERROR' };
  }

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
    const requestId = request.headers.get('cf-ray') || crypto.randomUUID();
    const startedAt = Date.now();

    if (request.method === 'OPTIONS') {
      if (!isAllowedOrigin(request)) return json({ ok: false, error: 'ORIGIN_NOT_ALLOWED', requestId }, 403);
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }
    if (request.method !== 'POST') {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'METHOD_NOT_ALLOWED' });
      return json({ ok: false, error: 'METHOD_NOT_ALLOWED', requestId }, 405);
    }
    if (!isAllowedOrigin(request)) {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'ORIGIN_NOT_ALLOWED' });
      return json({ ok: false, error: 'ORIGIN_NOT_ALLOWED', requestId }, 403);
    }
    if (requestTooLargeByHeader(request)) {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'REQUEST_TOO_LARGE' });
      return json({ ok: false, error: 'REQUEST_TOO_LARGE', requestId }, 413);
    }

    const rateLimit = await checkRateLimit(request, env, url, requestId);
    if (!rateLimit.allowed) {
      logSearch('warn', {
        event: 'request_rejected', requestId, method: request.method,
        reason: 'RATE_LIMITED'
      });
      return json({ ok: false, error: 'RATE_LIMITED', requestId }, 429, { 'retry-after': '60' });
    }

    const parsedBody = await readJsonBody(request);
    if (!parsedBody.ok) {
      const status = parsedBody.error === 'REQUEST_TOO_LARGE' ? 413 : 400;
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: parsedBody.error });
      return json({ ok: false, error: parsedBody.error, requestId }, status);
    }

    const payload = parseRequestBody(parsedBody.body);
    if (!payload.query) {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'QUERY_REQUIRED' });
      return json({ ok: false, error: 'QUERY_REQUIRED', requestId }, 400);
    }
    if (containsHighConfidenceSensitiveData(payload.query)) {
      logSearch('warn', {
        event: 'request_rejected', requestId, method: request.method,
        reason: 'SENSITIVE_QUERY_BLOCKED', queryLength: payload.query.length
      });
      return json({ ok: false, error: 'SENSITIVE_QUERY_BLOCKED', requestId }, 422);
    }

    logSearch('info', {
      event: 'search_started', requestId, method: request.method,
      queryLength: payload.query.length, siteCount: payload.sites.length,
      requestedCount: payload.count, providerConfigured: Boolean(env.TAVILY_API_KEY),
      rateLimitConfigured: rateLimit.configured, securityPolicyVersion: SECURITY_POLICY_VERSION
    });

    const search = await searchTavily(env, payload);
    if (!search.ok) {
      logSearch('error', {
        event: 'search_failed', requestId, error: search.error,
        providerStatus: search.providerStatus ?? null, durationMs: Date.now() - startedAt,
        securityPolicyVersion: SECURITY_POLICY_VERSION
      });
      return json({ ok: false, error: search.error, providerStatus: search.providerStatus ?? null, requestId }, search.status);
    }

    logSearch('info', {
      event: 'search_completed', requestId, provider: search.provider,
      resultCount: search.results.length, durationMs: Date.now() - startedAt,
      securityPolicyVersion: SECURITY_POLICY_VERSION
    });

    return json({
      ok: true,
      requestId,
      sites: payload.sites,
      provider: search.provider,
      searchedAt: new Date().toISOString(),
      results: search.results
    });
  }
};
