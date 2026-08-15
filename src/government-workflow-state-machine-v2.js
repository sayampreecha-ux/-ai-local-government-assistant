import { DEEP_WORKFLOWS, detectProcurementRisks } from './government-workflow-engine.js';
import { validateBudgetBalance } from './budget-balance-validator.js';

export const WORKFLOW_STATE_SCHEMA_VERSION = '2.0';

const OFFICIAL_EVIDENCE_KEYS = Object.freeze({
  'gov.procurement:need-and-authority': ['missionAuthority'],
  'gov.procurement:market-and-standard-price': ['priceEvidence'],
  'gov.procurement:method-selection': ['currentProcurementRule'],
  'gov.procurement:reference-price': ['referencePriceBasis'],
  'gov.budget-draft:budget-context': ['currentBudgetRule'],
  'gov.budget-draft:revenue-forecast': ['latestRevenueActuals'],
  'gov.budget-draft:plan-project-linkage': ['targetYearPlan'],
  'gov.finance:authority': ['financialAuthority'],
  'gov.finance:loan-debt': ['loanFacts'],
  'gov.legal:authoritative-sources': ['officialLegalSource'],
  'gov.legal:freshness-status': ['currentStatusEvidence'],
  'gov.project:authority': ['missionAuthority'],
  'gov.hr:current-rule': ['officialHrRule']
});

const RISK_REVIEW_STAGES = new Set([
  'gov.procurement:technical-requirements',
  'gov.procurement:tor-and-competition-check',
  'gov.budget-draft:risk-review',
  'gov.finance:fiscal-capacity',
  'gov.finance:loan-debt',
  'gov.legal:risk-options',
  'gov.project:risk',
  'gov.correspondence:pii',
  'gov.hr:eligibility',
  'gov.hr:financial-impact'
]);

export const CROSS_WORKFLOW_HANDOFFS_V2 = Object.freeze({
  'gov.procurement:plan-and-budget': [
    { targetWorkflowId: 'gov.project', requiredEvidence: ['needJustification', 'planLinkage'], requiredDeliverables: ['need-memo', 'plan-budget-check'] },
    { targetWorkflowId: 'gov.finance', requiredEvidence: ['fundingSource', 'budgetAvailability'], requiredDeliverables: ['plan-budget-check'] }
  ],
  'gov.budget-draft:revenue-forecast': [
    { targetWorkflowId: 'gov.finance', requiredEvidence: ['latestRevenueActuals', 'revenueForecastBasis'], requiredDeliverables: ['budget-revenue-forecast-sheet'] }
  ],
  'gov.budget-draft:plan-project-linkage': [
    { targetWorkflowId: 'gov.project', requiredEvidence: ['targetYearPlan', 'projectRequests'], requiredDeliverables: ['budget-plan-project-matrix'] }
  ],
  'gov.budget-draft:personnel-obligations': [
    { targetWorkflowId: 'gov.hr', requiredEvidence: ['personnelObligations'], requiredDeliverables: ['personnel-obligation-analysis'] },
    { targetWorkflowId: 'gov.finance', requiredEvidence: ['personnelObligations'], requiredDeliverables: ['personnel-obligation-analysis'] }
  ],
  'gov.budget-draft:budget-allocation': [
    { targetWorkflowId: 'gov.finance', requiredEvidence: ['allocationDraft'], requiredDeliverables: ['budget-allocation-sheet'] }
  ],
  'gov.finance:loan-debt': [
    { targetWorkflowId: 'gov.legal', requiredEvidence: ['loanFacts'], requiredDeliverables: ['loan-debt-analysis'] }
  ],
  'gov.project:budget-reasonableness': [
    { targetWorkflowId: 'gov.finance', requiredEvidence: ['budget', 'costBasis'], requiredDeliverables: ['budget-rationale'] }
  ],
  'gov.project:procurement-dependency': [
    { targetWorkflowId: 'gov.procurement', requiredEvidence: ['planLinkage', 'budget'], requiredDeliverables: ['procurement-dependency-map'] }
  ],
  'gov.hr:financial-impact': [
    { targetWorkflowId: 'gov.finance', requiredEvidence: [], requiredDeliverables: ['hr-financial-impact'] }
  ]
});

