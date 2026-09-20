import test from 'node:test';
import assert from 'node:assert/strict';
import { buildApprovalCaseFromSaraban, buildSafeSarabanDecisionSummary } from '../../assets/js/features/smart-saraban-approval-bridge.js';

test('bridge maps Saraban input into a locked approval case', () => {
  const result = buildApprovalCaseFromSaraban({
    owningUnit: 'กองคลัง',
    subject: 'ขออนุมัติจัดซื้อ',
    purpose: 'เพื่อดำเนินการ',
    facts: 'มีความจำเป็น',
    attachments: ['บันทึกความจำเป็น'],
    sourceReferences: ['เอกสาร-1']
  });
  assert.equal(result.approvalCase.sourceChannel, 'smart-saraban');
  assert.equal(result.approvalCase.state, 'RECEIVED');
  assert.equal(result.lock.locked, true);
  assert.equal(result.qualityGates.humanReviewRequired, true);
});

test('safe summary never permits final decision at intake', () => {
  const summary = buildSafeSarabanDecisionSummary({ subject: 'รายงาน', purpose: 'เพื่อทราบ', facts: 'ข้อมูล' });
  assert.equal(summary.finalDecisionAllowed, false);
  assert.equal(summary.nextAction, 'REQUEST_MISSING_INFORMATION');
  assert.equal(summary.decisionLock, true);
});

test('bridge preserves uncertain item classification', () => {
  const result = buildApprovalCaseFromSaraban({ subject: 'คำขอ', facts: 'ข้อมูล' }, { items: [{ description: 'อุปกรณ์', declaredType: '' }] });
  assert.equal(result.classification[0].classification, 'undetermined');
  assert.equal(result.classification[0].status, 'needs-review');
});
