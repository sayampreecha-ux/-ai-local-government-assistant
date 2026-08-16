import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DELIVERABLE_CONTRACT_SCHEMA_VERSION,
  getDeliverableContractV3,
  getStageDeliverableRequirementsV3,
  validateDeliverableContractCoverageV3,
  validateDeliverableArtifactV3,
  validateStageDeliverablesV3,
  buildStageHandoffContractsV3,
  executeGovernmentWorkflowV3,
  transitionGovernmentWorkflowV3
} from '../../src/government-deliverable-contracts-v3.js';
import { runGovernmentWorkflow } from '../../src/government-workflow-suite.js';

const AT = '2026-08-15T05:30:00.000Z';
const LATER = '2026-08-15T05:31:00.000Z';
const ev = (key, value = true, official = false, verified = false, extra = {}) => ({ key, value, official, verified, ...extra });

function contentFor(profile) {
  if (profile === 'draft') return { body: 'ร่างข้อความราชการพร้อมใช้' };
  if (profile === 'checklist') return { items: [{ id: 'C1', status: 'pass' }] };
  if (profile === 'check') return { result: 'pass' };
  if (profile === 'sheet') return { rows: [{ item: 'R1', amount: 1 }], methodology: 'คำนวณจากหลักฐานที่ตรวจสอบแล้ว' };
  if (profile === 'matrix') return { rows: [{ item: 'M1', result: 'ok' }] };
  if (profile === 'map') return { items: [{ id: 'N1', target: 'gov.finance' }] };
  if (profile === 'pack') return { documents: [{ id: 'D1' }] };
  if (profile === 'record') return { entries: [{ id: 'E1', action: 'recorded' }] };
  if (profile === 'analysis') return { summary: 'สรุปผลการวิเคราะห์', findings: [{ id: 'F1', result: 'supported' }] };
  return { summary: 'ผลลัพธ์ที่ผ่านการจัดทำและตรวจสอบแล้ว' };
}

function artifactFor(workflowId, stageId, artifactKey, evidenceKeys = [], extra = {}) {
  const contract = getDeliverableContractV3(workflowId, stageId, artifactKey);
  assert.ok(contract, `missing contract for ${workflowId}:${stageId}:${artifactKey}`);
  return {
    key: artifactKey,
    contractId: contract.id,
    contractVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION,
    workflowId,
    stageId,
    status: 'final',
    evidenceKeys: [...evidenceKeys],
    unresolvedItems: [],
    provenance: {
      generatedBy: 'govprompt-v7',
      generatedAt: AT,
      sourceEvidenceKeys: [...evidenceKeys]
    },
    validation: {
      validated: true,
      validator: 'workflow-validator-v3',
      validatedAt: AT,
      errors: []
    },
    content: contentFor(contract.profile),
    ...extra
  };
}

test('deliverable contract registry covers every declared workflow deliverable with content requirements', () => {
  const coverage = validateDeliverableContractCoverageV3();
  assert.equal(coverage.valid, true);
  assert.equal(coverage.registeredCount, coverage.expectedCount);
  assert.ok(coverage.expectedCount > 50);
  assert.deepEqual(coverage.missing, []);
  assert.deepEqual(coverage.orphaned, []);
  assert.deepEqual(coverage.invalidProfiles, []);
  const requirements = getStageDeliverableRequirementsV3('gov.procurement', 'tor-and-competition-check');
  assert.equal(requirements.length, 2);
  assert.ok(requirements.every((contract) => contract.requiredContent.length > 0));
});

test('artifact name and ready status alone cannot satisfy a V3 deliverable contract', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const result = validateDeliverableArtifactV3({
    workflowId: 'gov.procurement',
    stageId: 'need-and-authority',
    artifact: { key: 'need-memo', status: 'ready' },
    evidence
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.startsWith('contractId:')));
  assert.ok(result.errors.some((error) => error.startsWith('contractVersion:')));
  assert.ok(result.errors.includes('provenance:object-required'));
  assert.ok(result.errors.includes('validation:object-required'));
});

