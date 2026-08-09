import assert from 'node:assert/strict';
import worker from '../src/search-worker.js';

const cases = [
  ['ซื้อคอม', ['cgd.go.th','dla.go.th']],
  ['รถเสียเบิกได้ไหม', ['cgd.go.th','dla.go.th']],
  ['ขาดงาน 16 วันทำไง', ['dla.go.th','ocsc.go.th']],
  ['เงินบำรุงซื้อของได้ไหม', ['dla.go.th','moph.go.th']],
  ['ตรวจ TOR ถนน', ['cgd.go.th','dla.go.th']],
  ['เบิกค่าเครื่องบิน', ['cgd.go.th','dla.go.th']],
  ['ญัตติงบ', ['dla.go.th']],
  ['โอนงบทำยังไง', ['dla.go.th']],
  ['จัดซื้ออาหารโรงเรียน', ['cgd.go.th','dla.go.th']],
  ['ร่างคำสั่งแต่งตั้ง', ['dla.go.th','ocsc.go.th']]
];

const originalFetch = globalThis.fetch;
let providerBodies = [];
globalThis.fetch = async (_url, options) => {
  const body = JSON.parse(options.body);
  providerBodies.push(body);
  const domain = body.include_domains?.[0] || 'dla.go.th';
  return new Response(JSON.stringify({ results: [
    { title:`เอกสารราชการ ${body.query}`, url:`https://www.${domain}/doc/current`, content:`ข้อมูลต้นฉบับราชการเกี่ยวกับ ${body.query}`, published_date:'2026-08-08T00:00:00Z' },
    { title:'เว็บภายนอก', url:'https://example.com/noise', content:'noise' }
  ]}), { status:200, headers:{'content-type':'application/json'} });
};

try {
  for (const [query, sites] of cases) {
    const response = await worker.fetch(new Request('https://example.test/api/official-search', {
      method:'POST', headers:{'content-type':'application/json', origin:'https://sayampreecha-ux.github.io'},
      body:JSON.stringify({ query, originalQuery:query, sites, count:3 })
    }), { TAVILY_API_KEY:'benchmark-secret' });
    assert.equal(response.status, 200, query);
    const body = await response.json();
    assert.equal(body.results.length >= 1, true, `${query}: no official result`);
    assert.equal(body.results.every(r => r.official === true || r.sourceTier === 'primary'), true, `${query}: non-official result leaked`);
    assert.equal(body.results.every(r => sites.some(site => r.host === site || r.host.endsWith(`.${site}`))), true, `${query}: result outside requested official domains`);
    assert.equal(body.results[0].documentDate, '2026-08-08', `${query}: freshness metadata missing`);
  }
  assert.equal(providerBodies.length, cases.length);
  assert.equal(providerBodies.every(b => Array.isArray(b.include_domains) && b.include_domains.length >= 1), true);
} finally {
  globalThis.fetch = originalFetch;
}

console.log(`Live Search Reality benchmark passed: ${cases.length}/${cases.length} official-domain, freshness, and provider-contract cases.`);