const keyOf = (value) => String(value?.key || value?.id || value?.type || '').trim();
const usableEvidence = (e) => Boolean(keyOf(e) && e?.value !== undefined && e?.value !== null && e?.valid !== false && e?.revoked !== true && e?.status !== 'pending-confirmation');
const officialEvidence = (e) => Boolean(usableEvidence(e) && e?.official === true && e?.verified === true && e?.fresh !== false && e?.current !== false);
const readyArtifact = (a) => Boolean(keyOf(a) && a?.revoked !== true && !['draft', 'incomplete', 'rejected'].includes(String(a?.status || 'ready').toLowerCase()));
const indexByKey = (items, predicate) => new Map((Array.isArray(items) ? items : []).filter(predicate).map((item) => [keyOf(item), item]));
const stageKey = (workflowId, stageId) => `${workflowId}:${stageId}`;

export function validateCompletedStagePrefixV2(workflowId, completedStages = []) {
  const ids = (DEEP_WORKFLOWS[workflowId] || []).map((stage) => stage.id);
  const list = Array.isArray(completedStages) ? completedStages : [];
  const duplicate = list.find((id, index) => list.indexOf(id) !== index) || null;
  const unknown = list.find((id) => !ids.includes(id)) || null;
  const mismatch = list.findIndex((id, index) => id !== ids[index]);
  return {
    valid: !duplicate && !unknown && mismatch === -1,
    duplicate,
    unknown,
    expectedStage: mismatch >= 0 ? ids[mismatch] : null,
    receivedStage: mismatch >= 0 ? list[mismatch] : null
  };
}

export function validateWorkflowStateV2(workflowId, state = null) {
  const stages = DEEP_WORKFLOWS[workflowId] || [];
  if (!state || typeof state !== 'object' || Array.isArray(state)) return { valid: false, reason: 'missing-state' };
  if (state.schemaVersion !== WORKFLOW_STATE_SCHEMA_VERSION) return { valid: false, reason: 'schema-version', expected: WORKFLOW_STATE_SCHEMA_VERSION, received: state.schemaVersion || null };
  if (state.workflowId !== workflowId) return { valid: false, reason: 'workflow-id', expected: workflowId, received: state.workflowId || null };

  const completedStages = Array.isArray(state.completedStages) ? state.completedStages : [];
  const prefix = validateCompletedStagePrefixV2(workflowId, completedStages);
  if (!prefix.valid) return { valid: false, reason: 'completed-stage-prefix', ...prefix };

  const expectedCurrentStageId = stages[completedStages.length]?.id || null;
  if ((state.currentStageId ?? null) !== expectedCurrentStageId) {
    return { valid: false, reason: 'current-stage', expected: expectedCurrentStageId, received: state.currentStageId ?? null };
  }

  const transitionLog = Array.isArray(state.transitionLog) ? state.transitionLog : [];
  if (transitionLog.length !== completedStages.length) {
    return { valid: false, reason: 'transition-log-length', expected: completedStages.length, received: transitionLog.length };
  }

  for (let index = 0; index < completedStages.length; index += 1) {
    const event = transitionLog[index];
    const expectedFrom = stages[index]?.id || null;
    const expectedTo = stages[index + 1]?.id || null;
    if (!event || event.type !== 'stage-transition' || event.workflowId !== workflowId || event.fromStageId !== expectedFrom || (event.toStageId ?? null) !== expectedTo) {
      return { valid: false, reason: 'transition-log-event', index, expectedFrom, expectedTo, received: event || null };
    }
  }

  return { valid: true, completedStages: [...completedStages], currentStageId: expectedCurrentStageId };
}

export function createWorkflowStateV2(workflowId, caseId = null) {
  const stages = DEEP_WORKFLOWS[workflowId] || [];
  return {
    schemaVersion: WORKFLOW_STATE_SCHEMA_VERSION,
    workflowId,
    caseId,
    status: stages.length ? 'active' : 'unknown-workflow',
    completedStages: [],
    currentStageId: stages[0]?.id || null,
    transitionLog: []
  };
}

