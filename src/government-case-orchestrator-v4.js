import { DEEP_WORKFLOWS } from './government-workflow-engine.js';
import {
  getStageDeliverableRequirementsV3,
  executeGovernmentWorkflowV3,
  transitionGovernmentWorkflowV3,
  buildStageHandoffContractsV3
} from './government-deliverable-contracts-v3.js';

export const CASE_ORCHESTRATOR_VERSION = '4.0';
export const DEFAULT_MAX_AUTO_TRANSITIONS_V4 = 100;

const ACTION_BY_STATUS = Object.freeze({
  'unknown-workflow': 'repair-workflow-classification',
  'blocked-invalid-state': 'repair-workflow-state',
  'blocked-invalid-transition': 'repair-workflow-state',
  'blocked-legacy-state-migration': 'migrate-workflow-state',
  'blocked-missing-evidence': 'acquire-evidence',
  'blocked-official-source': 'verify-official-evidence',
  'blocked-risk-review': 'perform-risk-review',
  'awaiting-human-approval': 'request-human-approval',
  'blocked-missing-deliverables': 'generate-deliverables',
  'blocked-deliverable-contract': 'repair-deliverables',
  ready: 'transition-ready',
  complete: 'complete'
});

const uniq = (values = []) => [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
const safeStage = (stage) => stage ? Object.freeze({ id: stage.id, title: stage.title }) : null;
const safeFinding = (finding) => Object.freeze({
  code: String(finding?.code || 'unknown-risk'),
  severity: String(finding?.severity || 'unknown'),
  message: String(finding?.message || '')
});

function stageDefinition(workflowId, stageId) {
  return (DEEP_WORKFLOWS[workflowId] || []).find((stage) => stage.id === stageId) || null;
}

function currentStateFrom(input, workflowId) {
  const map = input?.workflowStateV4 || input?.workflowStateV3 || input?.workflowStateV2 || input?.workflowState || {};
  return map?.[workflowId] ?? null;
}

function scopedArtifacts(artifacts, workflowId) {
  return (Array.isArray(artifacts) ? artifacts : []).filter((artifact) => !artifact?.workflowId || artifact.workflowId === workflowId);
}

function artifactStatusMap(execution) {
  const result = new Map();
  for (const key of execution?.deliverablesReady || []) result.set(String(key), 'valid');
  for (const key of execution?.deliverableValidation?.missingArtifacts || []) result.set(String(key), 'missing');
  for (const item of execution?.deliverableValidation?.invalidArtifacts || []) result.set(String(item.artifactKey), 'invalid');
  return result;
}

function buildDeliverableWorkOrders(workflowId, stageId, execution) {
  if (!stageId) return [];
  const statusMap = artifactStatusMap(execution);
  return getStageDeliverableRequirementsV3(workflowId, stageId).map((contract) => Object.freeze({
    artifactKey: contract.artifactKey,
    contractId: contract.id,
    contractVersion: contract.schemaVersion,
    profile: contract.profile,
    requiredContent: [...contract.requiredContent],
    requiredEvidence: [...contract.requiredEvidence],
    requiresSignoff: contract.requiresSignoff,
    status: statusMap.get(contract.artifactKey) || 'required'
  }));
}

function actionForStatus(status) {
  return ACTION_BY_STATUS[status] || 'resolve-workflow-blocker';
}

function nextInputsFor(execution, legacyMigrationRequired = false) {
  return uniq([
    ...(legacyMigrationRequired ? ['migrate-workflow-state'] : []),
    ...(execution?.nextRequestedInputs || []),
    ...(execution?.missingEvidence || []).map((key) => `evidence:${key}`),
    ...(execution?.missingOfficialEvidence || []).map((key) => `official-evidence:${key}`),
    ...(execution?.deliverableValidation?.missingArtifacts || []).map((key) => `artifact:${key}`),
    ...(execution?.deliverableValidation?.invalidArtifacts || []).map((item) => `artifact-contract:${item.artifactKey}`)
  ]);
}

function approvalRequestFor(workflowId, execution, workflowStatus) {
  if (workflowStatus !== 'awaiting-human-approval' || !execution?.currentStage) return null;
  return Object.freeze({
    workflowId,
    stageId: execution.currentStage.id,
    required: true,
    action: 'human-review-and-approve',
    autoApprovalAllowed: false
  });
}

function riskWorkFor(workflowId, execution, workflowStatus) {
  if (workflowStatus !== 'blocked-risk-review') return null;
  return Object.freeze({
    workflowId,
    stageId: execution?.currentStage?.id || null,
    reviewRequired: Boolean(execution?.riskReviewRequired),
    findings: Object.freeze((execution?.unresolvedRiskFindings || execution?.riskFindings || []).map(safeFinding)),
    resolutionMustBeEvidenceBacked: true
  });
}

function safeExecutionSummary(execution, workflowStatus) {
  return Object.freeze({
    status: workflowStatus || execution?.status || 'unknown',
    currentStage: safeStage(execution?.currentStage),
    completedStages: Object.freeze([...(execution?.completedStages || [])]),
    missingEvidence: Object.freeze([...(execution?.missingEvidence || [])]),
    missingOfficialEvidence: Object.freeze([...(execution?.missingOfficialEvidence || [])]),
    deliverablesReady: Object.freeze([...(execution?.deliverablesReady || [])]),
    unresolvedRiskCodes: Object.freeze((execution?.unresolvedRiskFindings || []).map((finding) => String(finding.code))),
    failClosed: Boolean(execution?.governance?.failClosed) || workflowStatus === 'blocked-legacy-state-migration'
  });
}

export function buildGovernmentWorkOrderV4({ workflowId, state = null, completedStages = [], evidence = [], artifacts = [], input = {} } = {}) {
  const workflowArtifacts = scopedArtifacts(artifacts, workflowId);
  const execution = executeGovernmentWorkflowV3({ workflowId, state, completedStages, evidence, artifacts: workflowArtifacts, input });
  const legacyMigrationRequired = !state && Array.isArray(completedStages) && completedStages.length > 0 && !['blocked-invalid-transition', 'unknown-workflow'].includes(execution?.status);
  const workflowStatus = legacyMigrationRequired ? 'blocked-legacy-state-migration' : (execution?.status || 'unknown');
  const action = actionForStatus(workflowStatus);
  const stageId = execution?.currentStage?.id || null;
  const stage = stageId ? stageDefinition(workflowId, stageId) : null;
  const deliverableWorkOrders = buildDeliverableWorkOrders(workflowId, stageId, execution);
  const handoffs = stageId ? buildStageHandoffContractsV3(workflowId, stageId, workflowArtifacts, evidence, input) : [];

  return Object.freeze({
    orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
    caseId: input?.caseId || state?.caseId || null,
    workflowId,
    workflowStatus,
    action,
    currentStage: safeStage(stage || execution?.currentStage),
    completedStages: Object.freeze([...(execution?.completedStages || [])]),
    requiredEvidence: Object.freeze([...(stage?.requiredEvidence || [])]),
    missingEvidence: Object.freeze([...(execution?.missingEvidence || [])]),
    missingOfficialEvidence: Object.freeze([...(execution?.missingOfficialEvidence || [])]),
    deliverableWorkOrders: Object.freeze(deliverableWorkOrders),
    approvalRequest: approvalRequestFor(workflowId, execution, workflowStatus),
    riskWork: riskWorkFor(workflowId, execution, workflowStatus),
    handoffs: Object.freeze(handoffs),
    nextInputs: Object.freeze(nextInputsFor(execution, legacyMigrationRequired)),
    execution: safeExecutionSummary(execution, workflowStatus),
    governance: Object.freeze({
      failClosed: Boolean(execution?.governance?.failClosed) || !['transition-ready', 'complete'].includes(action),
      noFabrication: true,
      piiMinimization: true,
      rawEvidenceValuesReturned: false,
      humanApprovalRequiredWhenDeclared: true,
      autoApprovalAllowed: false,
      deliverableContractsRequired: true,
      auditTrailRequired: true,
      legacyStateMigrationRequired: legacyMigrationRequired
    })
  });
}

export function advanceGovernmentWorkflowV4({ workflowId, state = null, completedStages = [], evidence = [], artifacts = [], input = {}, actor = 'system-orchestrator', at = null } = {}) {
  const workOrder = buildGovernmentWorkOrderV4({ workflowId, state, completedStages, evidence, artifacts, input });
  if (workOrder.action !== 'transition-ready') {
    return Object.freeze({
      orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
      advanced: false,
      workflowId,
      status: workOrder.workflowStatus,
      state,
      workOrder
    });
  }

  const workflowArtifacts = scopedArtifacts(artifacts, workflowId);
  const transitioned = transitionGovernmentWorkflowV3({ workflowId, state, evidence, artifacts: workflowArtifacts, input, actor, at });
  if (!transitioned.transitioned) {
    return Object.freeze({
      orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
      advanced: false,
      workflowId,
      status: transitioned.status,
      state: transitioned.state || state,
      workOrder: buildGovernmentWorkOrderV4({ workflowId, state: transitioned.state || state, evidence, artifacts, input })
    });
  }

  return Object.freeze({
    orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
    advanced: true,
    workflowId,
    status: transitioned.status,
    state: transitioned.state,
    transition: Object.freeze({
      completedStageId: workOrder.currentStage?.id || null,
      nextStageId: transitioned.state?.currentStageId || null,
      contractIds: Object.freeze([...(transitioned.state?.transitionLog?.at(-1)?.contractIds || [])])
    }),
    handoffs: Object.freeze([...(transitioned.handoffContracts || [])]),
    workOrder: buildGovernmentWorkOrderV4({ workflowId, state: transitioned.state, evidence, artifacts, input })
  });
}

export function driveGovernmentWorkflowV4({ workflowId, state = null, completedStages = [], evidence = [], artifacts = [], input = {}, actor = 'system-orchestrator', at = null, maxTransitions = DEFAULT_MAX_AUTO_TRANSITIONS_V4 } = {}) {
  const limit = Number.isInteger(maxTransitions) && maxTransitions > 0 ? maxTransitions : DEFAULT_MAX_AUTO_TRANSITIONS_V4;
  let currentState = state;
  let currentCompletedStages = completedStages;
  const transitions = [];

  for (let count = 0; count < limit; count += 1) {
    const workOrder = buildGovernmentWorkOrderV4({ workflowId, state: currentState, completedStages: currentCompletedStages, evidence, artifacts, input });
    if (workOrder.action !== 'transition-ready') {
      return Object.freeze({
        orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
        workflowId,
        status: workOrder.workflowStatus,
        state: currentState,
        transitions: Object.freeze(transitions),
        transitionCount: transitions.length,
        stoppedBy: workOrder.action,
        workOrder,
        bounded: true
      });
    }

    const advanced = advanceGovernmentWorkflowV4({ workflowId, state: currentState, completedStages: currentCompletedStages, evidence, artifacts, input, actor, at });
    if (!advanced.advanced) {
      return Object.freeze({
        orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
        workflowId,
        status: advanced.status,
        state: advanced.state,
        transitions: Object.freeze(transitions),
        transitionCount: transitions.length,
        stoppedBy: advanced.workOrder?.action || 'transition-blocked',
        workOrder: advanced.workOrder,
        bounded: true
      });
    }

    currentState = advanced.state;
    currentCompletedStages = [];
    transitions.push(advanced.transition);
    if (advanced.workOrder.action === 'complete') {
      return Object.freeze({
        orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
        workflowId,
        status: 'complete',
        state: currentState,
        transitions: Object.freeze(transitions),
        transitionCount: transitions.length,
        stoppedBy: 'complete',
        workOrder: advanced.workOrder,
        bounded: true
      });
    }
  }

  const workOrder = buildGovernmentWorkOrderV4({ workflowId, state: currentState, evidence, artifacts, input });
  return Object.freeze({
    orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
    workflowId,
    status: 'blocked-transition-limit',
    state: currentState,
    transitions: Object.freeze(transitions),
    transitionCount: transitions.length,
    stoppedBy: 'transition-limit',
    workOrder,
    bounded: true,
    governance: Object.freeze({ failClosed: true, maxTransitions: limit })
  });
}

function stateMapWith(state, workflowId, workflowState) {
  return { ...(state || {}), ...(workflowState ? { [workflowId]: workflowState } : {}) };
}

function aggregateCaseStatus(workOrders) {
  if (!workOrders.length) return 'needs-intent';
  if (workOrders.every((workOrder) => workOrder.action === 'complete')) return 'complete';
  if (workOrders.some((workOrder) => workOrder.action === 'transition-ready')) return 'ready-to-advance';
  return 'blocked-action-required';
}

export function runGovernmentCaseV4({ input = {}, workflowIds = [], evidence = [], artifacts = [], state = null } = {}) {
  const ids = uniq(workflowIds);
  const caseState = state || input?.workflowStateV4 || input?.workflowStateV3 || input?.workflowStateV2 || input?.workflowState || {};
  const workflows = ids.map((workflowId) => buildGovernmentWorkOrderV4({
    workflowId,
    state: currentStateFrom({ ...input, workflowStateV4: caseState }, workflowId),
    evidence,
    artifacts,
    input
  }));
  const handoffGraph = workflows.flatMap((workOrder) => workOrder.handoffs || []);
  const status = aggregateCaseStatus(workflows);

  return Object.freeze({
    orchestratorVersion: CASE_ORCHESTRATOR_VERSION,
    caseId: input?.caseId || null,
    status,
    workflows: Object.freeze(workflows),
    handoffGraph: Object.freeze(handoffGraph),
    readyHandoffs: Object.freeze(handoffGraph.filter((handoff) => handoff.status === 'ready')),
    blockedHandoffs: Object.freeze(handoffGraph.filter((handoff) => handoff.status !== 'ready')),
    nextActions: Object.freeze(workflows.filter((workOrder) => workOrder.action !== 'complete').map((workOrder) => Object.freeze({ workflowId: workOrder.workflowId, stageId: workOrder.currentStage?.id || null, action: workOrder.action }))),
    readyArtifactKeys: Object.freeze(uniq(workflows.flatMap((workOrder) => workOrder.execution.deliverablesReady))),
    governance: Object.freeze({
      failClosed: status !== 'complete',
      noFabrication: true,
      piiMinimization: true,
      rawEvidenceValuesReturned: false,
      autoApprovalAllowed: false,
      crossWorkflowAuditTrail: true,
      deliverableContractsRequired: true
    })
  });
}

export function driveGovernmentCaseV4({ input = {}, workflowIds = [], evidence = [], artifacts = [], state = null, actor = 'system-orchestrator', at = null, maxTransitionsPerWorkflow = DEFAULT_MAX_AUTO_TRANSITIONS_V4 } = {}) {
  const ids = uniq(workflowIds);
  let caseState = { ...(state || input?.workflowStateV4 || input?.workflowStateV3 || input?.workflowStateV2 || input?.workflowState || {}) };
  const results = [];

  for (const workflowId of ids) {
    const result = driveGovernmentWorkflowV4({
      workflowId,
      state: caseState[workflowId] || null,
      evidence,
      artifacts,
      input,
      actor,
      at,
      maxTransitions: maxTransitionsPerWorkflow
    });
    if (result.state) caseState = stateMapWith(caseState, workflowId, result.state);
    results.push(result);
  }

  const caseView = runGovernmentCaseV4({ input, workflowIds: ids, evidence, artifacts, state: caseState });
  return Object.freeze({
    ...caseView,
    state: Object.freeze(caseState),
    workflowRuns: Object.freeze(results),
    transitionCount: results.reduce((sum, result) => sum + Number(result.transitionCount || 0), 0)
  });
}
