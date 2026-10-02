import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { WORKFLOW_RUNTIME_BRIDGE_VERSION, buildWorkflowRuntimeView, buildWorkflowPromptBlock } from '../../assets/js/core/government-workflow-runtime-v5.js';

test('runtime bridge exposes a sanitized V4 work order for a government task', () => {
  const view = buildWorkflowRuntimeView({ query:'จัดซื้อรถขุด e-bidding' });
  assert.equal(view.bridgeVersion,WORKFLOW_RUNTIME_BRIDGE_VERSION); assert.ok(view.workflowIds.includes('gov.procurement')); assert.ok(view.primary);
  assert.equal(view.primary.workflowId,'gov.procurement'); assert.equal(view.primary.action,'acquire-evidence'); assert.ok(view.primary.missingEvidence.includes('missionAuthority'));
  assert.equal(view.governance.autoApprovalAllowed,false); assert.equal(view.governance.rawEvidenceValuesReturned,false);
});

test('runtime bridge never returns raw evidence or artifact values', () => {
  const view = buildWorkflowRuntimeView({ query:'จัดซื้อรถขุด e-bidding', evidence:[{key:'missionAuthority',value:'SECRET_AUTHORITY_VALUE',official:true,verified:true},{key:'needJustification',value:'SECRET_NEED_VALUE'}], artifacts:[{key:'need-memo',workflowId:'gov.procurement',stageId:'need-and-authority',content:{body:'SECRET_ARTIFACT_BODY'}}] });
  assert.doesNotMatch(JSON.stringify(view),/SECRET_AUTHORITY_VALUE|SECRET_NEED_VALUE|SECRET_ARTIFACT_BODY/);
});

test('workflow prompt block encodes gates without chain-of-thought requests', () => {
  const block = buildWorkflowPromptBlock(buildWorkflowRuntimeView({query:'จัดซื้อรถขุด e-bidding'}));
  assert.match(block,/GovPrompt Workflow Execution Contract v5/); assert.match(block,/หลักฐานที่ยังขาด/); assert.match(block,/ห้ามสมมติ/); assert.match(block,/ชิ้นงาน final/); assert.match(block,/ห้ามเปิดเผย chain-of-thought/);
});

test('unclassified text degrades safely without inventing a workflow', () => {
  const view = buildWorkflowRuntimeView({query:'สวัสดีครับ'}); assert.deepEqual(view.workflowIds,[]); assert.equal(view.primary,null); assert.equal(buildWorkflowPromptBlock(view),'');
});

test('home runtime integration sanitizes before workflow import and has cache-busted production asset', async () => {
  const [source,index] = await Promise.all([readFile('assets/js/home-v3.js','utf8'),readFile('index.html','utf8')]);
  const functionStart = source.indexOf('async function prepareWorkflowRuntime(');
  const privacyCall = source.indexOf('prepareExternalPrompt(text)',functionStart);
  const runtimeImport = source.indexOf("import('./core/government-workflow-runtime-v5.js?v=",functionStart);
  assert.ok(functionStart >= 0); assert.ok(privacyCall > functionStart); assert.ok(runtimeImport > privacyCall);
  assert.match(source,/status: 'privacy-blocked'/); assert.match(source,/status: 'runtime-unavailable'/); assert.match(source,/enrichPromptWithWorkflow/);
  assert.match(index,/assets\/js\/home-v3\.js\?v=\d+\.\d+\.\d+/);
  assert.match(index,/official-source-registry\.js\?v=\d+\.\d+\.\d+/);
  assert.match(index,/service-worker\.js\?v=\d+\.\d+\.\d+/);
});

test('production build copies exact browser-safe workflow runtime dependency chain into dist/src', async () => {
  const source = await readFile('scripts/build-static.mjs','utf8');
  for (const file of [
    'budget-balance-validator.js','budget-official-evidence-adapter.js','budget-official-document-parser.js','budget-document-content-ingestion.js',
    'budget-internal-evidence-ingestion.js','budget-browser-file-ingestion.js','budget-browser-file-parser.js','budget-working-draft-planner.js',
    'budget-file-parser-review.js','budget-tabular-parser.js','budget-artifact-factory.js','government-workflow-engine.js','government-workflow-state-machine-v2.js',
    'government-deliverable-contracts-v3.js','government-case-orchestrator-v4.js','government-workflow-suite.js'
  ]) assert.match(source,new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(source,/const runtimeOutput = join\(output, "src"\)/);
});

test('budget runtime worker and production verifier modules are syntactically valid before merge', () => {
  for (const file of [
    'assets/js/home-v3.js','assets/js/core/government-workflow-runtime-v5.js','assets/js/core/budget-official-source-runtime-v1.js',
    'assets/js/core/budget-official-document-connector-v1.js','assets/js/core/budget-browser-input-runtime-v1.js','assets/js/core/budget-office-export-v1.js',
    'src/search-worker-v2.js','src/budget-balance-validator.js','src/budget-official-evidence-adapter.js','src/budget-official-document-parser.js',
    'src/budget-document-content-ingestion.js','src/budget-internal-evidence-ingestion.js','src/budget-browser-file-ingestion.js','src/budget-browser-file-parser.js',
    'src/budget-working-draft-planner.js','src/budget-file-parser-review.js','src/budget-tabular-parser.js','src/budget-artifact-factory.js',
    'src/government-workflow-engine.js','src/government-workflow-state-machine-v2.js','scripts/build-static.mjs','scripts/verify-frontend-production.mjs'
  ]) assert.doesNotThrow(() => execFileSync(process.execPath,['--check',file],{stdio:'pipe'}),file);
});
