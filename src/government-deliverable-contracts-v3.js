import { DEEP_WORKFLOWS } from './government-workflow-engine.js';
import {
  CROSS_WORKFLOW_HANDOFFS_V2,
  executeGovernmentWorkflowV2,
  transitionGovernmentWorkflowV2
} from './government-workflow-state-machine-v2.js';

export const DELIVERABLE_CONTRACT_SCHEMA_VERSION = '3.0';

const FINAL_STATUSES = new Set(['ready', 'approved', 'final', 'complete']);
const PENDING_STATUSES = new Set(['pending', 'todo', 'unknown', 'unresolved', 'draft', 'incomplete', 'rejected']);
const NON_EMPTY = (value) => typeof value === 'string' && value.trim().length > 0;
const keyOf = (value) => String(value?.key || value?.id || value?.type || '').trim();
const stageKey = (workflowId, stageId) => `${workflowId}:${stageId}`;
const contractKey = (workflowId, stageId, artifactKey) => `${workflowId}:${stageId}:${artifactKey}`;
const usableEvidence = (evidence) => Boolean(keyOf(evidence) && evidence?.value !== undefined && evidence?.value !== null && evidence?.valid !== false && evidence?.revoked !== true);
const indexByKey = (items, predicate = () => true) => new Map((Array.isArray(items) ? items : []).filter(predicate).map((item) => [keyOf(item), item]));
const validIsoDate = (value) => NON_EMPTY(value) && Number.isFinite(Date.parse(value));
const dateMs = (value) => validIsoDate(value) ? Date.parse(value) : null;
const artifactBelongsToContext = (artifact, workflowId, stageId = null) => Boolean(
  artifact &&
  (!artifact.workflowId || artifact.workflowId === workflowId) &&
  (!stageId || !artifact.stageId || artifact.stageId === stageId)
);
const scopeArtifactsForWorkflow = (artifacts, workflowId) => (Array.isArray(artifacts) ? artifacts : []).filter((artifact) => artifactBelongsToContext(artifact, workflowId));

export const DELIVERABLE_PROFILE_REQUIREMENTS_V3 = Object.freeze({
  draft: Object.freeze(['content.body']),
  checklist: Object.freeze(['content.items[]']),
  check: Object.freeze(['content.result|content.status|content.summary']),
  sheet: Object.freeze(['content.rows[]', 'content.methodology|content.basis']),
  matrix: Object.freeze(['content.rows[]']),
  map: Object.freeze(['content.items[]|content.links[]|content.nodes[]']),
  pack: Object.freeze(['content.documents[]']),
  record: Object.freeze(['content.entries[]|content.noActivityReason']),
  analysis: Object.freeze(['content.summary', 'content.findings[]|content.rows[]|content.analysis|content.recommendation|content.details']),
  structured: Object.freeze(['content.<meaningful-value>'])
});

function profileFor(artifactKey) {
  const key = String(artifactKey || '').toLowerCase();
  if (key.includes('draft')) return 'draft';
  if (key.includes('checklist')) return 'checklist';
  if (key.endsWith('-check') || key.includes('readiness')) return 'check';
  if (key.includes('sheet')) return 'sheet';
  if (key.includes('matrix')) return 'matrix';
  if (key.includes('map')) return 'map';
  if (key.includes('pack')) return 'pack';
  if (/(log|register|record|trail|list)$/.test(key) || key.includes('-log') || key.includes('-register') || key.includes('-record') || key.includes('-list')) return 'record';
  if (/(analysis|review|recommendation|report|rationale|framework|impact|risk|options)$/.test(key) || key.includes('-analysis') || key.includes('-review') || key.includes('-recommendation') || key.includes('-report') || key.includes('-rationale') || key.includes('-framework') || key.includes('-impact') || key.includes('-risk')) return 'analysis';
  return 'structured';
}

