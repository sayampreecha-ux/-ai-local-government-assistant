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
assert.equal(core.OFFICIAL_SOURCE_REGISTRY.length >= 8, true);
assert.equal(core.matchOfficialSource('https://www.cgd.go.th/example')?.id, 'cgd');
assert.equal(core.matchOfficialSource('https://dla.go.th/example')?.id, 'dla');

const scenarios = [
  ['ระเบียบค่าเดินทางล่าสุด', 'GP005'],
  ['หนังสือเวียนกรมบัญชีกลางล่าสุด', 'GP005'],
  ['ระเบียบ หนังสือสั่งการ สถ. ล่าสุด', 'GP002'],
  ['TOR พัสดุ การจัดซื้อจัดจ้าง', 'GP003'],
  ['คำพิพากษาศาลปกครองล่าสุด', 'GP002']
];

for (const [query, module] of scenarios) {
  const plan = core.createOfficialSearchPlan(query, { module });
  assert.equal(plan.userAiOnly, true, query);
  assert.equal(plan.liveSearchRequired, false, query);
  assert.equal(plan.execution, 'user-selected-ai', query);
  assert.equal(Array.isArray(plan.sources), true, query);
  assert.equal(plan.sources.includes('cgd.go.th'), true, query);
  assert.equal(plan.sources.includes('dla.go.th'), true, query);
}

assert.equal(core.requiresFreshnessVerification('ระเบียบล่าสุด'), true);
assert.equal(core.requiresFreshnessVerification('ระเบียบเดิม'), false);

const connector = core.createOfficialSearchConnector();
const result = await connector.search('หนังสือเวียนกรมบัญชีกลางล่าสุด', { module: 'GP005' });
assert.equal(result.mode, 'plan-only');
assert.equal(result.results.length, 0);
assert.equal(result.errorCode, 'USER_AI_SEARCH_ONLY');
assert.equal(result.plan.userAiOnly, true);
assert.equal(result.plan.liveSearchRequired, false);
assert.equal(result.evidence.conclusionEligible, false);
assert.match(result.warning, /ไม่ค้นเว็บสดเอง/);

const sources = core.rankOfficialSources('TOR พัสดุ การจัดซื้อจัดจ้าง');
assert.equal(sources[0].tier, 'primary');
assert.equal(sources.some(source => source.id === 'cgd'), true);

const classified = core.classifySource({ sourceUrl: 'https://www.cgd.go.th/example' });
assert.equal(classified.sourceLevel, 'primary');
assert.equal(classified.official, true);

console.log('GovPrompt Official Search verification passed for user-selected-AI search policy.');