test('contract binding prevents replaying an artifact into a different workflow or stage', () => {
  const evidence = [ev('facts', 'facts')];
  const legalArtifact = artifactFor('gov.legal', 'facts', 'fact-summary', ['facts']);
  const replay = validateDeliverableArtifactV3({ workflowId: 'gov.correspondence', stageId: 'facts', artifact: legalArtifact, evidence });
  assert.equal(replay.valid, false);
  assert.ok(replay.errors.some((error) => error.startsWith('contractId:')));
  assert.ok(replay.errors.includes('workflowId:gov.correspondence-required'));
});

test('required stage evidence must be linked by both artifact and provenance', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority']);
  const result = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'need-and-authority', artifact, evidence });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('evidenceKeys:needJustification-required'));
  assert.ok(result.errors.includes('provenance.sourceEvidenceKeys:needJustification-required'));
});

test('artifact cannot cite unknown or invalid evidence keys', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification', 'ghostEvidence']);
  const result = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'need-and-authority', artifact, evidence });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('evidenceKeys:ghostEvidence-unknown-or-invalid'));
  assert.ok(result.errors.includes('provenance.sourceEvidenceKeys:ghostEvidence-unknown-or-invalid'));
});

test('content profile is enforced for drafts, sheets, and completed checklists', () => {
  const draft = artifactFor('gov.correspondence', 'draft', 'official-letter-draft', [], { content: {} });
  const draftResult = validateDeliverableArtifactV3({ workflowId: 'gov.correspondence', stageId: 'draft', artifact: draft, evidence: [] });
  assert.equal(draftResult.valid, false);
  assert.ok(draftResult.errors.includes('content.body:required'));

  const sheetEvidence = [ev('priceEvidence', 'price', true, true)];
  const sheet = artifactFor('gov.procurement', 'market-and-standard-price', 'market-price-evidence-sheet', ['priceEvidence'], { content: { rows: [] } });
  const sheetResult = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'market-and-standard-price', artifact: sheet, evidence: sheetEvidence });
  assert.equal(sheetResult.valid, false);
  assert.ok(sheetResult.errors.includes('content.rows:non-empty-array-required'));
  assert.ok(sheetResult.errors.includes('content.methodology-or-basis:required'));

  const checklist = artifactFor('gov.procurement', 'approval-and-publication', 'approval-publication-checklist', ['approvalAuthority', 'approvedDocuments'], { content: { items: [{ id: 'C1', status: 'pending' }] } });
  const checklistResult = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'approval-and-publication', artifact: checklist, evidence: [ev('approvalAuthority', 'a'), ev('approvedDocuments', 'd')], input: { approvals: [{ id: 'A', workflowId: 'gov.procurement', stageId: 'approval-and-publication', approved: true }] } });
  assert.equal(checklistResult.valid, false);
  assert.ok(checklistResult.errors.includes('content.items:completed-non-empty-array-required'));
});

test('unresolved items and validation errors prevent a final artifact from passing', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification'], {
    unresolvedItems: ['ยังไม่ยืนยันผู้มีอำนาจ'],
    validation: { validated: true, validator: 'workflow-validator-v3', validatedAt: AT, errors: ['missing-authority'] }
  });
  const result = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'need-and-authority', artifact, evidence });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('unresolvedItems:must-be-empty'));
  assert.ok(result.errors.includes('validation.errors:must-be-empty'));
});

test('validation timestamp cannot precede artifact generation', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification'], {
    provenance: { generatedBy: 'govprompt-v7', generatedAt: LATER, sourceEvidenceKeys: ['missionAuthority', 'needJustification'] },
    validation: { validated: true, validator: 'workflow-validator-v3', validatedAt: AT, errors: [] }
  });
  const result = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'need-and-authority', artifact, evidence });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('validation.validatedAt:must-not-precede-generation'));
});

