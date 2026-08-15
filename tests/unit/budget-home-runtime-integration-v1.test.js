import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const HOME = 'assets/js/home-v3.js';

test('home runtime passes governed evidence back into Workflow Runtime v5', async () => {
  const source = await readFile(HOME, 'utf8');
  assert.match(source, /async function prepareWorkflowRuntime\(text, evidence = \[\]\)/);
  assert.match(source, /buildWorkflowRuntimeView\(\{[\s\S]*evidence: Array\.isArray\(evidence\)/);
});

test('home invokes budget official source runtime only after budget workflow detection', async () => {
  const source = await readFile(HOME, 'utf8');
  const helper = source.indexOf('async function prepareBudgetOfficialRuntime');
  const budgetGate = source.indexOf("includes('gov.budget-draft')", helper);
  const budgetImport = source.indexOf("import('./core/budget-official-source-runtime-v1.js?v=1.2.0')", helper);
  const sourceExecution = source.indexOf('executeBudgetOfficialSourceSearch', budgetImport);
  const refresh = source.indexOf('prepareWorkflowRuntime(privacy.safeText, budgetSourceRuntime.evidence)', sourceExecution);
  assert.ok(helper >= 0);
  assert.ok(budgetGate > helper);
  assert.ok(budgetImport > budgetGate);
  assert.ok(sourceExecution > budgetImport);
  assert.ok(refresh > sourceExecution);
});

test('budget official source runtime receives privacy-sanitized query text rather than raw text', async () => {
  const source = await readFile(HOME, 'utf8');
  const helper = source.indexOf('async function prepareBudgetOfficialRuntime');
  const privacyCall = source.indexOf('prepareExternalPrompt(text)', helper);
  const queryUse = source.indexOf('query: privacy.safeText', helper);
  assert.ok(privacyCall > helper);
  assert.ok(queryUse > privacyCall);
});
