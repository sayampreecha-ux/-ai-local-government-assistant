import test from 'node:test';
import assert from 'node:assert/strict';
import { DEEP_WORKFLOWS } from '../../src/government-workflow-engine.js';
import { getDeliverableContractV3 } from '../../src/government-deliverable-contracts-v3.js';
import {
  CASE_ORCHESTRATOR_VERSION,
  buildGovernmentWorkOrderV4,
  advanceGovernmentWorkflowV4,
  driveGovernmentWorkflowV4,
  runGovernmentCaseV4,
  driveGovernmentCaseV4
} from '../../src/government-case-orchestrator-v4.js';
import { runGovernmentWorkflow } from '../../src/government-workflow-suite.js';

const AT = '2026-08-15T06:00:00.000Z';
const LATER = '2026-08-15T06:01:00.000Z';
const ev = (key, value = true, official = false, verified = false, extra = {}) => ({ key, value, official, verified, ...extra });

function contentFor(profile) {
  if (profile === 'draft') return { body: 'ร่างเอกสารพร้อมตรวจและใช้ตามขั้นตอนราชการ' };
  if (profile === 'checklist') return { items: [{ id: 'C1', status: 'pass' }] };
  if (profile === 'check') return { result: 'pass' };
  if (profile === 'sheet') return { rows: [{ id: 'R1', amount: 1 }], methodology: 'อ้างอิงหลักฐานที่ตรวจสอบแล้ว' };
  if (profile === 'matrix') return { rows: [{ id: 'M1', result: 'pass' }] };
  if (profile === 'map') return { items: [{ id: 'N1', target: 'workflow' }] };
  if (profile === 'pack') return { documents: [{ id: 'D1' }] };
  if (profile === 'record') return { entries: [{ id: 'E1', action: 'recorded' }] };
  if (profile === 'analysis') return { summary: 'สรุปผลการวิเคราะห์', findings: [{ id: 'F1', result: 'supported' }] };
  return { summary: 'ผลลัพธ์ที่จัดทำจากหลักฐานตามขั้นตอน' };
}

function artifactFor(workflowId, stageId, artifactKey, evidenceKeys = [], extra = {}) {
  const contract = getDeliverableContractV3(workflowId, stageId, artifactKey);
  assert.ok(contract);
  return {
    key: artifactKey,
    contractId: contract.id,
    contractVersion: contract.schemaVersion,
    workflowId,
    stageId,
    status: 'final',
    evidenceKeys: [...evidenceKeys],
    unresolvedItems: [],
    provenance: { generatedBy: 'govprompt-v7', generatedAt: AT, sourceEvidenceKeys: [...evidenceKeys] },
    validation: { validated: true, validator: 'workflow-validator-v3', validatedAt: AT, errors: [] },
    content: contentFor(contract.profile),
    ...extra
  };
}

function stateFor(workflowId, completedStages = [], caseId = null) {
  const stages = DEEP_WORKFLOWS[workflowId] || [];
  const transitionLog = completedStages.map((stageId, index) => ({
    type: 'stage-transition',
    workflowId,
    fromStageId: stageId,
    toStageId: stages[index + 1]?.id || null,
    actor: 'test-fixture',
    at: AT,
    evidenceKeys: [],
    artifactKeys: []
  }));
  const next = stages[completedStages.length] || null;
  return {
    schemaVersion: '2.0',
    workflowId,
    caseId,
    status: next ? 'active' : 'complete',
    completedStages: [...completedStages],
    currentStageId: next?.id || null,
    transitionLog
  };
}

test('work order asks for missing evidence instead of guessing it', () => {
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement' });
  assert.equal(work.orchestratorVersion, CASE_ORCHESTRATOR_VERSION);
  assert.equal(work.action, 'acquire-evidence');
  assert.ok(work.missingEvidence.includes('missionAuthority'));
  assert.ok(work.missingEvidence.includes('needJustification'));
  assert.equal(work.governance.noFabrication, true);
});

test('official-source gate becomes the next action when ordinary evidence exists but authority is unverified', () => {
  const work = buildGovernmentWorkOrderV4({
    workflowId: 'gov.procurement',
    evidence: [ev('missionAuthority', 'authority'), ev('needJustification', 'need')]
  });
  assert.equal(work.action, 'verify-official-evidence');
  assert.deepEqual(work.missingOfficialEvidence, ['missionAuthority']);
});

