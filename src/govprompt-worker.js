import searchWorker from './search-worker.js';

const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const VALID_MODULE = /^GP0(?:0[1-9]|1[0-3])$/;
const VALID_TRANSACTION = /^[a-z0-9-]{1,40}$/;
const MAX_USAGE_BODY_BYTES = 1024;
const MAX_DAYS = 90;

const USAGE_HEADERS = Object.freeze({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'pragma': 'no-cache',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'no-referrer',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'access-control-allow-origin': FRONTEND_ORIGIN,
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '600',
  'vary': 'Origin'
});

function usageJson(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: USAGE_HEADERS });
}

function allowedOrigin(request) {
  return request.headers.get('origin') === FRONTEND_ORIGIN;
}

async function readSmallJson(request) {
  const headerLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(headerLength) && headerLength > MAX_USAGE_BODY_BYTES) return { ok: false, error: 'REQUEST_TOO_LARGE' };
  const raw = await request.arrayBuffer();
  if (raw.byteLength > MAX_USAGE_BODY_BYTES) return { ok: false, error: 'REQUEST_TOO_LARGE' };
  try {
    return { ok: true, body: JSON.parse(new TextDecoder().decode(raw)) };
  } catch {
    return { ok: false, error: 'INVALID_JSON' };
  }
}

function normalizeUsage(body) {
  const moduleId = String(body?.moduleId || '').trim().toUpperCase();
  const transactionType = String(body?.transactionType || '').trim().toLowerCase();
  if (!VALID_MODULE.test(moduleId)) return { ok: false, error: 'INVALID_MODULE' };
  if (!VALID_TRANSACTION.test(transactionType)) return { ok: false, error: 'INVALID_TRANSACTION' };
  return { ok: true, moduleId, transactionType };
}

function emptyAggregate() {
  return { total: 0, byModule: {}, byTransaction: {}, byDay: {}, updatedAt: null };
}

function trimDays(byDay) {
  const entries = Object.entries(byDay || {}).sort(([a], [b]) => b.localeCompare(a)).slice(0, MAX_DAYS);
  return Object.fromEntries(entries);
}

export class UsageCounter {
  constructor(ctx) {
    this.ctx = ctx;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/increment') {
      let payload;
      try { payload = await request.json(); }
      catch { return usageJson({ ok: false, error: 'INVALID_JSON' }, 400); }
      const normalized = normalizeUsage(payload);
      if (!normalized.ok) return usageJson({ ok: false, error: normalized.error }, 400);

      const today = new Date().toISOString().slice(0, 10);
      const updatedAt = new Date().toISOString();
      await this.ctx.storage.transaction(async transaction => {
        const aggregate = (await transaction.get('aggregate')) || emptyAggregate();
        aggregate.total = Number(aggregate.total || 0) + 1;
        aggregate.byModule = { ...(aggregate.byModule || {}) };
        aggregate.byTransaction = { ...(aggregate.byTransaction || {}) };
        aggregate.byDay = { ...(aggregate.byDay || {}) };
        aggregate.byModule[normalized.moduleId] = Number(aggregate.byModule[normalized.moduleId] || 0) + 1;
        aggregate.byTransaction[normalized.transactionType] = Number(aggregate.byTransaction[normalized.transactionType] || 0) + 1;
        aggregate.byDay[today] = Number(aggregate.byDay[today] || 0) + 1;
        aggregate.byDay = trimDays(aggregate.byDay);
        aggregate.updatedAt = updatedAt;
        await transaction.put('aggregate', aggregate);
      });
      return usageJson({ ok: true }, 202);
    }

    if (request.method === 'GET' && url.pathname === '/summary') {
      const aggregate = (await this.ctx.storage.get('aggregate')) || emptyAggregate();
      return usageJson({
        ok: true,
        privacy: 'Aggregate counts only. No prompt text, file content, name, email, IP address, user agent, cookie, fingerprint, or user identifier is stored.',
        ...aggregate,
        byDay: trimDays(aggregate.byDay)
      });
    }

    return usageJson({ ok: false, error: 'NOT_FOUND' }, 404);
  }
}

async function handleUsageApi(request, env, url) {
  if (request.method === 'OPTIONS') {
    if (!allowedOrigin(request)) return usageJson({ ok: false, error: 'ORIGIN_NOT_ALLOWED' }, 403);
    return new Response(null, { status: 204, headers: USAGE_HEADERS });
  }
  if (!allowedOrigin(request)) return usageJson({ ok: false, error: 'ORIGIN_NOT_ALLOWED' }, 403);
  if (!env?.USAGE_COUNTER) return usageJson({ ok: false, error: 'USAGE_COUNTER_UNAVAILABLE' }, 503);

  const id = env.USAGE_COUNTER.idFromName('govprompt-global');
  const stub = env.USAGE_COUNTER.get(id);

  if (url.pathname === '/api/usage') {
    if (request.method !== 'POST') return usageJson({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
    const parsed = await readSmallJson(request);
    if (!parsed.ok) return usageJson({ ok: false, error: parsed.error }, parsed.error === 'REQUEST_TOO_LARGE' ? 413 : 400);
    const normalized = normalizeUsage(parsed.body);
    if (!normalized.ok) return usageJson({ ok: false, error: normalized.error }, 400);
    return stub.fetch('https://usage.internal/increment', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ moduleId: normalized.moduleId, transactionType: normalized.transactionType })
    });
  }

  if (url.pathname === '/api/usage-summary') {
    if (request.method !== 'GET') return usageJson({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);
    return stub.fetch('https://usage.internal/summary');
  }

  return usageJson({ ok: false, error: 'NOT_FOUND' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/usage' || url.pathname === '/api/usage-summary') {
      return handleUsageApi(request, env, url);
    }
    return searchWorker.fetch(request, env, ctx);
  }
};
