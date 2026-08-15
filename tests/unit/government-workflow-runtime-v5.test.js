import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import {
  WORKFLOW_RUNTIME_BRIDGE_VERSION,
  buildWorkflowRuntimeView,
  buildWorkflowPromptBlock
} from '../../assets/js/core/government-workflow-runtime-v5.js';

test('runtime bridge exposes a sanitized V4 work order for a government task', () => {
  const view = buildWorkflowRuntimeView({ query: 'จัดซื้อรถขุด e-bidding' });
  assert.equal(view.bridgeVersion, WORKFLOW_RUNTIME_BRIDGE_VERSION);
  assert.ok(view.workflowIds.includes('gov.procurement'));
  assert.ok(view.primary);
  assert.equal(view.primary.workflowId, 'gov.procurement');
  assert.equal(view.primary.action, 'acquire-evidence');
  assert.ok(view.primary.missingEvidence.includes('missionAuthority'));
  assert.equal(view.governance.autoApprovalAllowed, false);
  assert.equal(view.governance.rawEvidenceValuesReturned, false);
});

test('runtime bridge never returns raw evidence or artifact values', () => {
  const view = buildWorkflowRuntimeView({
    query: 'จัดซื้อรถขุด e-bidding',
    evidence: [
      { key: 'missionAuthority', value: 'SECRET_AUTHORITY_VALUE', official: true, verified: true },
      { key: 'needJustification', value: 'SECRET_NEED_VALUE' }
    ],
    artifacts: [{
      key: 'need-memo',
      workflowId: 'gov.procurement',
      stageId: 'need-and-authority',
      content: { body: 'SECRET_ARTIFACT_BODY' }
    }]
  });
  const serialized = JSON.stringify(view);
  assert.doesNotMatch(serialized, /SECRET_AUTHORITY_VALUE|SECRET_NEED_VALUE|SECRET_ARTIFACT_BODY/);
});

test('workflow prompt block encodes evidence, deliverable and human/risk gates without chain-of-thought requests', () => {
  const view = buildWorkflowRuntimeView({ query: 'จัดซื้อรถขุด e-bidding' });
  const block = buildWorkflowPromptBlock(view);
  assert.match(block, /GovPrompt Workflow Execution Contract v5/);
  assert.match(block, /หลักฐานที่ยังขาด/);
  assert.match(block, /ห้ามสมมติ/);
  assert.match(block, /ชิ้นงาน final/);
  assert.match(block, /ห้ามเปิดเผย chain-of-thought/);
  assert.doesNotMatch(block, /SECRET_/);
});

test('unclassified text degrades safely without inventing a workflow', () => {
  const view = buildWorkflowRuntimeView({ query: 'สวัสดีครับ' });
  assert.deepEqual(view.workflowIds, []);
  assert.equal(view.primary, null);
  assert.equal(buildWorkflowPromptBlock(view), '');
});

test('home runtime integration sanitizes before dynamic workflow import and has graceful fallback', async () => {
  const [source, index] = await Promise.all([
    readFile('assets/js/home-v3.js', 'utf8'),
    readFile('index.html', 'utf8')
  ]);
  const functionStart = source.indexOf('async function prepareWorkflowRuntime(text)');
  const privacyCall = source.indexOf('prepareExternalPrompt(text)', functionStart);
  const runtimeImport = source.indexOf("import('./core/government-workflow-runtime-v5.js?v=5.0.0')", functionStart);
  assert.ok(functionStart >= 0);
  assert.ok(privacyCall > functionStart);
  assert.ok(runtimeImport > privacyCall);
  assert.match(source, /status: 'privacy-blocked'/);
  assert.match(source, /status: 'runtime-unavailable'/);
  assert.match(source, /enrichPromptWithWorkflow/);
  assert.match(index, /assets\/js\/home-v3\.js\?v=5\.0\.0/);
});

test('production build copies the exact browser-safe workflow runtime dependency chain into dist/src', async () => {
  const source = await readFile('scripts/build-static.mjs', 'utf8');
  for (const file of [
    'government-workflow-engine.js',
    'government-workflow-state-machine-v2.js',
    'government-deliverable-contracts-v3.js',
    'government-case-orchestrator-v4.js',
    'government-workflow-suite.js'
  ]) {
    assert.match(source, new RegExp(file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(source, /const runtimeOutput = join\(output, "src"\)/);
});

test('runtime integration and post-deploy verifier are syntactically valid before merge', () => {
  for (const file of [
    'assets/js/home-v3.js',
    'assets/js/core/government-workflow-runtime-v5.js',
    'scripts/build-static.mjs',
    'scripts/verify-frontend-production.mjs'
  ]) {
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }), file);
  }
});