test('evidence-ready stage creates a concrete deliverable generation work order', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', evidence });
  assert.equal(work.action, 'generate-deliverables');
  assert.equal(work.deliverableWorkOrders.length, 1);
  assert.equal(work.deliverableWorkOrders[0].artifactKey, 'need-memo');
  assert.ok(work.deliverableWorkOrders[0].contractId.includes('gov.procurement:need-and-authority:need-memo'));
  assert.ok(work.deliverableWorkOrders[0].requiredEvidence.includes('missionAuthority'));
});

test('invalid artifact is routed to repair instead of being treated as ready', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', evidence, artifacts: [{ key: 'need-memo', workflowId: 'gov.procurement', status: 'ready' }] });
  assert.equal(work.action, 'repair-deliverables');
  assert.equal(work.deliverableWorkOrders[0].status, 'invalid');
});

test('valid artifact makes exactly one stage transition ready and advance moves only one stage', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']);
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', evidence, artifacts: [artifact] });
  assert.equal(work.action, 'transition-ready');

  const advanced = advanceGovernmentWorkflowV4({ workflowId: 'gov.procurement', evidence, artifacts: [artifact], at: AT });
  assert.equal(advanced.advanced, true);
  assert.deepEqual(advanced.state.completedStages, ['need-and-authority']);
  assert.equal(advanced.state.currentStageId, 'plan-and-budget');
  assert.equal(advanced.transition.completedStageId, 'need-and-authority');
  assert.deepEqual(advanced.transition.contractIds, [artifact.contractId]);
});

test('bounded auto-drive advances all already-ready stages and stops at the first real blocker', () => {
  const evidence = [
    ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need'),
    ev('planLinkage', 'plan'), ev('fundingSource', 'fund'), ev('budgetAvailability', true)
  ];
  const artifacts = [
    artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']),
    artifactFor('gov.procurement', 'plan-and-budget', 'plan-budget-check', ['planLinkage', 'fundingSource', 'budgetAvailability'])
  ];
  const result = driveGovernmentWorkflowV4({ workflowId: 'gov.procurement', evidence, artifacts, at: AT });
  assert.equal(result.transitionCount, 2);
  assert.equal(result.stoppedBy, 'acquire-evidence');
  assert.equal(result.workOrder.currentStage.id, 'technical-requirements');
  assert.ok(result.workOrder.missingEvidence.includes('useCase'));
});

test('auto-drive remains bounded even when the caller gives a lower transition limit', () => {
  const evidence = [
    ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need'),
    ev('planLinkage', 'plan'), ev('fundingSource', 'fund'), ev('budgetAvailability', true)
  ];
  const artifacts = [
    artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']),
    artifactFor('gov.procurement', 'plan-and-budget', 'plan-budget-check', ['planLinkage', 'fundingSource', 'budgetAvailability'])
  ];
  const result = driveGovernmentWorkflowV4({ workflowId: 'gov.procurement', evidence, artifacts, maxTransitions: 1, at: AT });
  assert.equal(result.status, 'blocked-transition-limit');
  assert.equal(result.transitionCount, 1);
  assert.equal(result.governance.failClosed, true);
});

test('risk gate produces an evidence-backed risk-review work order and does not auto-transition', () => {
  const state = stateFor('gov.procurement', ['need-and-authority', 'plan-and-budget']);
  const evidence = [ev('useCase', 'use'), ev('operatingConditions', 'conditions'), ev('performanceNeeds', 'performance')];
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state, evidence, input: { draftTor: 'กำหนดยี่ห้อ ABC รุ่น ZX500' } });
  assert.equal(work.action, 'perform-risk-review');
  assert.equal(work.riskWork.resolutionMustBeEvidenceBacked, true);
  const advanced = advanceGovernmentWorkflowV4({ workflowId: 'gov.procurement', state, evidence, input: { draftTor: 'กำหนดยี่ห้อ ABC รุ่น ZX500' } });
  assert.equal(advanced.advanced, false);
});