function buildContractRegistry() {
  const contracts = {};
  for (const [workflowId, stages] of Object.entries(DEEP_WORKFLOWS)) {
    for (const stage of stages) {
      for (const artifactKey of stage.deliverables) {
        const id = contractKey(workflowId, stage.id, artifactKey);
        const profile = profileFor(artifactKey);
        contracts[id] = Object.freeze({
          id,
          schemaVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION,
          workflowId,
          stageId: stage.id,
          artifactKey,
          profile,
          requiredContent: DELIVERABLE_PROFILE_REQUIREMENTS_V3[profile],
          requiredEvidence: Object.freeze([...(stage.requiredEvidence || [])]),
          requiresSignoff: Boolean(stage.humanApprovalRequired)
        });
      }
    }
  }
  return Object.freeze(contracts);
}

export const DELIVERABLE_CONTRACTS_V3 = buildContractRegistry();

export function listDeliverableContractsV3() {
  return Object.values(DELIVERABLE_CONTRACTS_V3);
}

export function getDeliverableContractV3(workflowId, stageId, artifactKey) {
  return DELIVERABLE_CONTRACTS_V3[contractKey(workflowId, stageId, artifactKey)] || null;
}

export function getStageDeliverableRequirementsV3(workflowId, stageId) {
  const stage = (DEEP_WORKFLOWS[workflowId] || []).find((item) => item.id === stageId);
  if (!stage) return [];
  return stage.deliverables.map((artifactKey) => getDeliverableContractV3(workflowId, stageId, artifactKey)).filter(Boolean);
}

export function validateDeliverableContractCoverageV3() {
  const expected = [];
  const missing = [];
  const invalidProfiles = [];
  for (const [workflowId, stages] of Object.entries(DEEP_WORKFLOWS)) {
    for (const stage of stages) {
      for (const artifactKey of stage.deliverables) {
        const id = contractKey(workflowId, stage.id, artifactKey);
        expected.push(id);
        const contract = DELIVERABLE_CONTRACTS_V3[id];
        if (!contract) missing.push(id);
        else if (!Array.isArray(contract.requiredContent) || contract.requiredContent.length === 0) invalidProfiles.push(id);
      }
    }
  }
  const registered = Object.keys(DELIVERABLE_CONTRACTS_V3);
  const orphaned = registered.filter((id) => !expected.includes(id));
  return {
    valid: missing.length === 0 && orphaned.length === 0 && invalidProfiles.length === 0 && registered.length === expected.length,
    expectedCount: expected.length,
    registeredCount: registered.length,
    missing,
    orphaned,
    invalidProfiles
  };
}

function meaningfulValue(value) {
  if (NON_EMPTY(value)) return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.values(value).some(meaningfulValue);
  return false;
}

function validChecklistItems(items) {
  return Array.isArray(items) && items.length > 0 && items.every((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
    const status = String(item.status || '').toLowerCase();
    return NON_EMPTY(status) && !PENDING_STATUSES.has(status);
  });
}

