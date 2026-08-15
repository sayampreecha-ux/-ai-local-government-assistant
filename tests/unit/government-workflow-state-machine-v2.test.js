import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWorkflowStateV2 as createWorkflowState,
  executeGovernmentWorkflowV2 as executeDeepGovernmentWorkflow,
  transitionGovernmentWorkflowV2 as transitionGovernmentWorkflow,
  buildCrossWorkflowCaseV2 as buildCrossWorkflowCase
} from '../../src/government-workflow-state-machine-v2.js';

const ev = (key, value = true, official = false, verified = false, extra = {}) => ({ key, value, official, verified, ...extra });
const artifact = (key, status = 'ready') => ({ key, status });

test('rejects skipped completed stages instead of trusting caller state', () => {
  const r = executeDeepGovernmentWorkflow({ workflowId: 'gov.procurement', completedStages: ['need-and-authority', 'technical-requirements'] });
  assert.equal(r.status, 'blocked-invalid-transition');
  assert.equal(r.transitionError.expectedStage, 'plan-and-budget');
});

test('official source requirement is bound to the exact evidence key', () => {
  const r = executeDeepGovernmentWorkflow({
    workflowId: 'gov.procurement',
    evidence: [ev('missionAuthority', 'authority'), ev('needJustification', 'need', true, true)]
  });
  assert.equal(r.status, 'blocked-official-source');
  assert.deepEqual(r.missingOfficialEvidence, ['missionAuthority']);
});

test('human approval is stage-specific', () => {
  const completedStages = ['need-and-authority', 'plan-and-budget', 'technical-requirements', 'market-and-standard-price', 'tor-and-competition-check'];
  const evidence = [ev('currentProcurementRule', 'rule', true, true), ev('methodDecisionFacts', 'facts')];
  const wrong = executeDeepGovernmentWorkflow({ workflowId: 'gov.procurement', completedStages, evidence, input: { approvals: [{ id: 'A1', workflowId: 'gov.procurement', stageId: 'evaluation', approved: true }] } });
  assert.equal(wrong.status, 'awaiting-human-approval');
  const right = executeDeepGovernmentWorkflow({ workflowId: 'gov.procurement', completedStages, evidence, input: { approvals: [{ id: 'A2', workflowId: 'gov.procurement', stageId: 'method-selection', approved: true }] } });
  assert.equal(right.status, 'ready');
  assert.equal(right.approval.id, 'A2');
});

test('high procurement risk stays blocked until reviewed and evidence-backed resolution exists', () => {
  const completedStages = ['need-and-authority', 'plan-and-budget', 'technical-requirements', 'market-and-standard-price'];
  const evidence = [ev('draftTor', 'tor'), ev('competitionMemo', 'reviewed')];
  const baseInput = { draftTor: 'กำหนดยี่ห้อ ABC รุ่น ZX500 เท่านั้น', riskReviews: [{ workflowId: 'gov.procurement', stageId: 'tor-and-competition-check', completed: true }] };
  const blocked = executeDeepGovernmentWorkflow({ workflowId: 'gov.procurement', completedStages, evidence, input: baseInput });
  assert.equal(blocked.status, 'blocked-risk-review');
  assert.ok(blocked.unresolvedRiskFindings.some((r) => r.code === 'vendor-lock'));
  const cleared = executeDeepGovernmentWorkflow({
    workflowId: 'gov.procurement', completedStages, evidence,
    input: { ...baseInput, riskResolutions: [{ code: 'vendor-lock', status: 'false-positive', rationale: 'ชื่อรุ่นเป็นตัวอย่างในเอกสารประกอบ ไม่ใช่ข้อกำหนดบังคับ', approved: true, evidenceKeys: ['competitionMemo'] }] }
  });
  assert.equal(cleared.status, 'ready');
});

test('state transition cannot complete a stage until required deliverables exist', () => {
  const state = createWorkflowState('gov.procurement', 'CASE-1');
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const blocked = transitionGovernmentWorkflow({ workflowId: 'gov.procurement', state, evidence, artifacts: [], input: {} });
  assert.equal(blocked.status, 'blocked-missing-deliverables');
  assert.deepEqual(blocked.execution.missingDeliverables, ['need-memo']);
});

test('successful transition appends a minimized audit event and advances exactly one stage', () => {
  const state = createWorkflowState('gov.procurement', 'CASE-2');
  const evidence = [ev('missionAuthority', 'SECRET-AUTHORITY', true, true), ev('needJustification', 'SECRET-NEED')];
  const result = transitionGovernmentWorkflow({ workflowId: 'gov.procurement', state, evidence, artifacts: [artifact('need-memo')], actor: 'procurement-officer', at: '2026-08-15T05:00:00.000Z' });
  assert.equal(result.transitioned, true);
  assert.deepEqual(result.state.completedStages, ['need-and-authority']);
  assert.equal(result.state.currentStageId, 'plan-and-budget');
  assert.equal(result.state.transitionLog.length, 1);
  assert.deepEqual(result.state.transitionLog[0].evidenceKeys.sort(), ['missionAuthority', 'needJustification'].sort());
  assert.doesNotMatch(JSON.stringify(result.state.transitionLog[0]), /SECRET-AUTHORITY|SECRET-NEED/);
});

test('cross-workflow handoff is a contract and stays blocked until evidence and deliverables are ready', () => {
  const evidence = [ev('planLinkage', 'plan'), ev('fundingSource', 'budget'), ev('budgetAvailability', true), ev('needJustification', 'need')];
  const blocked = executeDeepGovernmentWorkflow({ workflowId: 'gov.procurement', completedStages: ['need-and-authority'], evidence, artifacts: [artifact('need-memo')] });
  const projectHandoff = blocked.handoffContracts.find((h) => h.targetWorkflowId === 'gov.project');
  assert.equal(projectHandoff.status, 'blocked-handoff-deliverables');
  assert.deepEqual(projectHandoff.missingDeliverables, ['plan-budget-check']);

  const ready = executeDeepGovernmentWorkflow({ workflowId: 'gov.procurement', completedStages: ['need-and-authority'], evidence, artifacts: [artifact('need-memo'), artifact('plan-budget-check')] });
  const readyProject = ready.handoffContracts.find((h) => h.targetWorkflowId === 'gov.project');
  assert.equal(readyProject.status, 'ready');
  assert.deepEqual(readyProject.payload.artifactKeys.sort(), ['need-memo', 'plan-budget-check'].sort());
});

test('cross-workflow case exposes handoff graph without recursively auto-approving dependencies', () => {
  const evidence = [ev('planLinkage', 'plan'), ev('fundingSource', 'budget'), ev('budgetAvailability', true), ev('needJustification', 'need')];
  const result = buildCrossWorkflowCase({ caseId: 'CASE-3', artifacts: [artifact('need-memo'), artifact('plan-budget-check')] }, ['gov.procurement', 'gov.project', 'gov.finance'], evidence, { 'gov.procurement': ['need-and-authority'] });
  assert.equal(result.workflows.length, 3);
  assert.ok(result.handoffGraph.some((h) => h.sourceWorkflowId === 'gov.procurement' && h.targetWorkflowId === 'gov.project'));
  assert.ok(result.readyHandoffs.some((h) => h.targetWorkflowId === 'gov.finance'));
});
