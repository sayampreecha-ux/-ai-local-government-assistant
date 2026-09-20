import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createApprovalCase,
  assessCase,
  evaluateDecisionLock,
  classifyItems,
  canTransition,
  transitionCase,
  runApprovalQualityGates
} from '../../assets/js/features/approval-workflow.js';

test('creates a locked case with safe unknown defaults', () => {
  const item = createApprovalCase({ caseId: 'T-001', requestText: 'ขอจัดซื้อ' });
  assert.equal(item.state, 'RECEIVED');
  assert.equal(item.decisionLock, true);
  assert.equal(item.owningUnit, null);
  assert.deepEqual(item.facts, []);
});

test('assessment identifies missing facts and evidence', () => {
  const result = assessCase(createApprovalCase({ requestText: 'ขอจัดซื้อ' }));
  assert.equal(result.hasMaterialGaps, true);
  assert.ok(result.missingInformation.includes('facts'));
  assert.ok(result.missingInformation.includes('evidenceReferences'));
});

test('classification preserves uncertainty instead of keyword guessing', () => {
  const result = classifyItems([{ description: 'โต๊ะ', declaredType: '', classificationEvidence: [] }]);
  assert.equal(result[0].classification, 'undetermined');
  assert.equal(result[0].status, 'needs-review');
});

test('transition guard blocks draft when material gaps remain', () => {
  const item = createApprovalCase({ requestText: 'ขอจัดซื้อ', owningUnit: 'กองคลัง' });
  const result = canTransition({ ...item, state: 'READINESS_ASSESSMENT' }, 'DRAFT_ALLOWED');
  assert.equal(result.allowed, false);
});

test('transition records audit trail and permits safe progression', () => {
  const item = createApprovalCase({ requestText: 'รายงาน', owningUnit: 'สำนักปลัด', facts: ['ข้อเท็จจริง'], evidenceReferences: ['เอกสาร-1'], humanReviewStatus: 'approved' });
  const result = transitionCase({ ...item, state: 'RECEIVED' }, 'FACT_REVIEW', 'tester', ['เอกสาร-1']);
  assert.equal(result.ok, true);
  assert.equal(result.caseData.state, 'FACT_REVIEW');
  assert.equal(result.caseData.auditTrail.at(-1).actor, 'tester');
});

test('quality gates expose human review and decision lock', () => {
  const result = runApprovalQualityGates(createApprovalCase({ requestText: 'ขออนุมัติ', owningUnit: 'กองคลัง' }));
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.decisionLock, true);
  assert.equal(result.status, 'red');
});

test('explicit risk flags keep case locked even when fields exist', () => {
  const item = createApprovalCase({ requestText: 'จัดซื้อ', owningUnit: 'กองคลัง', facts: ['ข้อเท็จจริง'], evidenceReferences: ['เอกสาร'], riskFlags: ['ตรวจความเสี่ยงแบ่งซื้อแบ่งจ้าง'] });
  const result = evaluateDecisionLock(item);
  assert.equal(result.locked, true);
  assert.ok(result.reasons.some((reason) => reason.includes('แบ่งซื้อแบ่งจ้าง')));
});
