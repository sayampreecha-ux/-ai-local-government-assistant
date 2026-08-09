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

test('intent-aware expansion separates vehicle maintenance, TOR, travel and health-fund searches', async () => {
  const core = await loadConnector(async () => Response.json({ results: [] }));
  const cases = [
    ['รถส่วนกลางชำรุดต้องซ่อมอย่างไร', 'vehicle-maintenance', ['บำรุงรักษา','หนังสือสั่งการ'], ['เดินทางไปราชการ','TOR']],
    ['ตรวจ TOR เช่ารถต้องดูอะไร', 'procurement-tor', ['จัดซื้อจัดจ้าง','ขอบเขตงาน'], ['เดินทางไปราชการ']],
    ['เบิกค่าเครื่องบินไปราชการได้ไหม', 'official-travel', ['ค่าโดยสาร','เบี้ยเลี้ยง'], ['ซ่อมรถ']],
    ['เงินบำรุง รพ.สต. ซื้อครุภัณฑ์ได้ไหม', 'health-maintenance-fund', ['หน่วยบริการสาธารณสุข','การใช้จ่าย'], ['เดินทางไปราชการ']]
  ];
  for (const [query, profileId, expected, rejected] of cases) {
    const plan = core.createOfficialSearchPlan(query);
    assert.equal(plan.intentProfile?.id, profileId, query);
    for (const term of expected) assert.ok(plan.query.includes(term), `${query}: missing ${term}`);
    for (const term of rejected) assert.equal(plan.query.includes(term), false, `${query}: leaked ${term}`);
  }
  const roadPlan = core.createOfficialSearchPlan('ช่วยตรวจขอบเขตงานก่อสร้างทางลาดยาง');
  assert.equal(roadPlan.intentProfile?.id, 'procurement-tor');
  assert.equal(roadPlan.subjectProfile?.id, 'road-works');
  assert.match(roadPlan.query, /ถนน.*งานทาง.*ผิวทาง/);
});

test('intent-aware ranking rejects cross-intent official documents without weakening primary-source policy', async () => {
  const fixtures = new Map([
    ['รถเสียเบิกค่าซ่อมได้ไหม', [
      ['ระเบียบและหนังสือสั่งการการซ่อมบำรุงรักษารถราชการ', 'หลักเกณฑ์เบิกค่าซ่อมรถส่วนกลางที่ชำรุด', '/vehicle-repair'],
      ['ประเด็นคำถามค่าใช้จ่ายเดินทางไปราชการ', 'เบิกค่าโดยสาร ค่าพาหนะ และเบี้ยเลี้ยงเมื่อรถเสียระหว่างเดินทาง', '/travel'],
      ['TOR เช่ารถราชการ', 'ขอบเขตงานเช่ารถและค่าใช้จ่ายรถ', '/rental-tor']
    ]],
    ['ตรวจ TOR เช่ารถต้องดูอะไร', [
      ['แนวทางตรวจ TOR เช่ารถ', 'หลักเกณฑ์ขอบเขตงานและราคากลางจัดจ้างเช่ารถ', '/tor'],
      ['ระเบียบซ่อมบำรุงรถราชการ', 'ค่าซ่อมรถส่วนกลาง', '/repair']
    ]],
    ['เบิกค่าเครื่องบินไปราชการได้ไหม', [
      ['หลักเกณฑ์ค่าโดยสารเครื่องบิน', 'ระเบียบเบิกค่าเดินทางไปราชการและค่าพาหนะ', '/airfare'],
      ['TOR เช่าเครื่องบิน', 'ขอบเขตงานจัดจ้างและราคากลาง', '/aircraft-tor']
    ]],
    ['เงินบำรุงซื้อของได้ไหม', [
      ['หลักเกณฑ์ใช้เงินบำรุงหน่วยบริการสาธารณสุข', 'เงินบำรุง รพ.สต. ใช้จ่ายจัดซื้อวัสดุได้ตามระเบียบ', '/health-fund'],
      ['เงินบำรุงท้องถิ่นซ่อมรถ', 'ค่าซ่อมรถราชการ', '/local-fund']
    ]]
  ]);
  const fetcher = async (_url, request) => {
    const { originalQuery } = JSON.parse(request.body);
    return Response.json({ provider: 'tavily', results: fixtures.get(originalQuery).map(([title, snippet, path]) => ({
      title, snippet, url: `https://www.cgd.go.th${path}`, sourceTier: 'primary'
    })).concat([{ title: 'บทความสรุปที่เกี่ยวข้อง', snippet: originalQuery, url: 'https://example.com/summary' }]) });
  };
  const core = await loadConnector(fetcher);
  const connector = core.createOfficialSearchConnector({ fetcher });
  for (const [query] of fixtures) {
    const result = await connector.search(query);
    assert.equal(result.results[0].evidenceFeatures.intentCompatibility, true, query);
    assert.ok(result.evidence.primaryResults.length > 0, `${query}: lost relevant primary source`);
    assert.equal(result.evidence.primaryResults.every(hit => hit.official), true, `${query}: admitted non-primary source`);
    assert.equal(result.evidence.primaryResults.some(hit => hit.evidenceFeatures.intentCompatibility === false), false, `${query}: admitted intent drift`);
  }
  const vehicle = await connector.search('รถเสียเบิกค่าซ่อมได้ไหม');
  assert.match(vehicle.evidence.primaryResults[0].title, /ซ่อม|บำรุง/);
  assert.equal(vehicle.evidence.primaryResults.some(hit => /TOR เช่ารถ|เดินทางไปราชการ/.test(hit.title)), false);
});

