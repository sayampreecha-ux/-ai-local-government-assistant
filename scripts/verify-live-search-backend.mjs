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

const assetResponse = await worker.fetch(new Request('https://example.test/index.html'), { ASSETS: assets });
assert.equal(assetResponse.status, 200);
assert.equal(await assetResponse.text(), 'asset');

console.log('GovPrompt v7 Live Search Backend verification passed.');