function contentProfileErrors(profile, content) {
  const errors = [];
  if (!content || typeof content !== 'object' || Array.isArray(content)) return ['content:object-required'];

  if (profile === 'draft') {
    if (!NON_EMPTY(content.body)) errors.push('content.body:required');
    return errors;
  }

  if (profile === 'checklist') {
    if (!validChecklistItems(content.items)) errors.push('content.items:completed-non-empty-array-required');
    return errors;
  }

  if (profile === 'check') {
    const result = content.result ?? content.status ?? content.summary;
    if (!meaningfulValue(result)) errors.push('content.result-or-status:required');
    if (NON_EMPTY(result) && PENDING_STATUSES.has(String(result).toLowerCase())) errors.push('content.result-or-status:must-be-final');
    return errors;
  }

  if (profile === 'sheet') {
    if (!Array.isArray(content.rows) || content.rows.length === 0) errors.push('content.rows:non-empty-array-required');
    if (!NON_EMPTY(content.methodology) && !NON_EMPTY(content.basis)) errors.push('content.methodology-or-basis:required');
    return errors;
  }

  if (profile === 'matrix') {
    if (!Array.isArray(content.rows) || content.rows.length === 0) errors.push('content.rows:non-empty-array-required');
    return errors;
  }

  if (profile === 'map') {
    const hasItems = Array.isArray(content.items) && content.items.length > 0;
    const hasLinks = Array.isArray(content.links) && content.links.length > 0;
    const hasNodes = Array.isArray(content.nodes) && content.nodes.length > 0;
    if (!hasItems && !hasLinks && !hasNodes) errors.push('content.items-links-or-nodes:non-empty-array-required');
    return errors;
  }

  if (profile === 'pack') {
    if (!Array.isArray(content.documents) || content.documents.length === 0) errors.push('content.documents:non-empty-array-required');
    return errors;
  }

  if (profile === 'record') {
    if (!Array.isArray(content.entries)) errors.push('content.entries:array-required');
    else if (content.entries.length === 0 && !NON_EMPTY(content.noActivityReason)) errors.push('content.noActivityReason:required-when-empty');
    return errors;
  }

  if (profile === 'analysis') {
    if (!NON_EMPTY(content.summary)) errors.push('content.summary:required');
    const hasDetail = (Array.isArray(content.findings) && content.findings.length > 0) ||
      (Array.isArray(content.rows) && content.rows.length > 0) ||
      NON_EMPTY(content.analysis) || NON_EMPTY(content.recommendation) ||
      (content.details && typeof content.details === 'object' && Object.keys(content.details).length > 0);
    if (!hasDetail) errors.push('content.analysis-detail:required');
    return errors;
  }

  if (!Object.values(content).some(meaningfulValue)) errors.push('content:meaningful-value-required');
  return errors;
}

function stageDefinition(workflowId, stageId) {
  return (DEEP_WORKFLOWS[workflowId] || []).find((stage) => stage.id === stageId) || null;
}

function artifactOwnerStage(workflowId, artifactKey) {
  const matches = (DEEP_WORKFLOWS[workflowId] || []).filter((stage) => stage.deliverables.includes(artifactKey));
  return matches.length === 1 ? matches[0] : null;
}

function approvalFor(input, workflowId, stageId) {
  const approvals = Array.isArray(input?.approvals) ? input.approvals : [];
  return approvals.find((approval) => approval?.workflowId === workflowId && approval?.stageId === stageId && approval?.approved === true && approval?.revoked !== true) || null;
}

