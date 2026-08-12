import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { scenarios, scenarioSummary } from '../tests/fixtures/govprompt-simulated-work-200.mjs';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
  'assets/js/core/hybrid-real-world-overrides.js',
  'assets/js/core/output-router.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const { routeRequest, routeOutput } = sandbox.window.GovPromptCore;
assert.equal(typeof routeRequest, 'function', 'routeRequest must be exposed');
assert.equal(typeof routeOutput, 'function', 'routeOutput must be exposed');
assert.equal(scenarios.length, 200, 'must contain exactly 200 scenarios');

let routePass = 0;
let outputPass = 0;
let outputChecked = 0;
const failures = [];

for (const scenario of scenarios) {
  assert.match(scenario.id, /^SIM\d{3}$/);
  assert.ok(scenario.department && scenario.userRole && scenario.userRequest && scenario.context);
  assert.ok(Array.isArray(scenario.missingInformation) && scenario.missingInformation.length >= 1);
  assert.ok(Array.isArray(scenario.expectedModules) && scenario.expectedModules.length >= 1);
  assert.ok(Array.isArray(scenario.expectedBehavior) && scenario.expectedBehavior.length >= 3);
  assert.ok(Array.isArray(scenario.acceptanceCriteria) && scenario.acceptanceCriteria.length >= 5);
  assert.ok(['low', 'medium', 'high'].includes(scenario.riskLevel));

  const routed = routeRequest(scenario.userRequest, { multiModule: false });
  const actualModule = routed.primaryModule;
  const routeOk = scenario.expectedModules.includes(actualModule);
  if (routeOk) routePass += 1;

  let outputOk = true;
  let actualOutput = null;
  if (scenario.expectedOutput) {
    outputChecked += 1;
    actualOutput = routeOutput(scenario.userRequest, { moduleId: actualModule }).id;
    outputOk = actualOutput === scenario.expectedOutput;
    if (outputOk) outputPass += 1;
  }

  if (!routeOk || !outputOk) {
    failures.push({
      id: scenario.id,
      query: scenario.userRequest,
      expectedModules: scenario.expectedModules,
      actualModule,
      expectedOutput: scenario.expectedOutput,
      actualOutput,
      confidence: routed.confidence
    });
  }
}

console.log(`GovPrompt Simulated Work 200: routing ${routePass}/200; output ${outputPass}/${outputChecked}; failures ${failures.length}`);
for (const [moduleId, count] of Object.entries(scenarioSummary).sort()) console.log(`  ${moduleId}: ${count} scenarios`);
if (failures.length) {
  console.log('\nFailures:');
  for (const item of failures) {
    console.log(`${item.id} route expected=${item.expectedModules.join('|')} actual=${item.actualModule} output expected=${item.expectedOutput || '-'} actual=${item.actualOutput || '-'} :: ${item.query}`);
  }
}

assert.equal(routePass, 200, `${200 - routePass} of 200 simulated routing cases failed`);
assert.equal(outputPass, outputChecked, `${outputChecked - outputPass} simulated output-routing cases failed`);
assert.equal(failures.length, 0, `${failures.length} simulated work scenarios failed`);
console.log('GovPrompt simulated 200 work scenarios verification passed.');
