import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadCore() {
  const sandbox = { window: {}, URL, Date, Intl, console, globalThis: {} };
  for (const file of [
    'assets/js/core/source-intelligence.js',
    'assets/js/core/freshness-engine.js',
    'assets/js/core/official-source-registry.js',
    'assets/js/core/citation-engine.js',
    'assets/js/core/official-search-connector.js'
  ]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  return sandbox.window.GovPromptCore;
}

const cases = [
  ['เบิกค่าเดินทางไปราชการได้อะไรบ้าง', 'GP005', 'cgd.go.th'],
  ['เบิกค่าเครื่องบินได้ไหม', 'GP005', 'cgd.go.th'],
  ['รถเสียระหว่างไปราชการทำอย่างไร', 'GP005', 'cgd.go.th'],
  ['ตรวจ TOR ถนน', 'GP003', 'cgd.go.th'],
  ['ซื้อคอมใช้วิธีไหน', 'GP003', 'cgd.go.th'],
  ['เงินบำรุงซื้อวัสดุได้ไหม', 'GP008', 'dla.go.th'],
  ['ขาดราชการ 16 วันทำไง', 'GP006', 'dla.go.th'],
  ['โอนงบทำอย่างไร', 'GP004', 'dla.go.th'],
  ['ตรวจการเบิกเงิน', 'GP010', 'audit.go.th'],
  ['โพสต์ข่าวประชาสัมพันธ์', 'GP012', 'dla.go.th']
];

test('search ranking v2 benchmark validates deterministic official-source routing without live-search execution', async () => {
  const core = await loadCore();
  for (const [query, module, expectedHost] of cases) {
    const plan = core.createOfficialSearchPlan(query, { module });
    assert.equal(plan.userAiOnly, true, query);
    assert.equal(plan.liveSearchRequired, false, query);
    assert.equal(plan.execution, 'user-selected-ai', query);
    assert.equal(plan.routedModules.includes(module), true, query);
    assert.equal(plan.sources.includes(expectedHost), true, `${query}: expected official source not in handoff plan`);
  }
});

test('connector remains fail-closed when no user-selected AI execution is attached', async () => {
  const core = await loadCore();
  const result = await core.createOfficialSearchConnector().search('ตรวจ TOR ถนน', { module: 'GP003' });
  assert.equal(result.mode, 'plan-only');
  assert.equal(result.results.length, 0);
  assert.equal(result.evidence.conclusionEligible, false);
  assert.equal(result.errorCode, 'USER_AI_SEARCH_ONLY');
});