export function validateDeliverableArtifactV3({ workflowId, stageId, artifact, evidence = [], input = {} } = {}) {
  const artifactKey = keyOf(artifact);
  const contract = getDeliverableContractV3(workflowId, stageId, artifactKey);
  const errors = [];
  const evidenceIndex = indexByKey(evidence, usableEvidence);

  if (!contract) {
    return { valid: false, status: 'invalid-deliverable-contract', artifactKey, errors: ['contract:not-registered'], contract: null };
  }

  if (artifact?.contractId !== contract.id) errors.push(`contractId:${contract.id}-required`);
  if (artifact?.contractVersion !== DELIVERABLE_CONTRACT_SCHEMA_VERSION) errors.push(`contractVersion:${DELIVERABLE_CONTRACT_SCHEMA_VERSION}-required`);
  if (artifact?.workflowId !== workflowId) errors.push(`workflowId:${workflowId}-required`);
  if (artifact?.stageId !== stageId) errors.push(`stageId:${stageId}-required`);
  if (input?.caseId != null && artifact?.caseId !== input.caseId) errors.push(`caseId:${input.caseId}-required`);
  if (!FINAL_STATUSES.has(String(artifact?.status || '').toLowerCase())) errors.push('status:final-required');
  if (Array.isArray(artifact?.unresolvedItems) && artifact.unresolvedItems.length > 0) errors.push('unresolvedItems:must-be-empty');

  const evidenceKeys = Array.isArray(artifact?.evidenceKeys) ? [...new Set(artifact.evidenceKeys.map(String))] : [];
  for (const requiredKey of contract.requiredEvidence) {
    if (!evidenceKeys.includes(requiredKey)) errors.push(`evidenceKeys:${requiredKey}-required`);
  }
  for (const linkedKey of evidenceKeys) {
    if (!evidenceIndex.has(linkedKey)) errors.push(`evidenceKeys:${linkedKey}-unknown-or-invalid`);
  }

  const provenance = artifact?.provenance;
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) errors.push('provenance:object-required');
  else {
    if (!NON_EMPTY(provenance.generatedBy)) errors.push('provenance.generatedBy:required');
    if (!validIsoDate(provenance.generatedAt)) errors.push('provenance.generatedAt:valid-iso-date-required');
    const sourceEvidenceKeys = Array.isArray(provenance.sourceEvidenceKeys) ? [...new Set(provenance.sourceEvidenceKeys.map(String))] : [];
    for (const requiredKey of contract.requiredEvidence) {
      if (!sourceEvidenceKeys.includes(requiredKey)) errors.push(`provenance.sourceEvidenceKeys:${requiredKey}-required`);
    }
    for (const linkedKey of sourceEvidenceKeys) {
      if (!evidenceIndex.has(linkedKey)) errors.push(`provenance.sourceEvidenceKeys:${linkedKey}-unknown-or-invalid`);
    }
  }

  const validation = artifact?.validation;
  if (!validation || typeof validation !== 'object' || Array.isArray(validation)) errors.push('validation:object-required');
  else {
    if (validation.validated !== true) errors.push('validation.validated:true-required');
    if (!NON_EMPTY(validation.validator)) errors.push('validation.validator:required');
    if (!validIsoDate(validation.validatedAt)) errors.push('validation.validatedAt:valid-iso-date-required');
    if (Array.isArray(validation.errors) && validation.errors.length > 0) errors.push('validation.errors:must-be-empty');
    const generatedAt = dateMs(provenance?.generatedAt);
    const validatedAt = dateMs(validation.validatedAt);
    if (generatedAt != null && validatedAt != null && validatedAt < generatedAt) errors.push('validation.validatedAt:must-not-precede-generation');
  }

  errors.push(...contentProfileErrors(contract.profile, artifact?.content));

  if (contract.requiresSignoff) {
    const approval = approvalFor(input, workflowId, stageId);
    if (!approval || !NON_EMPTY(String(approval.id || ''))) errors.push('approval:id-required');
    const signoffs = Array.isArray(artifact?.signoffs) ? artifact.signoffs : [];
    const matching = approval && signoffs.find((signoff) => signoff?.workflowId === workflowId && signoff?.stageId === stageId && signoff?.approvalId === approval.id && signoff?.approved === true && signoff?.revoked !== true);
    if (!matching) errors.push('signoffs:matching-stage-approval-required');
    else {
      if (!NON_EMPTY(matching.approvedBy)) errors.push('signoffs.approvedBy:required');
      if (!validIsoDate(matching.approvedAt)) errors.push('signoffs.approvedAt:valid-iso-date-required');
      const validatedAt = dateMs(validation?.validatedAt);
      const approvedAt = dateMs(matching.approvedAt);
      if (validatedAt != null && approvedAt != null && approvedAt < validatedAt) errors.push('signoffs.approvedAt:must-not-precede-validation');
    }
  }

  return {
    valid: errors.length === 0,
    status: errors.length === 0 ? 'valid' : 'invalid-deliverable-contract',
    artifactKey,
    contract,
    errors,
    evidenceKeys
  };
}

