import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL, console, globalThis: {} };
for (const file of [
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/official-search-connector.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const core = sandbox.window.GovPromptCore;
assert.equal(core.OFFICIAL_SOURCE_REGISTRY.length >= 8, true);
assert.equal(core.matchOfficialSource('https://www.cgd.go.th/example')?.id, 'cgd');
assert.equal(core.matchOfficialSource('https://dla.go.th/example')?.id, 'dla');

const plan = core.createOfficialSearchPlan('พัสดุ หนังสือเวียนล่าสุด', { limitSources: 4 });
assert.equal(plan.plans.length, 4);
assert.equal(plan.plans.some(item => item.host === 'cgd.go.th'), true);
assert.equal(plan.policy.primaryFirst, true);
assert.equal(plan.policy.verifyCurrentStatus, true);

const ranked = core.rankOfficialSearchResults([
  { title: 'บทความสรุป', sourceUrl: 'https://example.com/a', documentDate: '2026-08-08' },
  { title: 'หนังสือราชการ', sourceUrl: 'https://www.cgd.go.th/a', documentDate: '2026-08-07' }
]);
assert.equal(ranked[0].official, true);
assert.equal(ranked[0].sourceId, 'cgd');

const connector = core.createOfficialSearchConnector();
const result = await connector.search('ระเบียบค่าเดินทางล่าสุด', { limitSources: 3 });
assert.equal(result.mode, 'plan-only');
assert.equal(result.results.length, 0);
assert.equal(result.warning.includes('ยังไม่ได้เชื่อมบริการค้นเว็บราชการสด'), true);

console.log('GovPrompt v7 Official Search Connector verification passed.');