test('document quality gate rejects navigation pages and subject ranking keeps procurement evidence on topic', async () => {
  const responses = new Map([
    ['เงินบำรุงซื้อวัสดุได้หรือไม่', [
      { title: 'เว็บไซด์อินเตอร์เน็ตกรมบัญชีกลาง', snippet: 'เงินบำรุงหน่วยบริการใช้จ่ายจัดซื้อวัสดุ', url: 'https://www.cgd.go.th/cs/Satellite?list_layout=list&page=1' },
      { title: 'ระเบียบการใช้จ่ายเงินบำรุงของหน่วยบริการ', snippet: 'หลักเกณฑ์เงินบำรุง รพ.สต. สำหรับจัดซื้อวัสดุ', url: 'https://www.dla.go.th/official/health-fund.pdf' }
    ]],
    ['ตรวจขอบเขตงานก่อสร้างถนนคอนกรีต', [
      { title: 'TOR โครงการพัฒนาระบบสารสนเทศ', snippet: 'ขอบเขตงานจัดจ้างซอฟต์แวร์', url: 'https://www.cgd.go.th/tor/software.pdf' },
      { title: 'TOR งานก่อสร้างถนนคอนกรีตเสริมเหล็ก', snippet: 'ขอบเขตงาน ราคากลาง ผิวทางและงานทาง', url: 'https://www.dla.go.th/tor/road.pdf' },
      { title: 'TOR ก่อสร้างอาคารสำนักงาน', snippet: 'ขอบเขตงานอาคารและสิ่งปลูกสร้าง', url: 'https://www.cgd.go.th/tor/building.pdf' }
    ]],
    ['ตรวจ TOR ระบบสารสนเทศ', [
      { title: 'TOR งานก่อสร้างถนนลาดยาง', snippet: 'ขอบเขตงานและราคากลางงานทาง', url: 'https://www.dla.go.th/tor/road-2.pdf' },
      { title: 'TOR จัดหาระบบสารสนเทศ', snippet: 'ขอบเขตงานซอฟต์แวร์ เครือข่าย และดิจิทัล', url: 'https://www.cgd.go.th/tor/it.pdf' }
    ]]
  ]);
  const fetcher = async (_url, request) => Response.json({ provider: 'tavily', results: responses.get(JSON.parse(request.body).originalQuery) });
  const core = await loadConnector(fetcher);
  const connector = core.createOfficialSearchConnector({ fetcher });

  const fund = await connector.search('เงินบำรุงซื้อวัสดุได้หรือไม่');
  assert.equal(fund.evidence.primaryResults.length, 1);
  assert.match(fund.evidence.primaryResults[0].title, /ระเบียบ.*เงินบำรุง/);
  assert.equal(fund.results.find(hit => hit.title.startsWith('เว็บไซด์'))?.evidenceFeatures.navigational, true);

  const road = await connector.search('ตรวจขอบเขตงานก่อสร้างถนนคอนกรีต');
  assert.equal(road.plan.subjectProfile?.id, 'road-works');
  assert.match(road.evidence.primaryResults[0].title, /ถนน/);
  assert.equal(road.evidence.primaryResults.some(hit => /ระบบสารสนเทศ|อาคาร/.test(hit.title)), false);

  const it = await connector.search('ตรวจ TOR ระบบสารสนเทศ');
  assert.equal(it.plan.subjectProfile?.id, 'information-technology');
  assert.match(it.evidence.primaryResults[0].title, /ระบบสารสนเทศ/);
  assert.equal(it.evidence.primaryResults.some(hit => /ถนน/.test(hit.title)), false);
});

test('targeted fallback retries only when strict intent or subject evidence is missing', async () => {
  let calls = 0;
  const fetcher = async (_url, request) => {
    calls += 1;
    const body = JSON.parse(request.body);
    if (calls === 1) return Response.json({ provider: 'tavily', results: [
      { title: 'TOR ก่อสร้างอาคารสำนักงาน', snippet: 'ขอบเขตงานอาคาร', url: 'https://www.cgd.go.th/tor/building-only.pdf' }
    ] });
    assert.match(body.query, /TOR งานก่อสร้างถนน/);
    return Response.json({ provider: 'tavily', results: [
      { title: 'TOR งานก่อสร้างถนนลาดยาง', snippet: 'ขอบเขตงานถนน งานทาง และผิวทาง', url: 'https://www.dla.go.th/tor/road-fallback.pdf' }
    ] });
  };
  const core = await loadConnector(fetcher);
  const result = await core.createOfficialSearchConnector({ fetcher }).search('ช่วยตรวจ TOR ถนนลาดยาง');
  assert.equal(calls, 2);
  assert.equal(result.evidence.primaryResults.length, 1);
  assert.match(result.evidence.primaryResults[0].title, /ถนนลาดยาง/);
  assert.equal(result.evidence.primaryResults.some(hit => /อาคาร/.test(hit.title)), false);
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
    assert.equal(preflight.headers.get('access-control-allow-headers'), 'authorization, content-type');

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