export function validateStageDeliverablesV3({ workflowId, stageId, artifacts = [], evidence = [], input = {} } = {}) {
  const stage = stageDefinition(workflowId, stageId);
  if (!stage) return { valid: false, status: 'unknown-stage', missingArtifacts: [], invalidArtifacts: [], validArtifactKeys: [], errors: ['stage:not-found'] };

  const artifactGroups = new Map();
  for (const artifact of Array.isArray(artifacts) ? artifacts : []) {
    if (!artifactBelongsToContext(artifact, workflowId, stageId)) continue;
    const key = keyOf(artifact);
    if (!artifactGroups.has(key)) artifactGroups.set(key, []);
    artifactGroups.get(key).push(artifact);
  }

  const missingArtifacts = [];
  const invalidArtifacts = [];
  const validArtifactKeys = [];

  for (const requiredKey of stage.deliverables) {
    const candidates = artifactGroups.get(requiredKey) || [];
    if (candidates.length === 0) {
      missingArtifacts.push(requiredKey);
      continue;
    }
    if (candidates.length > 1) {
      invalidArtifacts.push({ artifactKey: requiredKey, errors: ['artifact:duplicate-key'] });
      continue;
    }
    const result = validateDeliverableArtifactV3({ workflowId, stageId, artifact: candidates[0], evidence, input });
    if (result.valid) validArtifactKeys.push(requiredKey);
    else invalidArtifacts.push({ artifactKey: requiredKey, errors: result.errors });
  }

  return {
    valid: missingArtifacts.length === 0 && invalidArtifacts.length === 0,
    status: missingArtifacts.length ? 'blocked-missing-deliverables' : invalidArtifacts.length ? 'blocked-deliverable-contract' : 'valid',
    missingArtifacts,
    invalidArtifacts,
    validArtifactKeys,
    requiredArtifactKeys: [...stage.deliverables]
  };
}

function validateHandoffContractV3(handoff, artifacts, evidence, input) {
  const evidenceIndex = indexByKey(evidence, usableEvidence);
  const missingEvidence = handoff.requiredEvidence.filter((key) => !evidenceIndex.has(key));
  const invalidDeliverables = [];
  const missingDeliverables = [];
  const contractIds = [];
  const artifactGroups = new Map();

  for (const artifact of scopeArtifactsForWorkflow(artifacts, handoff.sourceWorkflowId)) {
    const key = keyOf(artifact);
    if (!artifactGroups.has(key)) artifactGroups.set(key, []);
    artifactGroups.get(key).push(artifact);
  }

  for (const artifactKey of handoff.requiredDeliverables) {
    const ownerStage = artifactOwnerStage(handoff.sourceWorkflowId, artifactKey);
    if (!ownerStage) {
      invalidDeliverables.push({ artifactKey, errors: ['artifact-owner-stage:ambiguous-or-missing'] });
      continue;
    }
    const candidates = (artifactGroups.get(artifactKey) || []).filter((artifact) => artifactBelongsToContext(artifact, handoff.sourceWorkflowId, ownerStage.id));
    if (candidates.length === 0) {
      missingDeliverables.push(artifactKey);
      continue;
    }
    if (candidates.length > 1) {
      invalidDeliverables.push({ artifactKey, errors: ['artifact:duplicate-key'] });
      continue;
    }
    const validation = validateDeliverableArtifactV3({ workflowId: handoff.sourceWorkflowId, stageId: ownerStage.id, artifact: candidates[0], evidence, input });
    if (!validation.valid) invalidDeliverables.push({ artifactKey, errors: validation.errors });
    else contractIds.push(validation.contract.id);
  }

  let status = 'ready';
  if (missingEvidence.length) status = 'blocked-handoff-evidence';
  else if (missingDeliverables.length) status = 'blocked-handoff-deliverables';
  else if (invalidDeliverables.length) status = 'blocked-handoff-deliverable-contract';

  return {
    ...handoff,
    status,
    missingEvidence,
    missingDeliverables,
    invalidDeliverables,
    payload: status === 'ready' ? {
      evidenceKeys: handoff.requiredEvidence,
      artifactKeys: handoff.requiredDeliverables,
      contractIds
    } : { evidenceKeys: [], artifactKeys: [], contractIds: [] }
  };
}

export function buildStageHandoffContractsV3(workflowId, stageId, artifacts = [], evidence = [], input = {}) {
  const definitions = CROSS_WORKFLOW_HANDOFFS_V2[stageKey(workflowId, stageId)] || [];
  return definitions.map((definition) => validateHandoffContractV3({ ...definition, sourceWorkflowId: workflowId, sourceStageId: stageId }, artifacts, evidence, input));
}

