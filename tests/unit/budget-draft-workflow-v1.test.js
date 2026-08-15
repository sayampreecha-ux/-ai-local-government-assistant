import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectGovernmentWorkflows,
  runGovernmentWorkflowByIdV2
} from '../../src/government-workflow-suite.js';
import { DEEP_WORKFLOWS } from '../../src/government-workflow-engine.js';
import { validateBudgetBalance } from '../../src/budget-balance-validator.js';
import {
  DELIVERABLE_CONTRACT_SCHEMA_VERSION,
  getDeliverableContractV3,
  validateDeliverableArtifactV3
} from '../../src/government-deliverable-contracts-v3.js';
import { buildWorkflowRuntimeView } from '../../assets/js/core/government-workflow-runtime-v5.js';

const AT = '2026-08-15T10:00:00.000Z';
const ev = (key, value = true, extra = {}) => ({ key, value, ...extra });
const BUDGET_STAGES = DEEP_WORKFLOWS['gov.budget-draft'].map((stage) => stage.id);

const ROUTING_CASES = [
  'ทำร่างงบปี 70 อบจ.พะเยา',
  'ร่างงบประมาณรายจ่ายปี 2570',
  'ช่วยทำข้อบัญญัติงบประมาณปีหน้า',
  'ทำกรอบงบ 2570 ของ อบจ.',
  'สรุปคำของบทุกกองแล้วจัดร่างงบ'
];

test('budget drafting phrases route to gov.budget-draft as the primary workflow profile', () => {
  for (const query of ROUTING_CASES) {
    const workflows = detectGovernmentWorkflows({ query });
    assert.equal(workflows[0]?.id, 'gov.budget-draft', query);
    assert.ok(workflows.some((workflow) => workflow.id === 'gov.budget-draft'), query);
  }
});

test('runtime bridge v5 exposes the governed budget profile instead of stopping at generic finance', () => {
  const view = buildWorkflowRuntimeView({ query: ROUTING_CASES[0] });
  assert.equal(view.primary?.workflowId, 'gov.budget-draft');
  assert.ok(view.workflowIds.includes('gov.budget-draft'));
  assert.equal(view.primary?.currentStage?.id, 'budget-context');
  assert.equal(view.primary?.action, 'acquire-evidence');
  assert.equal(view.governance.autoApprovalAllowed, false);
  assert.equal(view.governance.rawEvidenceValuesReturned, false);
});

test('budget workflow declares the eleven governed stages in the required order', () => {
  assert.deepEqual(BUDGET_STAGES, [
    'budget-context',
    'baseline-budget',
    'revenue-forecast',
    'plan-project-linkage',
    'personnel-obligations',
    'budget-allocation',
    'priority-readiness',
    'risk-review',
    'budget-balance',
    'deliverables',
    'human-approval'
  ]);
});

test('current budget rule must be official, verified and fresh before context can proceed', () => {
  const common = [ev('organizationContext', 'องค์การปกครองส่วนท้องถิ่น'), ev('targetBudgetYear', 2570)];
  const blocked = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    evidence: [...common, ev('currentBudgetRule', 'rule')]
  });
  assert.equal(blocked.status, 'blocked-official-source');
  assert.deepEqual(blocked.missingOfficialEvidence, ['currentBudgetRule']);

  const ready = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    evidence: [...common, ev('currentBudgetRule', 'rule', { official: true, verified: true, fresh: true, current: true })]
  });
  assert.equal(ready.status, 'ready');
});

test('missing baseline, latest revenue and target-year plan fail closed at their own stages', () => {
  const baseline = runGovernmentWorkflowByIdV2('gov.budget-draft', { completedStages: BUDGET_STAGES.slice(0, 1) });
  assert.equal(baseline.currentStage.id, 'baseline-budget');
  assert.ok(baseline.missingEvidence.includes('baselineBudget'));

  const revenue = runGovernmentWorkflowByIdV2('gov.budget-draft', { completedStages: BUDGET_STAGES.slice(0, 2) });
  assert.equal(revenue.currentStage.id, 'revenue-forecast');
  assert.ok(revenue.missingEvidence.includes('latestRevenueActuals'));

  const plan = runGovernmentWorkflowByIdV2('gov.budget-draft', { completedStages: BUDGET_STAGES.slice(0, 3) });
  assert.equal(plan.currentStage.id, 'plan-project-linkage');
  assert.ok(plan.missingEvidence.includes('targetYearPlan'));
});

test('official revenue and target-year plan evidence also require freshness verification', () => {
  const revenue = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    completedStages: BUDGET_STAGES.slice(0, 2),
    evidence: [
      ev('latestRevenueActuals', 1000000, { official: true, verified: true, fresh: false }),
      ev('revenueForecastBasis', 'trend')
    ]
  });
  assert.equal(revenue.status, 'blocked-official-source');
  assert.deepEqual(revenue.missingOfficialEvidence, ['latestRevenueActuals']);

  const plan = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    completedStages: BUDGET_STAGES.slice(0, 3),
    evidence: [
      ev('targetYearPlan', 'plan', { official: true, verified: true, current: false }),
      ev('projectRequests', ['P1'])
    ]
  });
  assert.equal(plan.status, 'blocked-official-source');
  assert.deepEqual(plan.missingOfficialEvidence, ['targetYearPlan']);
});