test('human-approval stage requires exact approval ID, approver identity, and approval timestamp after validation', () => {
  const evidence = [ev('currentProcurementRule', 'rule', true, true), ev('methodDecisionFacts', 'facts')];
  const approval = { id: 'APP-77', workflowId: 'gov.procurement', stageId: 'method-selection', approved: true };
  const artifact = artifactFor('gov.procurement', 'method-selection', 'procurement-method-recommendation', ['currentProcurementRule', 'methodDecisionFacts']);
  const blocked = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'method-selection', artifact, evidence, input: { approvals: [approval] } });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.errors.includes('signoffs:matching-stage-approval-required'));

  const badTime = { ...artifact, signoffs: [{ workflowId: 'gov.procurement', stageId: 'method-selection', approvalId: 'APP-77', approved: true, approvedBy: 'authorized-officer', approvedAt: '2026-08-15T05:29:00.000Z' }] };
  const badTimeResult = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'method-selection', artifact: badTime, evidence, input: { approvals: [approval] } });
  assert.equal(badTimeResult.valid, false);
  assert.ok(badTimeResult.errors.includes('signoffs.approvedAt:must-not-precede-validation'));

  const signed = { ...artifact, signoffs: [{ workflowId: 'gov.procurement', stageId: 'method-selection', approvalId: 'APP-77', approved: true, approvedBy: 'authorized-officer', approvedAt: LATER }] };
  const passed = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'method-selection', artifact: signed, evidence, input: { approvals: [approval] } });
  assert.equal(passed.valid, true);
});

test('case-bound artifact cannot be reused across cases', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification'], { caseId: 'CASE-A' });
  const result = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'need-and-authority', artifact, evidence, input: { caseId: 'CASE-B' } });
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('caseId:CASE-B-required'));
});

test('duplicate artifact keys are rejected as ambiguous stage evidence', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']);
  const result = validateStageDeliverablesV3({ workflowId: 'gov.procurement', stageId: 'need-and-authority', artifacts: [artifact, { ...artifact }], evidence });
  assert.equal(result.valid, false);
  assert.equal(result.status, 'blocked-deliverable-contract');
  assert.ok(result.invalidArtifacts[0].errors.includes('artifact:duplicate-key'));
});

test('V3 execution fails closed when stage evidence is ready but deliverable contract is missing', () => {
  const evidence = [ev('missionAuthority', 'authority', true, true), ev('needJustification', 'need')];
  const result = executeGovernmentWorkflowV3({ workflowId: 'gov.procurement', evidence, artifacts: [] });
  assert.equal(result.status, 'blocked-missing-deliverables');
  assert.equal(result.governance.failClosed, true);
  assert.deepEqual(result.deliverableValidation.missingArtifacts, ['need-memo']);
});

test('V3 transition advances exactly one stage and audit records contract IDs but not raw evidence values', () => {
  const evidence = [ev('missionAuthority', 'SECRET_AUTH_VALUE', true, true), ev('needJustification', 'SECRET_NEED_VALUE')];
  const artifact = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']);
  const result = transitionGovernmentWorkflowV3({ workflowId: 'gov.procurement', evidence, artifacts: [artifact], actor: 'procurement-officer', at: AT });
  assert.equal(result.transitioned, true);
  assert.deepEqual(result.state.completedStages, ['need-and-authority']);
  assert.equal(result.state.currentStageId, 'plan-and-budget');
  assert.equal(result.state.deliverableContractVersion, DELIVERABLE_CONTRACT_SCHEMA_VERSION);
  assert.doesNotMatch(JSON.stringify(result.state.transitionLog), /SECRET_AUTH_VALUE|SECRET_NEED_VALUE/);
  assert.deepEqual(result.state.transitionLog[0].evidenceKeys.sort(), ['missionAuthority', 'needJustification'].sort());
  assert.deepEqual(result.state.transitionLog[0].contractIds, [artifact.contractId]);
});

