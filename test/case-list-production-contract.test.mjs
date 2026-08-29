import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bootstrap = await readFile('assets/js/ui/case-list-bootstrap-v1.js', 'utf8');
const caseList = await readFile('assets/js/ui/case-list-ui-v1.js', 'utf8');
const runtime = await readFile('assets/js/core/government-workflow-runtime-v5.js', 'utf8');
const build = await readFile('scripts/build-static.mjs', 'utf8');
const gp008Proof = await readFile('scripts/verify-gp008-production.mjs', 'utf8');

test('home case list bootstrap initializes the resumable workflow UI', () => {
  assert.match(bootstrap, /initializeCaseListUI/);
  assert.match(caseList, /gp-case-button/);
  assert.match(caseList, /govprompt:case-memory-updated/);
  assert.match(caseList, /ไม่เก็บ Prompt\/หลักฐานดิบ/);
});

test('Pages build ships every browser dependency required by case memory and citizen service', () => {
  assert.match(build, /case-list-bootstrap-v1\.js/);
  assert.match(build, /government-case-memory-v1\.js/);
  assert.match(build, /citizen-service-workflow\.js/);
  assert.match(runtime, /government-case-memory-v1\.js/);
  assert.match(runtime, /citizen-service-workflow\.js/);
});

test('GP008 production proof follows the released toolkit cache version', () => {
  assert.equal(gp008Proof.includes('public-health-worker-toolkit-v1\\.js\\?v=1\\.0\\.2'), true);
});
