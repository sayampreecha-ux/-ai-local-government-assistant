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
const ACCESS_CODE_PATTERN = /^GP69-(\d{4})-([A-F0-9]{8})$/;
const ADMIN_SESSION_TTL_SECONDS = 15 * 60;
const JSON_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'access-control-allow-origin': FRONTEND_ORIGIN,
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type',
  'vary': 'Origin'
});

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

const encoder = new TextEncoder();

function bytesToHex(bytes) {
  return [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
}

function bytesToBase64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function constantTimeEqual(left, right) {
  const a = encoder.encode(String(left));
  const b = encoder.encode(String(right));
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) difference |= (a[index % a.length] ?? 0) ^ (b[index % b.length] ?? 0);
  return difference === 0;
}

async function sha256(value) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

function accessSecretsConfigured(env) {
  return Boolean(env.ACCESS_CODE_SECRET && env.ACCESS_ADMIN_PASSWORD_HASH && env.ACCESS_ADMIN_SESSION_SECRET);
}

async function validateAccessCode(code, env) {
  const normalized = cleanText(code, 32).toUpperCase();
  const match = ACCESS_CODE_PATTERN.exec(normalized);
  if (!match || !env.ACCESS_CODE_SECRET) return false;
  const expected = bytesToHex(await hmac(env.ACCESS_CODE_SECRET, match[1])).slice(0, 8).toUpperCase();
  return constantTimeEqual(expected, match[2]);
}

async function createAdminSession(env) {
  const payload = bytesToBase64Url(encoder.encode(JSON.stringify({
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS,
    nonce: crypto.randomUUID()
  })));
  const signature = bytesToBase64Url(await hmac(env.ACCESS_ADMIN_SESSION_SECRET, payload));
  return `${payload}.${signature}`;
}

async function validateAdminSession(request, env) {
  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra || !env.ACCESS_ADMIN_SESSION_SECRET) return false;
  const expectedSignature = bytesToBase64Url(await hmac(env.ACCESS_ADMIN_SESSION_SECRET, payload));
  if (!constantTimeEqual(expectedSignature, suppliedSignature)) return false;
  try {
    const base64 = payload.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), character => character.charCodeAt(0))));
    return Number.isSafeInteger(decoded.exp) && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

async function readJson(request, maxBytes = 2048) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
  const text = await request.text();
  if (encoder.encode(text).byteLength > maxBytes) throw new Error('PAYLOAD_TOO_LARGE');
  return JSON.parse(text);
}

async function handleAccessApi(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
  if (request.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
  if (!accessSecretsConfigured(env)) return json({ ok: false, error: 'ACCESS_SERVICE_NOT_CONFIGURED' }, 503);

  let body;
  try { body = await readJson(request); }
  catch (error) { return json({ ok: false, error: error.message === 'PAYLOAD_TOO_LARGE' ? error.message : 'INVALID_JSON' }, error.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400); }

  if (url.pathname === '/api/access/validate') {
    return (await validateAccessCode(body?.code, env)) ? json({ ok: true }) : json({ ok: false, error: 'INVALID_ACCESS_CODE' }, 401);
  }

  if (url.pathname === '/api/access/admin/login') {
    const suppliedHash = await sha256(cleanText(body?.password, 256));
    if (!constantTimeEqual(suppliedHash, env.ACCESS_ADMIN_PASSWORD_HASH)) return json({ ok: false, error: 'INVALID_ADMIN_CREDENTIALS' }, 401);
    return json({ ok: true, token: await createAdminSession(env), expiresIn: ADMIN_SESSION_TTL_SECONDS });
  }

  if (url.pathname === '/api/access/admin/issue') {
    if (!(await validateAdminSession(request, env))) return json({ ok: false, error: 'UNAUTHORIZED' }, 401);
    const serial = cleanText(body?.serial, 4);
    if (!/^\d{4}$/.test(serial)) return json({ ok: false, error: 'INVALID_SERIAL' }, 400);
    const signature = bytesToHex(await hmac(env.ACCESS_CODE_SECRET, serial)).slice(0, 8).toUpperCase();
    return json({ ok: true, code: `GP69-${serial}-${signature}` });
  }

  return json({ ok: false, error: 'NOT_FOUND' }, 404);
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
    if (url.pathname.startsWith('/api/access/')) return handleAccessApi(request, env, url);
    if (url.pathname !== '/api/official-search') return fetchAsset(request, env, url);
    const requestId = request.headers.get('cf-ray') || crypto.randomUUID();
    const startedAt = Date.now();
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: JSON_HEADERS });
    if (request.method !== 'POST') {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'METHOD_NOT_ALLOWED' });
      return json({ ok: false, error: 'METHOD_NOT_ALLOWED', requestId }, 405);
    }

    let body;
    try { body = await readJson(request, 8192); } catch {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'INVALID_JSON' });
      return json({ ok: false, error: 'INVALID_JSON', requestId }, 400);
    }
    const payload = parseRequestBody(body);
    if (!payload.query) {
      logSearch('warn', { event: 'request_rejected', requestId, method: request.method, reason: 'QUERY_REQUIRED' });
      return json({ ok: false, error: 'QUERY_REQUIRED', requestId }, 400);
    }

    logSearch('info', {
      event: 'search_started', requestId, method: request.method,
      queryLength: payload.query.length, siteCount: payload.sites.length,
      requestedCount: payload.count, providerConfigured: Boolean(env.TAVILY_API_KEY)
    });

    const search = await searchTavily(env, payload);
    if (!search.ok) {
      logSearch('error', {
        event: 'search_failed', requestId, error: search.error,
        providerStatus: search.providerStatus ?? null, durationMs: Date.now() - startedAt
      });
      return json({ ok: false, error: search.error, providerStatus: search.providerStatus ?? null, requestId }, search.status);
    }

    logSearch('info', {
      event: 'search_completed', requestId, provider: search.provider,
      resultCount: search.results.length, durationMs: Date.now() - startedAt
    });

    return json({
      ok: true,
      requestId,
      query: payload.query,
      sites: payload.sites,
      provider: search.provider,
      searchedAt: new Date().toISOString(),
      results: search.results
    });
  }
};
