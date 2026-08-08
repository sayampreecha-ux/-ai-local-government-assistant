import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import worker from '../src/search-worker.js';

async function loadConnector(fetcher) {
  const sandbox = { window: {}, URL, Date, Intl, console, fetch: fetcher, globalThis: {} };
  for (const file of [
    'assets/js/core/source-intelligence.js',
    'assets/js/core/freshness-engine.js',
    'assets/js/core/official-source-registry.js',
    'assets/js/core/citation-engine.js',
    'assets/js/core/official-search-connector.js'
  ]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  return sandbox.window.GovPromptCore;
}

const acceptanceCases = [
  ['รถเสียเบิกค่าซ่อมได้ไหม', 'ค่าใช้จ่ายซ่อมรถราชการและการเบิกจ่าย'],
  ['เบิกค่าเครื่องบิน', 'หลักเกณฑ์เบิกค่าโดยสารเครื่องบินเดินทางไปราชการ'],
  ['เงินบำรุงซื้อของได้ไหม', 'เงินบำรุงสำหรับจัดซื้อวัสดุของหน่วยบริการ'],
  ['ตรวจ TOR ถนน', 'แนวทางตรวจ TOR งานก่อสร้างถนน']
];

test('frontend connector retains official evidence for unspaced Thai acceptance queries', async () => {
  const fetcher = async (_url, request) => {
    const { originalQuery } = JSON.parse(request.body);
    const snippet = acceptanceCases.find(([query]) => query === originalQuery)?.[1];
    return Response.json({
      ok: true,
      provider: 'tavily',
      searchedAt: '2026-08-09T00:00:00.000Z',
      results: [{
        title: snippet,
        url: `https://www.cgd.go.th/example/${encodeURIComponent(originalQuery)}`,
        snippet,
        sourceTier: 'primary'
      }]
    });
  };
  const core = await loadConnector(fetcher);

  for (const [query] of acceptanceCases) {
    const terms = [...core.officialSearchQueryTerms(query)];
    assert.ok(terms.length > 1, `${query}: Thai query was not segmented`);
    const result = await core.createOfficialSearchConnector({ fetcher }).search(query);
    assert.equal(result.mode, 'live', query);
    assert.equal(result.results.length, 1, query);
    assert.equal(result.evidence.primaryResults.length, 1, `${query}: official hit was hidden by relevance mapping`);
  }
});

test('connector accepts both direct and wrapped provider result envelopes', async () => {
  const core = await loadConnector(async () => Response.json({
    ok: true,
    provider: 'tavily',
    data: { results: [{ title: 'ตรวจ TOR ถนน', url: 'https://cgd.go.th/tor', snippet: 'ตรวจ TOR ถนน' }] }
  }));
  const result = await core.createOfficialSearchConnector({ fetcher: async () => Response.json({
    ok: true,
    provider: 'tavily',
    data: { results: [{ title: 'ตรวจ TOR ถนน', url: 'https://cgd.go.th/tor', snippet: 'ตรวจ TOR ถนน' }] }
  }) }).search('ตรวจ TOR ถนน');
  assert.equal(result.results.length, 1);
});

test('worker POST, CORS, request validation and Tavily mapping contract', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, 'POST');
    assert.equal(options.headers.authorization, 'Bearer test-key');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.include_domains, ['cgd.go.th']);
    return Response.json({ results: [{ title: 'TOR', url: 'https://www.cgd.go.th/tor', content: 'ถนน' }] });
  };
  try {
    const preflight = await worker.fetch(new Request('https://worker.test/api/official-search', {
      method: 'OPTIONS', headers: { origin: 'https://sayampreecha-ux.github.io' }
    }), {});
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'https://sayampreecha-ux.github.io');
    assert.equal(preflight.headers.get('access-control-allow-methods'), 'POST, OPTIONS');
    assert.equal(preflight.headers.get('access-control-allow-headers'), 'content-type');

    const response = await worker.fetch(new Request('https://worker.test/api/official-search', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: 'ตรวจ TOR ถนน', sites: ['cgd.go.th', 'example.com'], count: 5 })
    }), { TAVILY_API_KEY: 'test-key' });
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.results.length, 1);
    assert.equal(body.results[0].url, 'https://www.cgd.go.th/tor');
    assert.equal(typeof body.requestId, 'string');
    assert.equal(JSON.stringify(body).includes('test-key'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
