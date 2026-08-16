import assert from 'node:assert/strict';
import test from 'node:test';
import worker from '../src/search-worker-v2.js';

const ORIGIN = 'https://sayampreecha-ux.github.io';
const env = Object.freeze({ TAVILY_API_KEY: 'synthetic-test-key' });

function request(path, body) {
  return new Request(`https://example.test${path}`, {
    method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

async function withProviderStatus(status, callback) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ detail: { error: 'provider detail must not leak' } }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
  try { return await callback(); }
  finally { globalThis.fetch = originalFetch; }
}

test('official search maps Tavily plan usage limit to a safe explicit 503', { concurrency: false }, async () => {
  await withProviderStatus(432, async () => {
    const response = await worker.fetch(request('/api/official-search', { query: 'ระเบียบค่าเดินทาง', count: 3 }), env);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error, 'SEARCH_PROVIDER_USAGE_LIMIT');
    assert.equal(body.providerStatus, 432);
    assert.equal(JSON.stringify(body).includes('provider detail must not leak'), false);
    assert.equal(JSON.stringify(body).includes(env.TAVILY_API_KEY), false);
  });
});

test('official search maps Tavily PAYGO and provider rate limits without pretending evidence exists', { concurrency: false }, async () => {
  for (const [providerStatus, error] of [[433, 'SEARCH_PROVIDER_PAYGO_LIMIT'], [429, 'SEARCH_PROVIDER_RATE_LIMIT']]) {
    await withProviderStatus(providerStatus, async () => {
      const response = await worker.fetch(request('/api/official-search', { query: 'หลักเกณฑ์จัดซื้อจัดจ้าง', count: 3 }), env);
      const body = await response.json();
      assert.equal(response.status, 503);
      assert.equal(body.error, error);
      assert.equal(body.providerStatus, providerStatus);
      assert.equal('results' in body, false);
    });
  }
});

test('official document extraction uses the same safe upstream-limit classification', { concurrency: false }, async () => {
  await withProviderStatus(432, async () => {
    const response = await worker.fetch(request('/api/official-document', { url: 'https://www.dla.go.th/example.pdf' }), env);
    const body = await response.json();
    assert.equal(response.status, 503);
    assert.equal(body.error, 'DOCUMENT_EXTRACT_USAGE_LIMIT');
    assert.equal(body.providerStatus, 432);
    assert.equal('rawContent' in body, false);
  });
});
