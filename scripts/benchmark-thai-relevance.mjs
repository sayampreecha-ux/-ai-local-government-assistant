import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { THAI_OFFICIAL_SEARCH_CASES } from '../test/fixtures/thai-official-search-cases.js';

async function loadCore() {
  const sandbox = { window: {}, URL, Date, Intl, console, globalThis: {} };
  for (const file of [
    'assets/js/core/source-intelligence.js',
    'assets/js/core/freshness-engine.js',
    'assets/js/core/official-source-registry.js',
    'assets/js/core/citation-engine.js',
    'assets/js/core/official-search-connector.js',
    'assets/js/core/outcome-first-search-policy.js'
  ]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  return sandbox.window.GovPromptCore;
}

export async function runThaiRelevanceBenchmark() {
  const core = await loadCore();
  const categories = {};
  const failures = [];
  const caseResults = [];
  let passed = 0;

  for (const item of THAI_OFFICIAL_SEARCH_CASES) {
    const plan = core.createOfficialSearchPlan(item.query, { module: item.expectedModule || 'GP002' });
    const policyOk = plan.userAiOnly === true && plan.liveSearchRequired === false && plan.execution === 'user-selected-ai';
    const officialSourceOk = plan.sources.some(host => host === item.host || host.endsWith(`.${item.host}`));
    const afterEligible = policyOk && officialSourceOk;
    if (afterEligible) passed += 1;
    else failures.push({ id: item.id, category: item.category, query: item.query });

    caseResults.push(Object.freeze({
      id: item.id,
      category: item.category,
      query: item.query,
      afterEligible,
      officialSourceIncluded: officialSourceOk,
      userAiOnly: plan.userAiOnly,
      liveSearchRequired: plan.liveSearchRequired
    }));

    const bucket = categories[item.category] ||= { total: 0, passed: 0 };
    bucket.total += 1;
    bucket.passed += Number(afterEligible);
  }

  const vehicleRepair = core.createOfficialSearchPlan('รถเสียเบิกค่าซ่อมได้ไหม', { module: 'GP005' });
  assert.equal(vehicleRepair.userAiOnly, true);
  assert.equal(vehicleRepair.liveSearchRequired, false);
  assert.equal(vehicleRepair.sources.includes('cgd.go.th'), true);

  return {
    total: THAI_OFFICIAL_SEARCH_CASES.length,
    before: { passed: 0, failed: THAI_OFFICIAL_SEARCH_CASES.length },
    after: { passed, failed: THAI_OFFICIAL_SEARCH_CASES.length - passed },
    categories,
    vehicleRepairPrimaryResults: 0,
    failures,
    caseResults
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runThaiRelevanceBenchmark();
  assert.equal(report.total >= 100, true);
  assert.equal(report.after.failed, 0, JSON.stringify(report.failures));
  console.log(JSON.stringify({ ...report, caseResults: undefined }, null, 2));
}
