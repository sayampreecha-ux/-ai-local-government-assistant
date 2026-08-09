import assert from 'node:assert/strict';
import worker from '../src/search-worker.js';

const FRONTEND_ORIGIN = 'https://sayampreecha-ux.github.io';
const SECURITY_POLICY_VERSION = '2026-08-09.1';
let lastAssetUrl = '';
const assets = {
  fetch: async request => {
    lastAssetUrl = String(request.url);
    return new Response('asset', { status: 200 });
  }
};

const noKeyRequest = new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: FRONTEND_ORIGIN },
  body: JSON.stringify({ query: 'ระเบียบค่าเดินทางล่าสุด', sites: ['cgd.go.th', 'example.com'] })
});
const noKeyResponse = await worker.fetch(noKeyRequest, { ASSETS: assets });
assert.equal(noKeyResponse.status, 503);
assert.equal(noKeyResponse.headers.get('x-govprompt-security'), SECURITY_POLICY_VERSION);
const noKeyBody = await noKeyResponse.json();
assert.equal(noKeyBody.error, 'SEARCH_PROVIDER_NOT_CONFIGURED');

const invalidMethod = await worker.fetch(new Request('https://example.test/api/official-search'), { ASSETS: assets });
assert.equal(invalidMethod.status, 405);
assert.equal(typeof (await invalidMethod.json()).requestId, 'string');

const preflight = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'OPTIONS',
  headers: { origin: FRONTEND_ORIGIN }
}), { ASSETS: assets });
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('access-control-allow-origin'), FRONTEND_ORIGIN);
assert.equal(preflight.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
assert.equal(preflight.headers.get('access-control-allow-headers'), 'authorization, content-type');

const accessEnv = {
  ASSETS: assets,
  ACCESS_CODE_SECRET: 'local-test-code-key',
  ACCESS_ADMIN_PASSWORD_HASH: '',
  ACCESS_ADMIN_SESSION_SECRET: 'local-test-session-key'
};
const testPassword = 'local-test-password';
const passwordDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(testPassword));
accessEnv.ACCESS_ADMIN_PASSWORD_HASH = [...new Uint8Array(passwordDigest)].map(value => value.toString(16).padStart(2, '0')).join('');

const missingAccessBindings = await worker.fetch(new Request('https://example.test/api/access/validate', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'invalid' })
}), { ASSETS: assets });
assert.equal(missingAccessBindings.status, 503);

const loginResponse = await worker.fetch(new Request('https://example.test/api/access/admin/login', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ password: testPassword })
}), accessEnv);
assert.equal(loginResponse.status, 200);
const loginBody = await loginResponse.json();
assert.equal(typeof loginBody.token, 'string');
assert.equal(JSON.stringify(loginBody).includes(testPassword), false);