test('budget balance validator blocks unequal revenue and expense totals', () => {
  const result = validateBudgetBalance({ revenueTotal: 100, expenseTotal: 90 });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'blocked-unbalanced-budget');
  assert.equal(result.difference, 10);
  assert.ok(result.findings.some((item) => item.code === 'budget-not-balanced'));
});

test('budget balance validator detects incorrect declared sums before finalization', () => {
  const result = validateBudgetBalance({
    revenueTotal: 90,
    expenseTotal: 100,
    revenueItems: [{ key: 'R1', amount: 40 }, { key: 'R2', amount: 60 }],
    expenseItems: [{ key: 'E1', amount: 100 }]
  });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'validation-failed');
  assert.ok(result.errors.includes('revenueTotal:formula-mismatch'));
  assert.ok(result.findings.some((item) => item.code === 'budget-formula-mismatch'));
});

test('estimated amounts must be explicitly labelled and remain visible in validation output', () => {
  const labelled = validateBudgetBalance({
    revenueItems: [{ key: 'R1', amount: 100, estimated: true, status: 'estimated' }],
    expenseItems: [{ key: 'E1', amount: 100, status: 'verified' }]
  });
  assert.equal(labelled.valid, true);
  assert.equal(labelled.hasEstimates, true);
  assert.deepEqual(labelled.estimatedItemKeys, ['R1']);

  const unlabelled = validateBudgetBalance({
    revenueItems: [{ key: 'R1', amount: 100, estimated: true, status: 'verified' }],
    expenseItems: [{ key: 'E1', amount: 100, status: 'verified' }]
  });
  assert.equal(unlabelled.valid, false);
  assert.ok(unlabelled.errors.includes('revenue:R1:estimated-status-label-required'));
});

test('pending-confirmation amounts cannot be treated as final budget totals', () => {
  const result = validateBudgetBalance({
    revenueItems: [{ key: 'R1', amount: 100, status: 'pending-confirmation' }],
    expenseItems: [{ key: 'E1', amount: 100, status: 'verified' }]
  });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'blocked-pending-confirmation');
});

test('budget-balance stage integrates validator findings and fails closed on imbalance', () => {
  const result = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    completedStages: BUDGET_STAGES.slice(0, 8),
    evidence: [ev('budgetTotals', { revenueTotal: 100, expenseTotal: 95 })]
  });
  assert.equal(result.currentStage.id, 'budget-balance');
  assert.equal(result.status, 'blocked-risk-review');
  assert.equal(result.governance.failClosed, true);
  assert.equal(result.budgetBalanceValidation?.valid, false);
  assert.ok(result.unresolvedRiskFindings.some((item) => item.code === 'budget-not-balanced'));
});

test('structured budget export contract requires evidence linkage and passes with complete provenance', () => {
  const stageId = 'deliverables';
  const artifactKey = 'budget-structured-export';
  const contract = getDeliverableContractV3('gov.budget-draft', stageId, artifactKey);
  assert.ok(contract);
  assert.deepEqual(contract.requiredEvidence, [
    'baselineBudget',
    'latestRevenueActuals',
    'targetYearPlan',
    'personnelObligations',
    'budgetTotals',
    'budgetSourceRegister'
  ]);

  const evidence = contract.requiredEvidence.map((key) => ev(key, key === 'budgetTotals' ? { revenueTotal: 100, expenseTotal: 100 } : `${key}-value`));
  const artifact = {
    key: artifactKey,
    contractId: contract.id,
    contractVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION,
    workflowId: 'gov.budget-draft',
    stageId,
    status: 'final',
    evidenceKeys: [...contract.requiredEvidence],
    unresolvedItems: [],
    provenance: {
      generatedBy: 'govprompt-v7-budget-draft',
      generatedAt: AT,
      sourceEvidenceKeys: [...contract.requiredEvidence]
    },
    validation: {
      validated: true,
      validator: 'budget-deliverable-validator-v1',
      validatedAt: AT,
      errors: []
    },
    content: {
      format: 'structured-budget-v1',
      sourceEvidenceKeys: [...contract.requiredEvidence],
      totals: { revenue: 100, expense: 100 }
    }
  };

  const result = validateDeliverableArtifactV3({ workflowId: 'gov.budget-draft', stageId, artifact, evidence });
  assert.equal(result.valid, true);
});

test('human approval remains mandatory at the final budget stage', () => {
  const withoutApproval = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    completedStages: BUDGET_STAGES.slice(0, 10),
    evidence: [ev('decisionAuthority', 'authorized-officer')]
  });
  assert.equal(withoutApproval.currentStage.id, 'human-approval');
  assert.equal(withoutApproval.status, 'awaiting-human-approval');

  const withApproval = runGovernmentWorkflowByIdV2('gov.budget-draft', {
    completedStages: BUDGET_STAGES.slice(0, 10),
    evidence: [ev('decisionAuthority', 'authorized-officer')],
    approvals: [{ id: 'BUDGET-APP-1', workflowId: 'gov.budget-draft', stageId: 'human-approval', approved: true }]
  });
  assert.equal(withApproval.status, 'ready');
});