test('human approval is always an explicit stop and cannot be auto-approved', () => {
  const state = stateFor('gov.procurement', ['need-and-authority', 'plan-and-budget', 'technical-requirements', 'market-and-standard-price', 'tor-and-competition-check']);
  const evidence = [ev('currentProcurementRule', 'rule', true, true), ev('methodDecisionFacts', 'facts')];
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state, evidence });
  assert.equal(work.action, 'request-human-approval');
  assert.equal(work.approvalRequest.autoApprovalAllowed, false);
  assert.equal(work.governance.autoApprovalAllowed, false);

  const result = driveGovernmentWorkflowV4({ workflowId: 'gov.procurement', state, evidence });
  assert.equal(result.transitionCount, 0);
  assert.equal(result.stoppedBy, 'request-human-approval');
});

test('after explicit approval, missing artifact is generated, invalid signoff repaired, then signed artifact can advance', () => {
  const state = stateFor('gov.procurement', ['need-and-authority', 'plan-and-budget', 'technical-requirements', 'market-and-standard-price', 'tor-and-competition-check']);
  const evidence = [ev('currentProcurementRule', 'rule', true, true), ev('methodDecisionFacts', 'facts')];
  const approval = { id: 'APP-9', workflowId: 'gov.procurement', stageId: 'method-selection', approved: true };
  const input = { approvals: [approval] };

  const missing = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state, evidence, input });
  assert.equal(missing.action, 'generate-deliverables');

  const unsigned = artifactFor('gov.procurement', 'method-selection', 'procurement-method-recommendation', ['currentProcurementRule', 'methodDecisionFacts']);
  const invalid = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state, evidence, artifacts: [unsigned], input });
  assert.equal(invalid.action, 'repair-deliverables');

  const signed = { ...unsigned, signoffs: [{ workflowId: 'gov.procurement', stageId: 'method-selection', approvalId: 'APP-9', approved: true, approvedBy: 'authorized-officer', approvedAt: LATER }] };
  const ready = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state, evidence, artifacts: [signed], input });
  assert.equal(ready.action, 'transition-ready');
  const advanced = advanceGovernmentWorkflowV4({ workflowId: 'gov.procurement', state, evidence, artifacts: [signed], input, at: LATER });
  assert.equal(advanced.advanced, true);
  assert.equal(advanced.state.currentStageId, 'reference-price');
});

test('legacy completedStages arrays are read-only in V4 until migrated to an integrity-checked state', () => {
  const completedStages = ['need-and-authority'];
  const evidence = [ev('planLinkage', 'plan'), ev('fundingSource', 'fund'), ev('budgetAvailability', true)];
  const artifact = artifactFor('gov.procurement', 'plan-and-budget', 'plan-budget-check', ['planLinkage', 'fundingSource', 'budgetAvailability']);
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', completedStages, evidence, artifacts: [artifact] });
  assert.equal(work.action, 'migrate-workflow-state');
  assert.equal(work.governance.legacyStateMigrationRequired, true);
  const advanced = advanceGovernmentWorkflowV4({ workflowId: 'gov.procurement', completedStages, evidence, artifacts: [artifact] });
  assert.equal(advanced.advanced, false);
  assert.equal(advanced.status, 'blocked-legacy-state-migration');
});

test('tampered persisted state is routed to repair and remains fail-closed', () => {
  const state = stateFor('gov.procurement', ['need-and-authority']);
  state.transitionLog = [];
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state });
  assert.equal(work.action, 'repair-workflow-state');
  assert.equal(work.governance.failClosed, true);
});

test('work order never returns raw evidence values', () => {
  const evidence = [ev('missionAuthority', 'SECRET_AUTHORITY_VALUE', true, true), ev('needJustification', 'SECRET_NEED_VALUE')];
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', evidence });
  const serialized = JSON.stringify(work);
  assert.doesNotMatch(serialized, /SECRET_AUTHORITY_VALUE|SECRET_NEED_VALUE/);
  assert.equal(work.governance.rawEvidenceValuesReturned, false);
});

test('V4 scopes artifacts by workflow so same artifact key in another workflow cannot collide', () => {
  const evidence = [ev('facts', 'facts')];
  const legal = artifactFor('gov.legal', 'facts', 'fact-summary', ['facts']);
  const correspondence = artifactFor('gov.correspondence', 'facts', 'fact-summary', ['facts']);
  const work = buildGovernmentWorkOrderV4({ workflowId: 'gov.legal', evidence, artifacts: [legal, correspondence] });
  assert.equal(work.action, 'transition-ready');
  assert.equal(work.deliverableWorkOrders[0].status, 'valid');
});

