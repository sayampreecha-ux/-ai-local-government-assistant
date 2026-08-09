import assert from 'node:assert/strict';
import worker from '../src/search-worker.js';

let lastAssetUrl = '';
const assets = {
  fetch: async request => {
    lastAssetUrl = String(request.url);
    return new Response('asset', { status: 200 });
  }
};

const noKeyRequest = new Request('https://example.test/api/official-search', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query: 'ระเบียบค่าเดินทางล่าสุด', sites: ['cgd.go.th', 'example.com'] })
});
const noKeyResponse = await worker.fetch(noKeyRequest, { ASSETS: assets });
assert.equal(noKeyResponse.status, 503);
const noKeyBody = await noKeyResponse.json();
assert.equal(noKeyBody.error, 'SEARCH_PROVIDER_NOT_CONFIGURED');

const invalidMethod = await worker.fetch(new Request('https://example.test/api/official-search'), { ASSETS: assets });
assert.equal(invalidMethod.status, 405);
assert.equal(typeof (await invalidMethod.json()).requestId, 'string');

const preflight = await worker.fetch(new Request('https://example.test/api/official-search', {
  method: 'OPTIONS',
  headers: { origin: 'https://sayampreecha-ux.github.io' }
}), { ASSETS: assets });
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://sayampreecha-ux.github.io');
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
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'หนังสือเวียนกรมบัญชีกลางล่าสุด', sites: ['cgd.go.th', 'example.com'], count: 10 })
  });
  const liveResponse = await worker.fetch(liveRequest, { ASSETS: assets, TAVILY_API_KEY: 'test-secret-never-return' });
  assert.equal(liveResponse.status, 200);
  const liveBody = await liveResponse.json();
  assert.equal(liveBody.provider, 'tavily');
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

console.log('GovPrompt v7 Live Search Backend verification passed for Sprint 2.3 Tavily + root asset routing.');