export function executeGovernmentWorkflowV3({ workflowId, state = null, completedStages = [], evidence = [], artifacts = [], input = {} } = {}) {
  const workflowArtifacts = scopeArtifactsForWorkflow(artifacts, workflowId);
  const base = executeGovernmentWorkflowV2({ workflowId, state, completedStages, evidence, artifacts: workflowArtifacts, input });
  if (base.status !== 'ready') return { ...base, contractSchemaVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION };

  const stageValidation = validateStageDeliverablesV3({ workflowId, stageId: base.currentStage.id, artifacts: workflowArtifacts, evidence, input });
  if (!stageValidation.valid) {
    return {
      ...base,
      status: stageValidation.status,
      deliverablesReady: [],
      deliverableValidation: stageValidation,
      handoffContractsV3: buildStageHandoffContractsV3(workflowId, base.currentStage.id, workflowArtifacts, evidence, input),
      nextRequestedInputs: [
        ...(base.nextRequestedInputs || []),
        ...stageValidation.missingArtifacts.map((key) => `artifact:${key}`),
        ...stageValidation.invalidArtifacts.map((item) => `artifact-contract:${item.artifactKey}`)
      ],
      governance: { ...base.governance, failClosed: true, deliverableContractsRequired: true },
      contractSchemaVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION
    };
  }

  return {
    ...base,
    status: 'ready',
    deliverablesReady: [...stageValidation.validArtifactKeys],
    deliverableValidation: stageValidation,
    handoffContractsV3: buildStageHandoffContractsV3(workflowId, base.currentStage.id, workflowArtifacts, evidence, input),
    governance: { ...base.governance, failClosed: false, deliverableContractsRequired: true },
    contractSchemaVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION
  };
}

export function transitionGovernmentWorkflowV3({ workflowId, state = null, evidence = [], artifacts = [], input = {}, actor = 'human', at = null } = {}) {
  const workflowArtifacts = scopeArtifactsForWorkflow(artifacts, workflowId);
  const execution = executeGovernmentWorkflowV3({ workflowId, state, evidence, artifacts: workflowArtifacts, input });
  if (execution.status !== 'ready') return { transitioned: false, status: execution.status, state, execution };

  const transitioned = transitionGovernmentWorkflowV2({ workflowId, state, evidence, artifacts: workflowArtifacts, input, actor, at });
  if (!transitioned.transitioned) return transitioned;

  const contractIds = execution.deliverablesReady.map((artifactKey) => getDeliverableContractV3(workflowId, execution.currentStage.id, artifactKey)?.id).filter(Boolean);
  const transitionLog = [...(transitioned.state.transitionLog || [])];
  if (transitionLog.length > 0) transitionLog[transitionLog.length - 1] = { ...transitionLog[transitionLog.length - 1], contractVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION, contractIds };
  const v3State = { ...transitioned.state, deliverableContractVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION, transitionLog };

  return {
    ...transitioned,
    state: v3State,
    handoffContracts: buildStageHandoffContractsV3(workflowId, execution.currentStage.id, workflowArtifacts, evidence, input),
    next: executeGovernmentWorkflowV3({ workflowId, state: v3State, evidence, artifacts: workflowArtifacts, input }),
    contractSchemaVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION
  };
}

export function buildCrossWorkflowCaseV3(input = {}, workflowIds = [], evidence = [], state = {}, artifacts = input.artifacts || []) {
  const workflows = [...new Set(workflowIds)].map((workflowId) => {
    const workflowState = state?.[workflowId];
    return executeGovernmentWorkflowV3({
      workflowId,
      state: Array.isArray(workflowState) ? null : workflowState,
      completedStages: Array.isArray(workflowState) ? workflowState : [],
      evidence,
      artifacts: scopeArtifactsForWorkflow(artifacts, workflowId),
      input
    });
  });

  const handoffGraph = workflows.flatMap((workflow) => workflow.handoffContractsV3 || []);
  return {
    caseId: input.caseId || null,
    contractSchemaVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION,
    workflows,
    handoffGraph,
    readyHandoffs: handoffGraph.filter((handoff) => handoff.status === 'ready'),
    governance: {
      sharedEvidenceRegister: true,
      crossWorkflowAuditTrail: true,
      humanApprovalRequired: true,
      handoffPayloadMinimized: true,
      deliverableContractsRequired: true
    }
  };
}
