import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const HOME = 'assets/js/home-v3.js';

test('home runtime passes governed evidence back into Workflow Runtime v5', async () => {
  const source = await readFile(HOME,'utf8');
  assert.match(source,/async function prepareWorkflowRuntime\(text, evidence = \[\]\)/);
  assert.match(source,/buildWorkflowRuntimeView\(\{[\s\S]*evidence: Array\.isArray\(evidence\)/);
});

test('home invokes budget runtime only after workflow detection then wires official document reader and local file inputs', async () => {
  const source = await readFile(HOME,'utf8');
  const helper = source.indexOf('async function prepareBudgetOfficialRuntime');
  const budgetGate = source.indexOf("includes('gov.budget-draft')",helper);
  const budgetImport = source.indexOf("import('./core/budget-official-source-runtime-v1.js?v=2.1.0')",helper);
  const readerImport = source.indexOf("budget-official-document-connector-v1.js?v=1.0.0",helper);
  const fileImport = source.indexOf("budget-browser-input-runtime-v1.js?v=1.6.0",helper);
  const localPrepare = source.indexOf('prepareBudgetInternalInputsFromFiles(attachments',helper);
  const sourceExecution = source.indexOf('executeBudgetOfficialSourceSearch',budgetImport);
  const documentUse = source.indexOf('documentConnector,',sourceExecution);
  const internalUse = source.indexOf('internalBudgetInputs: browserInputs.inputs',sourceExecution);
  const refresh = source.indexOf('prepareWorkflowRuntime(privacy.safeText, budgetSourceRuntime.evidence)',sourceExecution);
  assert.ok(helper >= 0 && budgetGate > helper && budgetImport > budgetGate && readerImport > budgetGate && fileImport > budgetGate);
  assert.ok(localPrepare > fileImport && sourceExecution > budgetImport && documentUse > sourceExecution && internalUse > sourceExecution && refresh > sourceExecution);
});

test('budget runtime receives privacy-sanitized query text rather than raw text', async () => {
  const source = await readFile(HOME,'utf8');
  const helper = source.indexOf('async function prepareBudgetOfficialRuntime');
  const privacyCall = source.indexOf('prepareExternalPrompt(text)',helper);
  const queryUse = source.indexOf('query: privacy.safeText',helper);
  assert.ok(privacyCall > helper); assert.ok(queryUse > privacyCall);
});

test('home offers Excel and Word only from ready governed structured budget artifact', async () => {
  const source = await readFile(HOME,'utf8');
  assert.match(source,/artifact\?\.key === 'budget-structured-export' && artifact\?\.status === 'ready'/);
  assert.match(source,/budget-office-export-v1\.js\?v=1\.0\.0/);
  assert.match(source,/ดาวน์โหลด Excel/);
  assert.match(source,/ดาวน์โหลด Word/);
  assert.match(source,/downloadBudgetOfficeFile\(artifact, format\)/);
});
