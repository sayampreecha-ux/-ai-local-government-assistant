import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const cases = JSON.parse(await readFile('tests/fixtures/govprompt-real-world-100.json', 'utf8'));
const { routeRequest } = sandbox.window.GovPromptCore;

let pass = 0;
const failures = [];
const byExpected = new Map();

for (const testCase of cases) {
  const routed = routeRequest(testCase.query, { multiModule: false });
  const actual = routed.primaryModule;
  const ok = actual === testCase.expected;
  if (ok) pass += 1;
  else failures.push({ ...testCase, actual, confidence: routed.confidence });

  const bucket = byExpected.get(testCase.expected) ?? { total: 0, pass: 0 };
  bucket.total += 1;
  if (ok) bucket.pass += 1;
  byExpected.set(testCase.expected, bucket);
}

console.log(`GovPrompt Real-World 100: ${pass}/${cases.length} passed (${(pass / cases.length * 100).toFixed(1)}%)`);
for (const [moduleId, bucket] of [...byExpected.entries()].sort()) {
  console.log(`${moduleId}: ${bucket.pass}/${bucket.total}`);
}
if (failures.length) {
  console.log('\nFailures:');
  for (const item of failures) {
    console.log(`#${item.id} expected=${item.expected} actual=${item.actual} confidence=${Number(item.confidence).toFixed(3)} :: ${item.query}`);
  }
}

assert.equal(cases.length, 100, 'fixture must contain exactly 100 cases');
assert.equal(failures.length, 0, `${failures.length} of 100 real-world routing cases failed`);
console.log('GovPrompt real-world 100 routing verification passed.');
