import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import worker from '../src/search-worker.js';

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

test('frontend official-search connector is fail-closed and prepares a user-selected-AI plan', async () => {
  const core = await loadCore();
  const query = 'รถเสียเบิกค่าซ่อมได้ไหม';
  const plan = core.createOfficialSearchPlan(query, { module: 'GP005' });
  assert.equal(plan.userAiOnly, true);
  assert.equal(plan.liveSearchRequired, false);
  assert.equal(plan.execution, 'user-selected-ai');
  assert.equal(plan.sources.includes('cgd.go.th'), true);

  const result = await core.createOfficialSearchConnector().search(query, { module: 'GP005' });
  assert.equal(result.mode, 'plan-only');
  assert.equal(result.results.length, 0);
  assert.equal(result.evidence.conclusionEligible, false);
  assert.equal(result.errorCode, 'USER_AI_SEARCH_ONLY');
  assert.match(result.warning, /ไม่ค้นเว็บสดเอง/);
});

test('official source classification and registry remain available without live search', async () => {
  const core = await loadCore();
  assert.equal(core.matchOfficialSource('https://www.cgd.go.th/doc')?.id, 'cgd');
  assert.equal(core.matchOfficialSource('https://dla.go.th/doc')?.id, 'dla');
  assert.equal(core.classifySource({ sourceURL: 'https://www.cgd.go.th/doc' }).sourceLevel, 'primary');
  assert.equal(core.classifySource({ sourceURL: 'https://example.com/doc' }).sourceLevel, 'secondary');
  assert.equal(core.requiresFreshnessVerification('ระเบียบล่าสุด'), true);
});

test('official search worker fails closed for direct live-search requests', async () => {
  const response = await worker.fetch(new Request('https://worker.test/api/official-search', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://sayampreecha-ux.github.io' },
    body: JSON.stringify({ query: 'ตรวจ TOR ถนน', sites: ['cgd.go.th'], count: 3 })
  }), { TAVILY_API_KEY: 'test-key' });

  assert.equal(response.status, 410);
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.equal(body.policy, 'user-ai-search-only');
  assert.equal(body.results, undefined);
  assert.match(body.message, /does not perform live searches/i);
  assert.equal(JSON.stringify(body).includes('test-key'), false);
});

test('outcome-first goal detection remains usable before user-AI handoff', async () => {
  const sandbox = { window: {}, URL, Date, Intl, console, globalThis: {} };
  for (const file of [
    'assets/js/core/source-intelligence.js',
    'assets/js/core/freshness-engine.js',
    'assets/js/core/official-source-registry.js',
    'assets/js/core/citation-engine.js',
    'assets/js/core/official-search-connector.js',
    'assets/js/core/outcome-first-search-policy.js'
  ]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  const core = sandbox.window.GovPromptCore;
  const query = 'ปลัดต้นกี่ปีถึงจะเป็นปลัดกลางได้';
  const plan = core.createOfficialSearchPlan(query, { module: 'GP006' });
  assert.equal(plan.routedModulesAdvisory, true);
  assert.equal(plan.policy.outcomeFirst, true);
  assert.equal(plan.policy.answerFitGate, true);
  assert.ok(plan.userGoals.includes('career-progression'));
  assert.ok(plan.userGoals.includes('duration-deadline'));
  assert.match(plan.outcomeQuery, /มาตรฐานกำหนดตำแหน่ง/);
  assert.match(plan.outcomeQuery, /ระยะเวลาดำรงตำแหน่ง/);
  const planned = await core.officialSearchConnector.search(query, { module: 'GP006' });
  assert.equal(planned.mode, 'plan-only');
  assert.equal(planned.evidence.conclusionEligible, false);
});

console.log('Official search integration tests aligned with user-selected AI search policy.');
