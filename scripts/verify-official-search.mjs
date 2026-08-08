import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL, Date, console, globalThis: {} };
for (const file of [
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const core = sandbox.window.GovPromptCore;
const warning = 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง';
assert.equal(core.OFFICIAL_SOURCE_REGISTRY.length >= 8, true);
assert.equal(core.matchOfficialSource('https://www.cgd.go.th/example')?.id, 'cgd');
assert.equal(core.matchOfficialSource('https://dla.go.th/example')?.id, 'dla');

const scenarios = [
  ['ระเบียบค่าเดินทางล่าสุด', ['krisdika.go.th', 'moi.go.th']],
  ['หนังสือเวียนกรมบัญชีกลางล่าสุด', ['cgd.go.th']],
  ['ระเบียบ หนังสือสั่งการ สถ. ล่าสุด', ['dla.go.th']],
  ['TOR พัสดุ การจัดซื้อจัดจ้าง', ['cgd.go.th']],
  ['คำพิพากษาศาลปกครองล่าสุด', ['admincourt.go.th']]
];

for (const [query, expectedHosts] of scenarios) {
  const plan = core.createOfficialSearchPlan(query, { limitSources: 6 });
  assert.equal(plan.policy.primaryFirst, true, query);
  assert.equal(plan.policy.verifyCurrentStatus, true, query);
  assert.equal(plan.policy.rejectUnsupportedSecondaryOnlyConclusion, true, query);
  assert.equal(expectedHosts.some(host => plan.plans.some(item => item.host === host)), true, `${query}: expected official source not prioritized`);
}

const ranked = core.rankOfficialSearchResults([
  { title: 'บทความสรุปใหม่กว่า', sourceUrl: 'https://example.com/a', documentDate: '2026-08-08' },
  { title: 'หนังสือราชการ', sourceUrl: 'https://www.cgd.go.th/a', documentDate: '2026-08-07' }
]);
assert.equal(ranked[0].official, true);
assert.equal(ranked[0].sourceId, 'cgd');
assert.equal(ranked[1].official, false);

const liveFetcher = async (_endpoint, request) => {
  const body = JSON.parse(request.body);
  assert.equal(body.query, 'หนังสือเวียนกรมบัญชีกลางล่าสุด');
  assert.equal(body.sites.includes('cgd.go.th'), true);
  return new Response(JSON.stringify({
    ok: true,
    provider: 'brave',
    searchedAt: '2026-08-08T07:00:00.000Z',
    results: [{
      title: 'หนังสือเวียนจากกรมบัญชีกลาง',
      url: 'https://www.cgd.go.th/example/current',
      snippet: 'ผลค้นจากต้นฉบับราชการ'
    }]
  }), { status: 200, headers: { 'content-type': 'application/json' } });
};

const liveConnector = core.createOfficialSearchConnector({ fetcher: liveFetcher });
const live = await liveConnector.search('หนังสือเวียนกรมบัญชีกลางล่าสุด', { limitSources: 6 });
assert.equal(live.mode, 'live');
assert.equal(live.provider, 'brave');
assert.equal(live.results.length, 1);
assert.equal(live.evidence.primaryResults.length, 1);
assert.equal(live.evidence.secondaryResults.length, 0);
assert.equal(live.evidence.citations.length, 1);
assert.equal(live.evidence.citations[0].sourceVerified, true);
assert.equal(live.evidence.conclusionEligible, false);
assert.equal(live.warning, warning);

const configuredButUnavailable = core.createOfficialSearchConnector({
  fetcher: async () => new Response(JSON.stringify({ error: 'SEARCH_PROVIDER_NOT_CONFIGURED' }), {
    status: 503,
    headers: { 'content-type': 'application/json' }
  })
});
const unavailable = await configuredButUnavailable.search('ระเบียบค่าเดินทางล่าสุด', { limitSources: 3 });
assert.equal(unavailable.mode, 'plan-only');
assert.equal(unavailable.results.length, 0);
assert.equal(unavailable.errorCode, 'SEARCH_PROVIDER_NOT_CONFIGURED');
assert.equal(unavailable.evidence.conclusionEligible, false);

console.log('GovPrompt v7 Official Search Connector verification passed for Sprint 2.3 activation.');