function approvalFor(input, workflowId, stageId) {
  const approvals = Array.isArray(input?.approvals) ? input.approvals : [];
  return approvals.find((approval) => approval?.workflowId === workflowId && approval?.stageId === stageId && approval?.approved === true && approval?.revoked !== true) || null;
}

function riskReviewFor(input, workflowId, stageId) {
  const reviews = Array.isArray(input?.riskReviews) ? input.riskReviews : [];
  return reviews.find((review) => review?.workflowId === workflowId && review?.stageId === stageId && review?.completed === true && review?.revoked !== true) || null;
}

function riskResolutionFor(input, finding, evidenceIndex) {
  const resolutions = Array.isArray(input?.riskResolutions) ? input.riskResolutions : [];
  const resolution = resolutions.find((item) => item?.code === finding.code && item?.approved === true && item?.revoked !== true);
  if (!resolution || !['mitigated', 'false-positive'].includes(resolution.status) || !String(resolution.rationale || '').trim()) return null;
  const evidenceKeys = Array.isArray(resolution.evidenceKeys) ? resolution.evidenceKeys : [];
  if (!evidenceKeys.length || evidenceKeys.some((key) => !evidenceIndex.has(key))) return null;
  return resolution;
}

function handoffContracts(workflowId, stageId, evidenceIndex, artifactIndex) {
  return (CROSS_WORKFLOW_HANDOFFS_V2[stageKey(workflowId, stageId)] || []).map((definition) => {
    const missingEvidence = definition.requiredEvidence.filter((key) => !evidenceIndex.has(key));
    const missingDeliverables = definition.requiredDeliverables.filter((key) => !artifactIndex.has(key));
    return {
      ...definition,
      sourceWorkflowId: workflowId,
      sourceStageId: stageId,
      status: missingEvidence.length ? 'blocked-handoff-evidence' : missingDeliverables.length ? 'blocked-handoff-deliverables' : 'ready',
      missingEvidence,
      missingDeliverables,
      payload: {
        evidenceKeys: definition.requiredEvidence.filter((key) => evidenceIndex.has(key)),
        artifactKeys: definition.requiredDeliverables.filter((key) => artifactIndex.has(key))
      }
    };
  });
}

function budgetBalancePayload(evidenceIndex, input) {
  const evidenceValue = evidenceIndex.get('budgetTotals')?.value;
  if (evidenceValue && typeof evidenceValue === 'object') return evidenceValue;
  if (input?.budgetBalance && typeof input.budgetBalance === 'object') return input.budgetBalance;
  if (input?.budgetTotals && typeof input.budgetTotals === 'object') return input.budgetTotals;
  return {};
}

