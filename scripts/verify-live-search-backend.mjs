import assert from 'node:assert/strict';
import worker from '../src/search-worker.js';

const assets = { fetch: async () => new Response('asset', { status: 200 }) };

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

const originalFetch = globalThis.fetch;
let providerRequest;
globalThis.fetch = async (url, options) => {
  providerRequest = { url: String(url), options };
  return new Response(JSON.stringify({
    web: {
      results: [
        {
          title: 'ต้นฉบับราชการ',
          url: 'https://www.cgd.go.th/example',
          description: 'ผลค้นจากกรมบัญชีกลาง',
          page_age: '2026-08-07T00:00:00Z'
        },
        {
          title: 'เว็บสรุปภายนอก',
          url: 'https://example.com/summary',
          description: 'ต้องถูกกรองออก'
        }
      ]
    }
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

try {
  const liveRequest = new Request('https://example.test/api/official-search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'หนังสือเวียนกรมบัญชีกลางล่าสุด', sites: ['cgd.go.th', 'example.com'], count: 10 })
  });
  const liveResponse = await worker.fetch(liveRequest, { ASSETS: assets, BRAVE_SEARCH_API_KEY: 'test-secret-never-return' });
  assert.equal(liveResponse.status, 200);
  const liveBody = await liveResponse.json();
  assert.equal(liveBody.provider, 'brave');
  assert.deepEqual(liveBody.sites, ['cgd.go.th']);
  assert.equal(liveBody.results.length, 1);
  assert.equal(liveBody.results[0].host, 'cgd.go.th');
  assert.equal(liveBody.results[0].sourceTier, 'primary');
  assert.equal(liveBody.results[0].documentDate, '2026-08-07');
  assert.equal(liveBody.results[0].status, 'unknown');
  assert.equal(JSON.stringify(liveBody).includes('test-secret-never-return'), false);
  assert.equal(providerRequest.options.headers['x-subscription-token'], 'test-secret-never-return');
  assert.equal(providerRequest.url.includes('example.com'), false);
} finally {
  globalThis.fetch = originalFetch;
}

const assetResponse = await worker.fetch(new Request('https://example.test/index.html'), { ASSETS: assets });
assert.equal(assetResponse.status, 200);
assert.equal(await assetResponse.text(), 'asset');

console.log('GovPrompt v7 Live Search Backend verification passed for Sprint 2.3.');
