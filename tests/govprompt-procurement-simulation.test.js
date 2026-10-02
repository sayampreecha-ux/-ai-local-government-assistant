import test from 'node:test';
import assert from 'node:assert/strict';

function simulateProcurementReview(input = {}) {
  const required = [
    'agency',
    'serviceType',
    'budget',
    'period',
    'approvalMemo',
    'tor',
    'priceEvidence',
    'authorityEvidence',
    'acceptancePlan'
  ];

  const missingEvidence = required.filter((key) => !input[key]);
  const gates = {
    factCompleteness: Boolean(input.agency && input.serviceType && input.budget && input.period),
    legalVersion: Boolean(input.authorityEvidence),
    applicableAuthority: Boolean(input.authorityEvidence && input.authorityVerified === true),
    evidence: missingEvidence.length === 0,
    torCompliance: Boolean(input.tor && input.acceptancePlan),
    riskCheck: input.riskCheck === 'passed'
  };

  const passed = Object.values(gates).every(Boolean);
  return {
    gates,
    missingEvidence,
    decisionLock: !passed,
    status: passed ? 'ready-for-human-review' : 'blocked-missing-evidence'
  };
}

test('complete simulated procurement case passes all quality gates', () => {
  const result = simulateProcurementReview({
    agency: 'หน่วยงานจำลอง',
    serviceType: 'จ้างเหมาบริการงานธุรการและบันทึกข้อมูล',
    budget: 180000,
    period: '12 เดือน',
    approvalMemo: 'มี',
    tor: 'มี',
    priceEvidence: 'มี',
    authorityEvidence: 'มีแหล่งทางการและตรวจฉบับใช้บังคับแล้ว',
    authorityVerified: true,
    acceptancePlan: 'มี',
    riskCheck: 'passed'
  });

  assert.equal(result.status, 'ready-for-human-review');
  assert.equal(result.decisionLock, false);
  assert.ok(Object.values(result.gates).every(Boolean));
  assert.deepEqual(result.missingEvidence, []);
});

test('incomplete case remains locked and cannot reach approval-ready status', () => {
  const result = simulateProcurementReview({
    agency: 'หน่วยงานจำลอง',
    serviceType: 'จ้างเหมาบริการ',
    budget: 180000,
    period: '12 เดือน'
  });

  assert.equal(result.status, 'blocked-missing-evidence');
  assert.equal(result.decisionLock, true);
  assert.ok(result.missingEvidence.length > 0);
  assert.equal(result.gates.applicableAuthority, false);
});