export function evaluateWorkflowStageV2(workflowId, stageIndex, { evidence = [], artifacts = [], input = {} } = {}) {
  const stage = DEEP_WORKFLOWS[workflowId]?.[stageIndex];
  if (!stage) return { status: 'complete', currentStage: null, missingEvidence: [], missingOfficialEvidence: [], riskFindings: [], unresolvedRiskFindings: [], handoffContracts: [] };

  const evidenceIndex = indexByKey(evidence, usableEvidence);
  const artifactIndex = indexByKey(artifacts, readyArtifact);
  const missingEvidence = stage.requiredEvidence.filter((key) => !evidenceIndex.has(key));
  const officialKeys = OFFICIAL_EVIDENCE_KEYS[stageKey(workflowId, stage.id)] || [];
  const missingOfficialEvidence = officialKeys.filter((key) => !officialEvidence(evidenceIndex.get(key)));
  const riskReviewRequired = RISK_REVIEW_STAGES.has(stageKey(workflowId, stage.id));
  const riskReview = riskReviewRequired ? riskReviewFor(input, workflowId, stage.id) : null;
  const procurementRiskFindings = workflowId === 'gov.procurement' ? detectProcurementRisks(input) : [];
  const budgetBalanceValidation = workflowId === 'gov.budget-draft' && stage.id === 'budget-balance' && !missingEvidence.length
    ? validateBudgetBalance(budgetBalancePayload(evidenceIndex, input))
    : null;
  const riskFindings = [...procurementRiskFindings, ...(budgetBalanceValidation?.findings || [])];
  const applicableRiskCodes = Array.isArray(stage.riskChecks) ? stage.riskChecks : [];
  const unresolvedRiskFindings = workflowId === 'gov.budget-draft' && stage.id === 'budget-balance'
    ? [...riskFindings]
    : riskFindings.filter((finding) => applicableRiskCodes.includes(finding.code) && finding.severity === 'high' && !riskResolutionFor(input, finding, evidenceIndex));
  const approval = stage.humanApprovalRequired ? approvalFor(input, workflowId, stage.id) : null;

  let status = 'ready';
  if (missingEvidence.length) status = 'blocked-missing-evidence';
  else if (missingOfficialEvidence.length) status = 'blocked-official-source';
  else if (budgetBalanceValidation && !budgetBalanceValidation.valid) status = 'blocked-risk-review';
  else if (riskReviewRequired && !riskReview) status = 'blocked-risk-review';
  else if (unresolvedRiskFindings.length) status = 'blocked-risk-review';
  else if (stage.humanApprovalRequired && !approval) status = 'awaiting-human-approval';

  return {
    status,
    currentStage: stage,
    missingEvidence,
    missingOfficialEvidence,
    riskReviewRequired,
    riskReview,
    riskFindings,
    unresolvedRiskFindings,
    budgetBalanceValidation,
    approval,
    requiredDeliverables: stage.deliverables,
    handoffContracts: handoffContracts(workflowId, stage.id, evidenceIndex, artifactIndex)
  };
}

export function executeGovernmentWorkflowV2({ workflowId, state = null, completedStages = [], evidence = [], artifacts = [], input = {} } = {}) {
  const stages = DEEP_WORKFLOWS[workflowId];
  if (!stages) return { workflowId, status: 'unknown-workflow', unresolved: ['workflowId'] };
  if (state && !Array.isArray(state)) {
    const integrity = validateWorkflowStateV2(workflowId, state);
    if (!integrity.valid) {
      return { workflowId, status: 'blocked-invalid-state', completedStages: Array.isArray(state.completedStages) ? state.completedStages : [], stateIntegrity: integrity, nextRequestedInputs: ['repair-workflow-state'], governance: { failClosed: true, noFabrication: true, piiMinimization: true, auditTrailRequired: true } };
    }
  }

  const completed = state && !Array.isArray(state) ? state.completedStages || [] : completedStages;
  const prefix = validateCompletedStagePrefixV2(workflowId, completed);
  if (!prefix.valid) {
    return { workflowId, status: 'blocked-invalid-transition', completedStages: completed, transitionError: prefix, nextRequestedInputs: ['repair-workflow-state'], governance: { failClosed: true, noFabrication: true, piiMinimization: true, auditTrailRequired: true } };
  }
  if (completed.length === stages.length) {
    return { workflowId, status: 'complete', completedStages: [...completed], currentStage: null, deliverablesReady: stages.flatMap((stage) => stage.deliverables), transitionLog: state?.transitionLog || [], governance: { failClosed: false, noFabrication: true, piiMinimization: true, auditTrailRequired: true } };
  }

  const evaluation = evaluateWorkflowStageV2(workflowId, completed.length, { evidence, artifacts, input });
  return {
    workflowId,
    status: evaluation.status,
    currentStage: evaluation.currentStage,
    completedStages: [...completed],
    transitionLog: state?.transitionLog || [],
    missingEvidence: evaluation.missingEvidence,
    missingOfficialEvidence: evaluation.missingOfficialEvidence,
    riskReviewRequired: evaluation.riskReviewRequired,
    riskFindings: evaluation.riskFindings,
    unresolvedRiskFindings: evaluation.unresolvedRiskFindings,
    budgetBalanceValidation: evaluation.budgetBalanceValidation || null,
    approval: evaluation.approval,
    requiredDeliverables: evaluation.requiredDeliverables,
    deliverablesReady: evaluation.status === 'ready' ? evaluation.requiredDeliverables : [],
    handoffContracts: evaluation.handoffContracts,
    nextRequestedInputs: [
      ...evaluation.missingEvidence,
      ...evaluation.missingOfficialEvidence.map((key) => `official:${key}`),
      ...(evaluation.status === 'blocked-risk-review' ? ['risk-review-or-resolution'] : []),
      ...(evaluation.status === 'awaiting-human-approval' ? ['stage-specific-human-approval'] : [])
    ],
    governance: { failClosed: evaluation.status.startsWith('blocked-'), noFabrication: true, piiMinimization: true, auditTrailRequired: true, humanApprovalRequired: true }
  };
}