const issueResponse = await worker.fetch(new Request('https://example.test/api/access/admin/issue', {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${loginBody.token}` },
  body: JSON.stringify({ serial: '0001' })
}), accessEnv);
assert.equal(issueResponse.status, 200);
const issueBody = await issueResponse.json();
assert.match(issueBody.code, /^GP69-0001-[A-F0-9]{8}$/);

const validAccess = await worker.fetch(new Request('https://example.test/api/access/validate', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: issueBody.code })
}), accessEnv);
assert.equal(validAccess.status, 200);
assert.deepEqual(await validAccess.json(), { ok: true });

const unauthorizedIssue = await worker.fetch(new Request('https://example.test/api/access/admin/issue', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ serial: '0002' })
}), accessEnv);
assert.equal(unauthorizedIssue.status, 401);
assert.equal(preflight.headers.get('access-control-expose-headers'), 'x-govprompt-security');
assert.equal(preflight.headers.get('cache-control'), 'no-store');
assert.equal(preflight.headers.get('x-govprompt-security'), SECURITY_POLICY_VERSION);
assert.equal(preflight.headers.get('content-security-policy'), "default-src 'none'; frame-ancestors 'none'");

const noOrigin = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query: 'ระเบียบค่าเดินทาง', sites: ['cgd.go.th'] })
}), { ASSETS: assets });
assert.equal(noOrigin.status, 403);
assert.equal((await noOrigin.json()).error, 'ORIGIN_NOT_ALLOWED');

const rejectedOrigin = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: 'https://evil.example' },
  body: JSON.stringify({ query: 'ระเบียบค่าเดินทาง', sites: ['cgd.go.th'] })
}), { ASSETS: assets });
assert.equal(rejectedOrigin.status, 403);
assert.equal((await rejectedOrigin.json()).error, 'ORIGIN_NOT_ALLOWED');

const oversizedBody = JSON.stringify({ query: 'ก'.repeat(17 * 1024), sites: ['dla.go.th'] });
const oversizedRequest = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: FRONTEND_ORIGIN },
  body: oversizedBody
}), { ASSETS: assets });
assert.equal(oversizedRequest.status, 413);
assert.equal((await oversizedRequest.json()).error, 'REQUEST_TOO_LARGE');

const rateLimited = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: FRONTEND_ORIGIN },
  body: JSON.stringify({ query: 'ระเบียบค่าเดินทาง', sites: ['cgd.go.th'] })
}), {
  ASSETS: assets,
  OFFICIAL_SEARCH_RATE_LIMITER: { limit: async () => ({ success: false }) }
});
assert.equal(rateLimited.status, 429);
assert.equal(rateLimited.headers.get('retry-after'), '60');
assert.equal((await rateLimited.json()).error, 'RATE_LIMITED');

const sensitiveRequest = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: FRONTEND_ORIGIN },
  body: JSON.stringify({ query: 'ตรวจสิทธิของนาย ก เลขบัตร 1234567890123', sites: ['dla.go.th'] })
}), { ASSETS: assets, TAVILY_API_KEY: 'unused-secret' });
assert.equal(sensitiveRequest.status, 422);
const sensitiveBody = await sensitiveRequest.json();
assert.equal(sensitiveBody.error, 'SENSITIVE_QUERY_BLOCKED');
assert.equal(JSON.stringify(sensitiveBody).includes('1234567890123'), false);

const secretRequest = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: FRONTEND_ORIGIN },
  body: JSON.stringify({ query: 'api key: super-secret-value ระเบียบราชการ', sites: ['dla.go.th'] })
}), { ASSETS: assets, TAVILY_API_KEY: 'unused-secret' });
assert.equal(secretRequest.status, 422);
assert.equal((await secretRequest.json()).error, 'SENSITIVE_QUERY_BLOCKED');

const originalFetch = globalThis.fetch;
let providerRequest;
globalThis.fetch = async (url, options) => {
  providerRequest = { url: String(url), options };
  return new Response(JSON.stringify({
    results: [
      {
        title: 'ต้นฉบับราชการ',
        url: 'https://www.cgd.go.th/example',
        content: 'ผลค้นจากกรมบัญชีกลาง',
        published_date: '2026-08-07T00:00:00Z'
      },
      {
        title: 'เว็บสรุปภายนอก',
        url: 'https://example.com/summary',
        content: 'ต้องถูกกรองออก'
      }
    ]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

try {
  const liveRequest = new Request('https://example.test/api/official-search', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: FRONTEND_ORIGIN },
    body: JSON.stringify({ query: 'หนังสือเวียนกรมบัญชีกลางล่าสุด', sites: ['cgd.go.th', 'example.com'], count: 10 })
  });
  const liveResponse = await worker.fetch(liveRequest, {
    ASSETS: assets,
    TAVILY_API_KEY: 'test-secret-never-return',
    OFFICIAL_SEARCH_RATE_LIMITER: { limit: async () => ({ success: true }) }
  });
  assert.equal(liveResponse.status, 200);
  assert.equal(liveResponse.headers.get('x-govprompt-security'), SECURITY_POLICY_VERSION);
  const liveBody = await liveResponse.json();
  assert.equal(liveBody.provider, 'tavily');
  assert.equal('query' in liveBody, false);
  assert.deepEqual(liveBody.sites, ['cgd.go.th']);
  assert.equal(liveBody.results.length, 1);
  assert.equal(liveBody.results[0].host, 'cgd.go.th');
  assert.equal(liveBody.results[0].sourceTier, 'primary');
  assert.equal(liveBody.results[0].documentDate, '2026-08-07');
  assert.equal(liveBody.results[0].status, 'unknown');
  assert.equal(JSON.stringify(liveBody).includes('test-secret-never-return'), false);
  assert.equal(providerRequest.options.headers.authorization, 'Bearer test-secret-never-return');
  const providerBody = JSON.parse(providerRequest.options.body);
  assert.deepEqual(providerBody.include_domains, ['cgd.go.th']);
  assert.equal(providerBody.include_answer, false);
  assert.equal(providerBody.include_raw_content, false);
} finally {
  globalThis.fetch = originalFetch;
}

const rootResponse = await worker.fetch(new Request('https://example.test/'), { ASSETS: assets });
assert.equal(rootResponse.status, 200);
assert.equal(await rootResponse.text(), 'asset');
assert.equal(new URL(lastAssetUrl).pathname, '/index.html');

const assetResponse = await worker.fetch(new Request('https://example.test/index.html'), { ASSETS: assets });
assert.equal(assetResponse.status, 200);
assert.equal(await assetResponse.text(), 'asset');

const previewFallback = await worker.fetch(new Request('https://example.test/'), {});
assert.equal(previewFallback.status, 404);

console.log('GovPrompt v7 Live Search Backend verification passed with strict origin, body-size, rate-limit, privacy and security-policy controls.');