test('cross-workflow handoff stays blocked until every required artifact passes its owner-stage contract', () => {
  const evidence = [
    ev('missionAuthority', 'authority', true, true),
    ev('needJustification', 'need'),
    ev('planLinkage', 'plan'),
    ev('fundingSource', 'fund'),
    ev('budgetAvailability', true)
  ];
  const needMemo = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']);
  const invalidPlanCheck = { key: 'plan-budget-check', status: 'ready' };
  const blocked = buildStageHandoffContractsV3('gov.procurement', 'plan-and-budget', [needMemo, invalidPlanCheck], evidence, {});
  const blockedProject = blocked.find((handoff) => handoff.targetWorkflowId === 'gov.project');
  assert.equal(blockedProject.status, 'blocked-handoff-deliverable-contract');

  const planCheck = artifactFor('gov.procurement', 'plan-and-budget', 'plan-budget-check', ['planLinkage', 'fundingSource', 'budgetAvailability']);
  const awaitingConfirmation = buildStageHandoffContractsV3('gov.procurement', 'plan-and-budget', [needMemo, planCheck], evidence, {});
  assert.ok(awaitingConfirmation.every((handoff) => handoff.status === 'awaiting-human-handoff-confirmation'));
  assert.ok(awaitingConfirmation.every((handoff) => handoff.humanConfirmationRequired && !handoff.humanConfirmed));
  assert.ok(awaitingConfirmation.every((handoff) => handoff.payload.artifactKeys.length === 0));

  const ready = buildStageHandoffContractsV3('gov.procurement', 'plan-and-budget', [needMemo, planCheck], evidence, {
    handoffConfirmations: [
      { sourceWorkflowId: 'gov.procurement', sourceStageId: 'plan-and-budget', targetWorkflowId: 'gov.project', confirmed: true },
      { sourceWorkflowId: 'gov.procurement', sourceStageId: 'plan-and-budget', targetWorkflowId: 'gov.finance', confirmed: true }
    ]
  });
  assert.ok(ready.every((handoff) => handoff.status === 'ready'));
  assert.ok(ready.every((handoff) => handoff.payload.artifactKeys.length > 0));
  assert.ok(ready.every((handoff) => handoff.payload.contractIds.length > 0));
});

test('cross-workflow handoff rejects duplicate required artifact keys instead of last-write-wins', () => {
  const evidence = [ev('needJustification', 'need'), ev('planLinkage', 'plan'), ev('fundingSource', 'fund'), ev('budgetAvailability', true), ev('missionAuthority', 'authority', true, true)];
  const needMemo = artifactFor('gov.procurement', 'need-and-authority', 'need-memo', ['missionAuthority', 'needJustification']);
  const planCheck = artifactFor('gov.procurement', 'plan-and-budget', 'plan-budget-check', ['planLinkage', 'fundingSource', 'budgetAvailability']);
  const result = buildStageHandoffContractsV3('gov.procurement', 'plan-and-budget', [needMemo, planCheck, { ...planCheck }], evidence, {});
  assert.ok(result.every((handoff) => handoff.status === 'blocked-handoff-deliverable-contract'));
  assert.ok(result.every((handoff) => handoff.invalidDeliverables.some((item) => item.artifactKey === 'plan-budget-check' && item.errors.includes('artifact:duplicate-key'))));
});

test('record profile permits a true no-activity record only with an explicit reason', () => {
  const base = artifactFor('gov.procurement', 'bid-clarification', 'clarification-log', [], { content: { entries: [] } });
  const blocked = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'bid-clarification', artifact: base, evidence: [] });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.errors.includes('content.noActivityReason:required-when-empty'));
  const passed = validateDeliverableArtifactV3({ workflowId: 'gov.procurement', stageId: 'bid-clarification', artifact: { ...base, content: { entries: [], noActivityReason: 'ไม่มีข้อซักถามในช่วงที่กำหนด' } }, evidence: [] });
  assert.equal(passed.valid, true);
});

test('top-level workflow contract remains backward compatible while exposing V3 execution', () => {
  const result = runGovernmentWorkflow({ query: 'จัดซื้อรถขุด e-bidding', evidence: [{ official: true, verified: true, source: 'government-original' }] });
  assert.equal(result.status, 'workflow-ready');
  assert.ok(result.stateMachineV2);
  assert.ok(result.stateMachineV3);
  assert.ok(result.currentV3);
  assert.equal(result.currentV3.contractSchemaVersion, DELIVERABLE_CONTRACT_SCHEMA_VERSION);
});
