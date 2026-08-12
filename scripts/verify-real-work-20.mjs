import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const fixture = JSON.parse(
  await readFile('tests/fixtures/govprompt-real-work-20.json', 'utf8'),
);

const sandbox = { window: {}, location: { pathname: '/gp001.html' } };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox, { filename: file });
}

const { routeRequest } = sandbox.window.GovPromptCore;
if (typeof routeRequest !== 'function') {
  throw new Error('GovPromptCore.routeRequest is unavailable');
}

const results = [];
let failed = 0;
let passed = 0;
let review = 0;

for (const testCase of fixture.cases) {
  const routed = routeRequest(testCase.query, { multiModule: false });
  const actual = routed.primaryModule;
  let status = 'REVIEW';
  let expected = 'contextual';

  if (testCase.expectedPrimaryModule) {
    expected = testCase.expectedPrimaryModule;
    status = actual === expected ? 'PASS' : 'FAIL';
  } else if (Array.isArray(testCase.acceptablePrimaryModules)) {
    expected = testCase.acceptablePrimaryModules.join('|');
    status = testCase.acceptablePrimaryModules.includes(actual) ? 'PASS' : 'FAIL';
  }

  if (status === 'PASS') passed += 1;
  else if (status === 'FAIL') failed += 1;
  else review += 1;

  results.push({
    id: testCase.id,
    status,
    expected,
    actual,
    confidence: Number(routed.confidence ?? 0).toFixed(3),
    requiresDocument: Boolean(testCase.requiresDocument),
    query: testCase.query,
  });
}

console.table(results);
console.log(`GovPrompt Real Work 20: PASS=${passed} FAIL=${failed} REVIEW=${review} TOTAL=${results.length}`);
console.log('REVIEW means the query is intentionally domain-context dependent and must be evaluated with a representative document/context.');
console.log(`Acceptance scoring remains ${fixture.scoring.pointsPerCase} points/case, recommended overall score >= ${fixture.scoring.recommendedPassScore}/100.`);

if (failed > 0) process.exitCode = 1;