export function transitionGovernmentWorkflowV2({ workflowId, state = null, evidence = [], artifacts = [], input = {}, actor = 'human', at = null } = {}) {
  const currentState = state && !Array.isArray(state) ? state : createWorkflowStateV2(workflowId, input.caseId || null);
  const integrity = validateWorkflowStateV2(workflowId, currentState);
  if (!integrity.valid) {
    const execution = { workflowId, status: 'blocked-invalid-state', stateIntegrity: integrity, governance: { failClosed: true, noFabrication: true, piiMinimization: true, auditTrailRequired: true } };
    return { transitioned: false, status: execution.status, state: currentState, execution };
  }

  const execution = executeGovernmentWorkflowV2({ workflowId, state: currentState, evidence, artifacts, input });
  if (execution.status !== 'ready') return { transitioned: false, status: execution.status, state: currentState, execution };

  const artifactIndex = indexByKey(artifacts, readyArtifact);
  const missingDeliverables = execution.requiredDeliverables.filter((key) => !artifactIndex.has(key));
  if (missingDeliverables.length) return { transitioned: false, status: 'blocked-missing-deliverables', state: currentState, execution: { ...execution, missingDeliverables, governance: { ...execution.governance, failClosed: true } } };

  const completedStages = [...execution.completedStages, execution.currentStage.id];
  const nextStage = DEEP_WORKFLOWS[workflowId][completedStages.length] || null;
  const evidenceIndex = indexByKey(evidence, usableEvidence);
  const event = {
    type: 'stage-transition',
    workflowId,
    fromStageId: execution.currentStage.id,
    toStageId: nextStage?.id || null,
    actor: String(actor || 'human'),
    at: at || new Date().toISOString(),
    evidenceKeys: [...evidenceIndex.keys()],
    artifactKeys: [...execution.requiredDeliverables],
    approvalId: execution.approval?.id || null,
    riskCodes: execution.riskFindings.map((finding) => finding.code)
  };
  const nextState = {
    schemaVersion: WORKFLOW_STATE_SCHEMA_VERSION,
    workflowId,
    caseId: currentState.caseId || input.caseId || null,
    status: nextStage ? 'active' : 'complete',
    completedStages,
    currentStageId: nextStage?.id || null,
    transitionLog: [...(currentState.transitionLog || []), event]
  };
  return {
    transitioned: true,
    status: nextStage ? 'transitioned' : 'complete',
    state: nextState,
    handoffContracts: handoffContracts(workflowId, execution.currentStage.id, evidenceIndex, artifactIndex),
    next: executeGovernmentWorkflowV2({ workflowId, state: nextState, evidence, artifacts, input })
  };
}

export function buildCrossWorkflowCaseV2(input = {}, workflowIds = [], evidence = [], state = {}, artifacts = input.artifacts || []) {
  const workflows = [...new Set(workflowIds)].map((workflowId) => {
    const workflowState = state?.[workflowId];
    return executeGovernmentWorkflowV2({ workflowId, state: Array.isArray(workflowState) ? null : workflowState, completedStages: Array.isArray(workflowState) ? workflowState : [], evidence, artifacts, input });
  });
  const handoffGraph = workflows.flatMap((workflow) => workflow.handoffContracts || []);
  return {
    caseId: input.caseId || null,
    workflows,
    handoffGraph,
    readyHandoffs: handoffGraph.filter((handoff) => handoff.status === 'ready'),
    governance: { sharedEvidenceRegister: true, crossWorkflowAuditTrail: true, humanApprovalRequired: true, handoffPayloadMinimized: true }
  };
}