test('case view exposes workflow-specific next actions and cross-workflow handoff graph', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifacts = [artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification'], { caseId: 'CASE-4' })];
  const result = runGovernmentCaseV4({ input: { caseId: 'CASE-4' }, workflowIds: ['gov.procurement', 'gov.project', 'gov.finance'], evidence, artifacts });
  assert.equal(result.status, 'ready-to-advance');
  assert.equal(result.workflows.length, 3);
  assert.ok(result.nextActions.some((item) => item.workflowId === 'gov.procurement' && item.action === 'transition-ready'));
  assert.ok(result.nextActions.some((item) => item.workflowId === 'gov.project'));
  assert.equal(result.governance.autoApprovalAllowed, false);
});

test('V4 quality gate normalizes missing evidence, risk review, and ready states without returning raw values', () => {
  const missing = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement' });
  assert.equal(missing.qualityGate.status, 'NEEDS_INFO');
  assert.equal(missing.qualityGate.completeness, false);
  assert.equal(missing.qualityGate.rawEvidenceValuesReturned, false);

  const riskStages = DEEP_WORKFLOWS['gov.procurement'];
  const riskIndex = riskStages.findIndex((stage) => stage.riskChecks.length > 0);
  const riskEvidence = riskStages.slice(0, riskIndex + 1).flatMap((stage) => stage.requiredEvidence.map((key) => ev(key, 'SYNTHETIC_ONLY', stage.officialEvidenceRequired, stage.officialEvidenceRequired)));
  const risk = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', state: stateFor('gov.procurement', riskStages.slice(0, riskIndex).map((stage) => stage.id)), evidence: riskEvidence });
  assert.equal(risk.qualityGate.status, 'REVIEW_REQUIRED');
  assert.equal(risk.qualityGate.humanReviewRequired, true);
  assert.doesNotMatch(JSON.stringify(risk.qualityGate), /SYNTHETIC_ONLY/);

  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']);
  const ready = buildGovernmentWorkOrderV4({ workflowId: 'gov.procurement', evidence, artifacts: [artifact] });
  assert.equal(ready.qualityGate.status, 'PASS');
  assert.equal(ready.qualityGate.workflowReady, true);
});

test('case driver advances only ready workflows and returns a persisted state map', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifacts = [artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification'], { caseId: 'CASE-5' })];
  const result = driveGovernmentCaseV4({ input: { caseId: 'CASE-5' }, workflowIds: ['gov.procurement', 'gov.project'], evidence, artifacts, maxTransitionsPerWorkflow: 5, at: AT });
  assert.equal(result.transitionCount, 1);
  assert.ok(result.state['gov.procurement']);
  assert.equal(result.state['gov.procurement'].currentStageId, 'plan-and-budget');
  assert.equal(result.workflowRuns.find((item) => item.workflowId === 'gov.project').transitionCount, 0);
});

test('case is complete only when every included workflow has a complete integrity-checked state', () => {
  const legalStages = DEEP_WORKFLOWS['gov.legal'].map((stage) => stage.id);
  const correspondenceStages = DEEP_WORKFLOWS['gov.correspondence'].map((stage) => stage.id);
  const state = {
    'gov.legal': stateFor('gov.legal', legalStages),
    'gov.correspondence': stateFor('gov.correspondence', correspondenceStages)
  };
  const result = runGovernmentCaseV4({ workflowIds: ['gov.legal', 'gov.correspondence'], state });
  assert.equal(result.status, 'complete');
  assert.ok(result.workflows.every((work) => work.action === 'complete'));
  assert.equal(result.nextActions.length, 0);
  assert.equal(result.governance.failClosed, false);
});

test('top-level workflow API stays backward compatible and now exposes V4 execution', () => {
  const result = runGovernmentWorkflow({ query: 'จัดซื้อรถขุด e-bidding', evidence: [{ official: true, verified: true, source: 'government-original' }] });
  assert.equal(result.status, 'workflow-ready');
  assert.ok(result.stateMachineV2);
  assert.ok(result.stateMachineV3);
  assert.ok(result.caseOrchestrationV4);
  assert.ok(result.currentV4);
  assert.equal(result.currentV4.orchestratorVersion, CASE_ORCHESTRATOR_VERSION);
});
