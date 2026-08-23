import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWorkflowRuntimeView,
  clearRememberedCases,
  listRememberedCases
} from '../../assets/js/core/government-workflow-runtime-v5.js';

function memoryStorage() {
  const map = new Map();
  return {
    getItem(key) { return map.has(key) ? map.get(key) : null; },
    setItem(key, value) { map.set(key, String(value)); },
    removeItem(key) { map.delete(key); },
    clear() { map.clear(); }
  };
}

function installBrowserStorage() {
  const storage = memoryStorage();
  globalThis.window = { localStorage: storage };
  return storage;
}

test('priority E2E: machinery procurement routes cross-workflow and fails closed without evidence', () => {
  installBrowserStorage();
  clearRememberedCases();
  const view = buildWorkflowRuntimeView({ query: 'อบจ.จะซื้อเครื่องจักร 100 ล้านบาท' });
  assert.equal(view.primary.workflowId, 'gov.procurement');
  assert.ok(view.workflowIds.includes('gov.project'));
  assert.ok(view.workflowIds.includes('gov.finance'));
  assert.equal(view.governance.failClosed, true);
  assert.ok(view.primary.missingEvidence.includes('missionAuthority'));
  assert.equal(view.primary.autoApprovalAllowed, false);
  assert.equal(view.governance.rawEvidenceValuesReturned, false);
});

test('priority E2E: workforce plan routes HR workflow with evidence gate and no fabricated headcount', () => {
  installBrowserStorage();
  clearRememberedCases();
  const view = buildWorkflowRuntimeView({ query: 'ทำแผนอัตรากำลัง อบต.ดงสุวรรณ รอบ 2570-2572' });
  assert.equal(view.primary.workflowId, 'gov.hr');
  assert.ok(view.workflowIds.includes('gov.hr'));
  assert.equal(view.governance.failClosed, true);
  assert.ok(view.primary.missingEvidence.includes('hrIntent'));
  assert.ok(view.primary.missingEvidence.includes('facts'));
  assert.equal(view.primary.qualityGate.substantiveDecisionMade, false);
  assert.equal(view.governance.rawEvidenceValuesReturned, false);
});

test('priority E2E: building permit uses citizen-service as primary with engineering/legal handoffs', () => {
  installBrowserStorage();
  clearRememberedCases();
  const view = buildWorkflowRuntimeView({ query: 'ขออนุญาตก่อสร้างบ้านต้องทำอย่างไร' });
  assert.equal(view.primary.workflowId, 'gov.citizen-service');
  assert.ok(view.workflowIds.includes('gov.engineering'));
  assert.ok(view.workflowIds.includes('gov.legal'));
  assert.equal(view.primary.currentStage.id, 'identify-service');
  assert.equal(view.primary.workflowStatus, 'blocked-missing-evidence');
  assert.ok(view.primary.missingEvidence.includes('serviceType'));
  assert.equal(view.primary.autoApprovalAllowed, false);
});

test('priority E2E: exact citizen case resumes from privacy-minimized Case Memory', () => {
  const storage = installBrowserStorage();
  clearRememberedCases();
  const first = buildWorkflowRuntimeView({ query: 'ขออนุญาตก่อสร้างบ้านต้องทำอย่างไร' });
  const before = listRememberedCases();
  assert.equal(before.length, 1);
  assert.equal(before[0].caseId, first.caseId);
  assert.equal(before[0].workflowIds.includes('gov.citizen-service'), true);
  assert.equal(before[0].routingHint.includes('ขออนุญาต'), true);

  const resumed = buildWorkflowRuntimeView({ query: 'ทำต่อ ขออนุญาต บริการประชาชน' });
  assert.equal(resumed.resumedCase, true);
  assert.equal(resumed.caseId, first.caseId);
  assert.equal(resumed.primary.workflowId, 'gov.citizen-service');

  const serialized = storage.getItem('govprompt-v7-case-memory') || '';
  assert.equal(serialized.includes('ขออนุญาตก่อสร้างบ้านต้องทำอย่างไร'), false);
  assert.equal(serialized.includes('rawPrompt'), false);
  assert.equal(serialized.includes('rawEvidence'), false);
});
