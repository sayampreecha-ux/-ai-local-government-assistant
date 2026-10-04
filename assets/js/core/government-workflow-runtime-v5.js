import {
  runGovernmentWorkflow,
  runGovernmentCaseByDetectedWorkflowsV4,
  runGovernmentWorkflowByIdV4,
  DEEP_WORKFLOWS
} from '../../../src/government-workflow-suite.js?v=5.5.1';
import {
  detectCitizenServiceIntent,
  runCitizenServiceWorkflow,
  CITIZEN_SERVICE_STAGES
} from '../../../src/citizen-service-workflow.js';
import {
  CASE_MEMORY_STORAGE_KEY,
  buildCaseTitle,
  buildResumableWorkflowState,
  generateCaseId,
  isResumeIntent,
  resolveResumeCase,
  sanitizeCaseRecord,
  upsertCaseMemory
} from '../../../src/government-case-memory-v1.js';
import { publishWorkflowProgressView } from '../ui/workflow-progress-ui-v1.js?v=1.3.0';

export const WORKFLOW_RUNTIME_BRIDGE_VERSION = '5.7.3';

const ACTION_LABELS = Object.freeze({
  'repair-workflow-classification': 'ยืนยันประเภทงาน',
  'repair-workflow-state': 'ซ่อมสถานะ workflow',
  'migrate-workflow-state': 'ย้ายสถานะเดิมเข้าสู่ state ที่ตรวจสอบได้',
  'acquire-evidence': 'รวบรวมหลักฐานที่ยังขาด',
  'verify-official-evidence': 'ยืนยันหลักฐานจากแหล่งราชการต้นฉบับ',
  'perform-risk-review': 'ตรวจและปิดความเสี่ยงด้วยหลักฐาน',
  'request-human-approval': 'เสนอผู้มีอำนาจตรวจและอนุมัติ',
  'generate-deliverables': 'จัดทำชิ้นงานตามสัญญาผลลัพธ์',
  'repair-deliverables': 'แก้ชิ้นงานที่ยังไม่ผ่านสัญญาผลลัพธ์',
  'transition-ready': 'ผ่านเงื่อนไขและพร้อมเดินขั้นถัดไป',
  complete: 'workflow เสร็จสมบูรณ์'
});

const uniq = (values = []) => [...new Set((Array.isArray(values) ? values : []).filter(Boolean).map(String))];
const safeText = (value, max = 160) => String(value || '').trim().slice(0, max);

const MEETING_MINUTES_DRAFT_PATTERN = /(?:ทำ|จัดทำ|ร่าง).{0,18}รายงาน(?:การ)?ประชุม|(?:^|\s)สรุป(?:การ)?ประชุม(?=\s|$|สภา)|ถอด(?:เสียง)?ประชุม|จัดรายงาน(?:การ)?ประชุม|ทำรายงานจากไฟล์เสียง|(?:ไฟล์เสียง|เสียง).{0,18}ประชุม.{0,24}(?:ทำรายงาน|สรุป|ถอด)|(?:ทำรายงาน|สรุป|ถอด).{0,24}(?:ไฟล์เสียง|เสียง).{0,18}ประชุม/i;
const COUNCIL_LEGAL_REVIEW_PATTERN = /(?:มติ|ญัตติ|การประชุม|ข้อบัญญัติ).{0,35}(?:ชอบด้วยกฎหมาย|ถูกกฎหมาย|ผิดกฎหมาย|มีอำนาจ|ฐานอำนาจ)|(?:ชอบด้วยกฎหมาย|ถูกกฎหมาย|ผิดกฎหมาย|มีอำนาจ|ฐานอำนาจ).{0,35}(?:มติ|ญัตติ|การประชุม|ข้อบัญญัติ)|(?:องค์ประชุม|คะแนนเสียง).{0,24}(?:ครบ|พอ|เพียงพอ|ถูกต้อง).{0,12}(?:ไหม|หรือไม่|รึ)|ญัตติ.{0,24}เสนอได้.{0,12}(?:ไหม|หรือไม่)|ประธาน.{0,24}ดำเนินการ.{0,12}ถูกต้อง.{0,12}(?:ไหม|หรือไม่)|คณะกรรมการ.{0,24}มีอำนาจ.{0,24}(?:ไหม|หรือไม่)/i;
const COUNCIL_MEETING_CONTEXT_PATTERN = /(?:สภาท้องถิ่น|ประชุมสภา|รายงาน(?:การ)?ประชุม\s*สภา|สภา\s*(?:อบจ\.?|เทศบาล|อบต\.?|องค์การบริหารส่วนจังหวัด|องค์การบริหารส่วนตำบล)|มติสภา|ญัตติ|ประธานสภา|สมาชิกสภา|องค์ประชุม|สมัยประชุม)/i;

export function isMeetingMinutesDraftRequest(query = '') {
  const text = String(query || '').trim();
  return MEETING_MINUTES_DRAFT_PATTERN.test(text) && !COUNCIL_LEGAL_REVIEW_PATTERN.test(text);
}

export function resolveMeetingMinutesType(query = '') {
  return COUNCIL_MEETING_CONTEXT_PATTERN.test(String(query || '').trim()) ? 'council' : 'general';
}

function buildMeetingMinutesDraftView(caseContext, meetingType = resolveMeetingMinutesType(caseContext?.effectiveQuery)) {
  const workflowId = meetingType === 'council' ? 'gov.council' : 'gov.correspondence';
  const contractId = meetingType === 'council' ? 'gov.council.minutes-draft.v1' : 'gov.correspondence.minutes-draft.v1';
  const primary = Object.freeze({
    workflowId,
    workflowStatus: 'draft-available/facts-pending',
    action: 'generate-deliverables',
    actionLabel: 'จัดทำร่างรายงานการประชุมจากข้อเท็จจริงที่มี',
    currentStage: Object.freeze({ id: 'minutes-draft', title: 'จัดทำร่างรายงานการประชุม' }),
    completedStages: Object.freeze([]),
    requiredEvidence: Object.freeze([]),
    missingEvidence: Object.freeze([]),
    missingOfficialEvidence: Object.freeze([]),
    deliverables: Object.freeze([Object.freeze({
      artifactKey: 'meeting-minutes-draft',
      contractId,
      contractVersion: '1.0',
      profile: 'official-style',
      requiredContent: Object.freeze(['working-transcript', 'official-style-minutes', 'resolution-status', 'human-review']),
      requiredEvidence: Object.freeze([]),
      requiresSignoff: true,
      status: 'draft-available'
    })]),
    nextInputs: Object.freeze(['meeting-source-material-if-not-already-provided']),
    approvalRequired: true,
    autoApprovalAllowed: false,
    riskReviewRequired: false,
    unresolvedRiskCodes: Object.freeze([]),
    qualityGate: Object.freeze({
      status: 'DRAFT_AVAILABLE',
      completeness: false,
      missingInformation: Object.freeze([]),
      sourceEvidenceReady: true,
      riskFlags: Object.freeze([]),
      humanReviewRequired: true,
      deliverableReady: true,
      workflowReady: true,
      substantiveDecisionMade: false,
      rawEvidenceValuesReturned: false
    }),
    deliverablePlan: Object.freeze({
      status: 'DRAFT_SPEC_READY',
      stageId: 'minutes-draft',
      qualityStatus: 'DRAFT_AVAILABLE',
      humanDraftRequired: false,
      autoGenerationAllowed: false,
      artifacts: Object.freeze([]),
      rawEvidenceValuesReturned: false
    }),
    handoffs: Object.freeze([])
  });
  return Object.freeze({
    bridgeVersion: WORKFLOW_RUNTIME_BRIDGE_VERSION,
    status: 'draft-available',
    orchestration: 'single-workflow',
    workflowIds: Object.freeze([workflowId]),
    caseId: caseContext.caseId,
    resumedCase: caseContext.resumed,
    resumeLabel: caseContext.resumed ? 'ทำต่อจากเรื่องเดิม' : 'เริ่มเรื่องใหม่',
    caseStatus: 'active',
    primary,
    workflows: Object.freeze([primary]),
    nextActions: Object.freeze([Object.freeze({
      workflowId,
      stageId: 'minutes-draft',
      action: 'generate-deliverables',
      actionLabel: 'จัดทำร่างรายงานการประชุมจากข้อเท็จจริงที่มี'
    })]),
    meetingMinutes: Object.freeze({
      mode: 'draft-from-recorded-facts',
      meetingType,
      factsPending: true,
      authorityGateRequiredForDraft: false,
      legalReviewSeparate: true,
      audioCapabilityMustBeVerifiedAtRuntime: true
    }),
    caseMemory: Object.freeze({
      enabled: Boolean(safeStorage()),
      resumed: caseContext.resumed,
      storesRawPrompt: false,
      storesRawEvidence: false,
      storesPersonalData: false
    }),
    governance: Object.freeze({
      rawEvidenceValuesReturned: false,
      autoApprovalAllowed: false,
      failClosed: false,
      noFabrication: true,
      humanApprovalRequiredWhenDeclared: true,
      deliverableContractsRequired: true
    })
  });
}

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function notifyCaseMemoryUpdated() {
  try {
    if (typeof document !== 'undefined' && typeof CustomEvent !== 'undefined') {
      document.dispatchEvent(new CustomEvent('govprompt:case-memory-updated'));
    }
  } catch {}
}

function toPersistedCase(item) {
  const sanitized = sanitizeCaseRecord(item);
  const { privacy, ...persisted } = sanitized;
  return persisted;
}

function readCaseMemory() {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(CASE_MEMORY_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.map((item) => sanitizeCaseRecord(item)) : [];
  } catch {
    return [];
  }
}

function writeCaseMemory(cases) {
  const storage = safeStorage();
  if (!storage) return false;
  try {
    const minimized = (Array.isArray(cases) ? cases : []).map(toPersistedCase);
    storage.setItem(CASE_MEMORY_STORAGE_KEY, JSON.stringify(minimized));
    notifyCaseMemoryUpdated();
    return true;
  } catch {
    return false;
  }
}

function safeDeliverable(order) {
  return Object.freeze({
    artifactKey: safeText(order?.artifactKey, 100),
    contractId: safeText(order?.contractId, 180),
    contractVersion: safeText(order?.contractVersion, 24),
    profile: safeText(order?.profile, 60),
    requiredContent: Object.freeze(uniq(order?.requiredContent)),
    requiredEvidence: Object.freeze(uniq(order?.requiredEvidence)),
    requiresSignoff: Boolean(order?.requiresSignoff),
    status: safeText(order?.status, 40)
  });
}

function safeWorkOrder(workOrder) {
  if (!workOrder) return null;
  return Object.freeze({
    workflowId: safeText(workOrder.workflowId, 80),
    workflowStatus: safeText(workOrder.workflowStatus, 80),
    action: safeText(workOrder.action, 80),
    actionLabel: ACTION_LABELS[workOrder.action] || 'ดำเนินการตาม blocker ปัจจุบัน',
    currentStage: workOrder.currentStage ? Object.freeze({
      id: safeText(workOrder.currentStage.id, 100),
      title: safeText(workOrder.currentStage.title, 160)
    }) : null,
    completedStages: Object.freeze(uniq(workOrder.completedStages)),
    requiredEvidence: Object.freeze(uniq(workOrder.requiredEvidence)),
    missingEvidence: Object.freeze(uniq(workOrder.missingEvidence)),
    missingOfficialEvidence: Object.freeze(uniq(workOrder.missingOfficialEvidence)),
    deliverables: Object.freeze((workOrder.deliverableWorkOrders || []).map(safeDeliverable)),
    nextInputs: Object.freeze(uniq(workOrder.nextInputs)),
    approvalRequired: Boolean(workOrder.approvalRequest?.required),
    autoApprovalAllowed: false,
    riskReviewRequired: Boolean(workOrder.riskWork),
    unresolvedRiskCodes: Object.freeze(uniq(workOrder.riskWork?.findings?.map((finding) => finding?.code))),
    qualityGate: Object.freeze({
      status: safeText(workOrder.qualityGate?.status, 32),
      completeness: Boolean(workOrder.qualityGate?.completeness),
      missingInformation: Object.freeze(uniq(workOrder.qualityGate?.missingInformation)),
      sourceEvidenceReady: Boolean(workOrder.qualityGate?.sourceEvidenceReady),
      riskFlags: Object.freeze(uniq(workOrder.qualityGate?.riskFlags)),
      humanReviewRequired: Boolean(workOrder.qualityGate?.humanReviewRequired),
      deliverableReady: Boolean(workOrder.qualityGate?.deliverableReady),
      workflowReady: Boolean(workOrder.qualityGate?.workflowReady),
      substantiveDecisionMade: false,
      rawEvidenceValuesReturned: false
    }),
    deliverablePlan: Object.freeze({
      status: safeText(workOrder.deliverablePlan?.status, 48),
      stageId: safeText(workOrder.deliverablePlan?.stageId, 100),
      qualityStatus: safeText(workOrder.deliverablePlan?.qualityStatus, 32),
      humanDraftRequired: Boolean(workOrder.deliverablePlan?.humanDraftRequired),
      autoGenerationAllowed: false,
      artifacts: Object.freeze((workOrder.deliverablePlan?.artifacts || []).map(safeDeliverable)),
      rawEvidenceValuesReturned: false
    }),
    handoffs: Object.freeze((workOrder.handoffs || []).map((handoff) => Object.freeze({
      sourceWorkflowId: safeText(handoff?.sourceWorkflowId, 80),
      sourceStageId: safeText(handoff?.sourceStageId, 100),
      targetWorkflowId: safeText(handoff?.targetWorkflowId, 80),
      status: safeText(handoff?.status, 80),
      humanConfirmationRequired: Boolean(handoff?.humanConfirmationRequired),
      humanConfirmed: Boolean(handoff?.humanConfirmed),
      autoHandoffAllowed: false,
      missingEvidence: Object.freeze(uniq(handoff?.missingEvidence)),
      missingDeliverables: Object.freeze(uniq(handoff?.missingDeliverables))
    })))
  });
}

function citizenAction(status) {
  if (status === 'blocked-missing-evidence') return 'acquire-evidence';
  if (status === 'blocked-official-source') return 'verify-official-evidence';
  if (status === 'blocked-risk-review') return 'perform-risk-review';
  if (status === 'awaiting-human-approval') return 'request-human-approval';
  if (status === 'complete') return 'complete';
  return 'transition-ready';
}

function safeCitizenWorkOrder(execution) {
  if (!execution) return null;
  const action = citizenAction(execution.status);
  const stage = execution.currentStage || null;
  const riskFindings = Array.isArray(execution.riskFindings) ? execution.riskFindings : [];
  const deliverables = (execution.requiredDeliverables || []).map((artifactKey) => safeDeliverable({
    artifactKey,
    profile: 'structured',
    requiredEvidence: stage?.required || [],
    requiresSignoff: Boolean(stage?.humanApproval),
    status: execution.status === 'complete' ? 'ready' : 'required'
  }));
  const blocked = String(execution.status || '').startsWith('blocked-');
  const approvalRequired = Boolean(stage?.humanApproval) || execution.status === 'awaiting-human-approval';
  return Object.freeze({
    workflowId: 'gov.citizen-service',
    workflowStatus: safeText(execution.status, 80),
    action,
    actionLabel: ACTION_LABELS[action] || 'ดำเนินการตาม blocker ปัจจุบัน',
    currentStage: stage ? Object.freeze({ id: safeText(stage.id, 100), title: safeText(stage.title, 160) }) : null,
    completedStages: Object.freeze(uniq(execution.completedStages)),
    requiredEvidence: Object.freeze(uniq(stage?.required)),
    missingEvidence: Object.freeze(uniq(execution.missingEvidence)),
    missingOfficialEvidence: Object.freeze(uniq(execution.missingOfficialEvidence)),
    deliverables: Object.freeze(deliverables),
    nextInputs: Object.freeze(uniq(execution.nextRequestedInputs)),
    approvalRequired,
    autoApprovalAllowed: false,
    riskReviewRequired: riskFindings.length > 0,
    unresolvedRiskCodes: Object.freeze(uniq(riskFindings.map((finding) => finding?.code))),
    qualityGate: Object.freeze({
      status: execution.status === 'complete' ? 'COMPLETE' : approvalRequired && execution.status === 'awaiting-human-approval' ? 'AWAITING_APPROVAL' : blocked ? 'BLOCKED' : 'READY',
      completeness: !execution.missingEvidence?.length,
      missingInformation: Object.freeze(uniq(execution.missingEvidence)),
      sourceEvidenceReady: !execution.missingOfficialEvidence?.length,
      riskFlags: Object.freeze(uniq(riskFindings.map((finding) => finding?.code))),
      humanReviewRequired: approvalRequired,
      deliverableReady: execution.status === 'complete',
      workflowReady: execution.status === 'ready' || execution.status === 'complete',
      substantiveDecisionMade: false,
      rawEvidenceValuesReturned: false
    }),
    deliverablePlan: Object.freeze({
      status: execution.status === 'complete' ? 'ready' : 'pending',
      stageId: safeText(stage?.id, 100),
      qualityStatus: blocked ? 'BLOCKED' : 'READY',
      humanDraftRequired: approvalRequired,
      autoGenerationAllowed: false,
      artifacts: Object.freeze(deliverables),
      rawEvidenceValuesReturned: false
    }),
    handoffs: Object.freeze((execution.handoffs || []).map((targetWorkflowId) => Object.freeze({
      sourceWorkflowId: 'gov.citizen-service',
      sourceStageId: safeText(stage?.id, 100),
      targetWorkflowId: safeText(targetWorkflowId, 80),
      status: 'supporting-workflow',
      humanConfirmationRequired: false,
      humanConfirmed: false,
      autoHandoffAllowed: false,
      missingEvidence: Object.freeze([]),
      missingDeliverables: Object.freeze([])
    })))
  });
}

function detectIntentIds(query) {
  try {
    const citizen = detectCitizenServiceIntent({ query });
    const core = uniq(runGovernmentWorkflow({ query })?.intent);
    return citizen.matched ? uniq(['gov.citizen-service', ...citizen.handoffs, ...core]) : core;
  } catch {
    return [];
  }
}

function workflowStateFromMemory(record) {
  const map = {};
  for (const item of record?.progress || []) {
    const orderedStageIds = (DEEP_WORKFLOWS[item.workflowId] || []).map((stage) => stage.id);
    if (!orderedStageIds.length) continue;
    map[item.workflowId] = buildResumableWorkflowState({
      workflowId: item.workflowId,
      caseId: record.caseId,
      completedStages: item.completedStages,
      orderedStageIds
    });
  }
  return map;
}

function citizenStateFromMemory(record) {
  const item = (record?.progress || []).find((progress) => progress?.workflowId === 'gov.citizen-service');
  if (!item) return null;
  const completedStages = uniq(item.completedStages);
  const currentStageId = CITIZEN_SERVICE_STAGES[completedStages.length]?.id || null;
  return {
    schemaVersion: '1.0',
    workflowId: 'gov.citizen-service',
    caseId: record.caseId,
    status: currentStageId ? 'active' : 'complete',
    completedStages,
    currentStageId,
    transitionLog: []
  };
}

function resolveCaseContext(query, explicitState, explicitCaseId, explicitCitizenState = null) {
  const hasExplicitState = explicitState && typeof explicitState === 'object' && Object.keys(explicitState).length > 0;
  if (hasExplicitState || explicitCaseId || explicitCitizenState) {
    return {
      caseId: explicitCaseId || explicitCitizenState?.caseId || generateCaseId(),
      workflowState: explicitState || {},
      citizenServiceState: explicitCitizenState || null,
      resumed: false,
      memoryRecord: null,
      effectiveQuery: query
    };
  }

  const stored = readCaseMemory();
  const detectedIds = detectIntentIds(query);
  // A newly classified request starts a fresh workflow, except when the user
  // explicitly asks to continue/resume an existing case. This prevents an old
  // procurement case from contaminating a new PR/video job while preserving
  // deliberate Case Memory continuation.
  if (detectedIds.length && !isResumeIntent(query)) {
    return { caseId: generateCaseId(), workflowState: {}, citizenServiceState: null, resumed: false, memoryRecord: null, effectiveQuery: query };
  }
  const record = resolveResumeCase(stored, query, detectedIds);
  if (!record) {
    return { caseId: generateCaseId(), workflowState: {}, citizenServiceState: null, resumed: false, memoryRecord: null, effectiveQuery: query };
  }

  const effectiveQuery = detectedIds.length ? query : `${query} ${record.routingHint || ''}`.trim();
  return {
    caseId: record.caseId,
    workflowState: workflowStateFromMemory(record),
    citizenServiceState: citizenStateFromMemory(record),
    resumed: true,
    memoryRecord: record,
    effectiveQuery
  };
}

function persistCaseView(view) {
  if (!view?.caseId || !view?.workflows?.length) return false;
  const now = new Date().toISOString();
  const prior = readCaseMemory().find((item) => item?.caseId === view.caseId) || null;
  const progress = view.workflows.map((item) => ({
    workflowId: item.workflowId,
    currentStageId: item.currentStage?.id || null,
    currentStageTitle: item.currentStage?.title || null,
    completedStages: item.completedStages || [],
    workflowStatus: item.workflowStatus,
    nextAction: item.actionLabel,
    approvalRequired: item.approvalRequired,
    failClosed: Boolean(item.qualityGate?.status === 'BLOCKED')
  }));
  const record = sanitizeCaseRecord({
    caseId: view.caseId,
    title: prior?.title || buildCaseTitle(view.workflows),
    workflowIds: view.workflowIds,
    progress,
    status: view.caseStatus === 'complete' ? 'complete' : 'active',
    createdAt: prior?.createdAt || now,
    updatedAt: now
  });
  return writeCaseMemory(upsertCaseMemory(readCaseMemory(), record));
}

export function listRememberedCases() {
  return Object.freeze(readCaseMemory().map((item) => sanitizeCaseRecord(item)));
}

export function forgetRememberedCase(caseId) {
  const id = safeText(caseId, 100);
  if (!id) return false;
  return writeCaseMemory(readCaseMemory().filter((item) => item?.caseId !== id));
}

export function clearRememberedCases() {
  return writeCaseMemory([]);
}

export function buildWorkflowRuntimeView({ query = '', evidence = [], artifacts = [], workflowState = {}, citizenServiceState = null, caseId = null } = {}) {
  const normalizedQuery = safeText(query, 6000);
  if (!normalizedQuery) {
    return Object.freeze({
      bridgeVersion: WORKFLOW_RUNTIME_BRIDGE_VERSION,
      status: 'needs-intent',
      orchestration: 'unclassified',
      workflowIds: Object.freeze([]),
      caseId: null,
      resumedCase: false,
      primary: null,
      workflows: Object.freeze([]),
      governance: Object.freeze({ rawEvidenceValuesReturned: false, autoApprovalAllowed: false, failClosed: true })
    });
  }

  const caseContext = resolveCaseContext(normalizedQuery, workflowState, caseId, citizenServiceState);
  const input = {
    query: caseContext.effectiveQuery,
    caseId: caseContext.caseId,
    evidence: Array.isArray(evidence) ? evidence : [],
    artifacts: Array.isArray(artifacts) ? artifacts : [],
    workflowStateV4: caseContext.workflowState
  };
  const citizenIntent = detectCitizenServiceIntent(input);

  // Drafting minutes records facts that already occurred. It must not be blocked
  // by councilAuthority. Legal validity review remains on the normal gov.council gate.
  if (isMeetingMinutesDraftRequest(caseContext.effectiveQuery) && !citizenIntent.matched) {
    const view = buildMeetingMinutesDraftView(caseContext, resolveMeetingMinutesType(caseContext.effectiveQuery));
    persistCaseView(view);
    publishWorkflowProgressView(view);
    return view;
  }

  const isPrMediaRequest = /(?:วิดีโอ|วีดีโอ|คลิป|video).{0,40}(?:ประชาสัมพันธ์|แนะนำองค์กร|แนะนำหน่วยงาน|องค์กร|หน่วยงาน)|(?:ทำ|สร้าง|ร่าง|เขียน|ออกแบบ).{0,24}(?:วิดีโอ|วีดีโอ|คลิป|video)/i.test(caseContext.effectiveQuery);

  // PR media jobs are intentionally isolated from the generic cross-workflow detector.
  // Generic wording inside a media brief (บุคคล/ตำแหน่ง/โครงการ/องค์กร) must not open
  // procurement, HR, finance, or project workflows unless the user explicitly starts them.
  if (isPrMediaRequest && !citizenIntent.matched) {
    const execution = runGovernmentWorkflowByIdV4('gov.public-relations', input);
    const primary = safeWorkOrder(execution);
    const prAction = primary?.action || 'acquire-evidence';
    const view = Object.freeze({
      bridgeVersion: WORKFLOW_RUNTIME_BRIDGE_VERSION,
      status: safeText(execution?.workflowStatus || 'workflow-ready', 80),
      orchestration: 'single-workflow',
      workflowIds: Object.freeze(['gov.public-relations']),
      caseId: caseContext.caseId,
      resumedCase: false,
      resumeLabel: 'เริ่มเรื่องใหม่',
      caseStatus: execution?.workflowStatus === 'complete' ? 'complete' : 'active',
      primary,
      workflows: Object.freeze(primary ? [primary] : []),
      nextActions: Object.freeze(primary ? [Object.freeze({
        workflowId: 'gov.public-relations',
        stageId: safeText(primary.currentStage?.id, 100),
        action: prAction,
        actionLabel: primary.actionLabel || ACTION_LABELS[prAction] || 'ดำเนินการตามขั้นตอนประชาสัมพันธ์'
      })] : []),
      caseMemory: Object.freeze({
        enabled: Boolean(safeStorage()),
        resumed: false,
        storesRawPrompt: false,
        storesRawEvidence: false,
        storesPersonalData: false
      }),
      governance: Object.freeze({
        rawEvidenceValuesReturned: false,
        autoApprovalAllowed: false,
        failClosed: Boolean(primary?.qualityGate?.status === 'BLOCKED'),
        noFabrication: true,
        humanApprovalRequiredWhenDeclared: true,
        deliverableContractsRequired: true
      })
    });
    persistCaseView(view);
    publishWorkflowProgressView(view);
    return view;
  }

  const result = runGovernmentWorkflow(input);
  const caseView = runGovernmentCaseByDetectedWorkflowsV4(input);
  const coreWorkflows = (caseView.workflows || []).map(safeWorkOrder);

  let primary = safeWorkOrder(result.currentV4);
  let workflowIds = uniq(result.intent);
  let workflows = coreWorkflows;
  let status = safeText(result.status, 80);
  let caseStatus = safeText(caseView.status, 80);
  let nextActions = (caseView.nextActions || []).map((item) => Object.freeze({
    workflowId: safeText(item?.workflowId, 80),
    stageId: safeText(item?.stageId, 100),
    action: safeText(item?.action, 80),
    actionLabel: ACTION_LABELS[item?.action] || 'ดำเนินการตาม blocker ปัจจุบัน'
  }));
  let failClosed = Boolean(result.currentV4?.governance?.failClosed);

  if (citizenIntent.matched) {
    const citizenExecution = runCitizenServiceWorkflow({
      ...input,
      state: caseContext.citizenServiceState || undefined
    });
    const citizenWorkOrder = safeCitizenWorkOrder(citizenExecution);
    primary = citizenWorkOrder;
    workflowIds = uniq(['gov.citizen-service', ...citizenIntent.handoffs, ...workflowIds]);
    workflows = [citizenWorkOrder, ...coreWorkflows.filter((item) => item?.workflowId !== 'gov.citizen-service')];
    status = safeText(citizenExecution.status, 80);
    caseStatus = citizenExecution.status === 'complete' && caseView.status === 'complete' ? 'complete' : 'active';
    const citizenActionName = citizenAction(citizenExecution.status);
    nextActions = [Object.freeze({
      workflowId: 'gov.citizen-service',
      stageId: safeText(citizenExecution.currentStage?.id, 100),
      action: citizenActionName,
      actionLabel: ACTION_LABELS[citizenActionName] || 'ดำเนินการตาม blocker ปัจจุบัน'
    }), ...nextActions];
    failClosed = Boolean(citizenExecution.governance?.failClosed || failClosed);
  }

  const view = Object.freeze({
    bridgeVersion: WORKFLOW_RUNTIME_BRIDGE_VERSION,
    status,
    orchestration: workflowIds.length > 1 ? 'cross-workflow' : workflowIds.length === 1 ? 'single-workflow' : 'unclassified',
    workflowIds: Object.freeze(workflowIds),
    caseId: caseContext.caseId,
    resumedCase: caseContext.resumed,
    resumeLabel: caseContext.resumed ? 'ทำต่อจากเรื่องเดิม' : 'เริ่มเรื่องใหม่',
    caseStatus,
    primary,
    workflows: Object.freeze(workflows),
    nextActions: Object.freeze(nextActions),
    caseMemory: Object.freeze({
      enabled: Boolean(safeStorage()),
      resumed: caseContext.resumed,
      storesRawPrompt: false,
      storesRawEvidence: false,
      storesPersonalData: false
    }),
    governance: Object.freeze({
      rawEvidenceValuesReturned: false,
      autoApprovalAllowed: false,
      failClosed,
      noFabrication: true,
      humanApprovalRequiredWhenDeclared: true,
      deliverableContractsRequired: true
    })
  });
  persistCaseView(view);
  publishWorkflowProgressView(view);
  return view;
}

function formatList(values, emptyText = 'ไม่มี') {
  return values?.length ? values.join(', ') : emptyText;
}

export function buildWorkflowPromptBlock(view) {
  const primary = view?.primary;
  if (!primary) return '';

  if (view?.meetingMinutes?.mode === 'draft-from-recorded-facts') {
    const councilMinutes = view.meetingMinutes.meetingType === 'council';
    const structureLines = councilMinutes ? [
      'โครงสร้างกรณีประชุมสภาท้องถิ่น',
      '1. ชื่อรายงานการประชุม',
      '2. สมัยประชุม / ครั้งที่',
      '3. วัน เวลา สถานที่',
      '4. ผู้มาประชุม',
      '5. ผู้ไม่มาประชุม',
      '6. ผู้เข้าร่วมประชุม',
      '7. เวลาเริ่มประชุม',
      '8. ระเบียบวาระตามต้นฉบับ ห้ามสร้างชื่อหรือเลขวาระที่ไม่มีหลักฐาน',
      '9. ญัตติ / ข้อเสนอ: เพิ่มหัวข้อนี้เฉพาะเมื่อมีหลักฐาน มิฉะนั้นละหัวข้อ',
      '10. สาระการอภิปรายหรือเรื่องแจ้ง: บันทึกตามหลักฐาน ห้ามเติมว่ามีการหารือ/อภิปรายเมื่อมีเพียงการแจ้งเรื่อง',
      '11. คำชี้แจง',
      '12. มติที่ประชุมตามหลักฐาน (สถานะหลักฐานอยู่ในชั้นตรวจสอบ)',
      '13. ผลคะแนนเสียง: เพิ่มหัวข้อนี้เฉพาะเมื่อมีหลักฐาน มิฉะนั้นละหัวข้อ',
      '14. เวลาเลิกประชุม',
      '15. ผู้จดรายงาน',
      '16. ผู้ตรวจรายงาน',
      '17. ส่วนรับรองรายงานการประชุม'
    ] : [
      'โครงสร้างกรณีประชุมทั่วไป',
      '1. ชื่อการประชุม / คณะกรรมการ / คณะทำงาน',
      '2. ครั้งที่ (ถ้ามี)',
      '3. วัน เวลา สถานที่',
      '4. ผู้มาประชุม / ผู้ไม่มาประชุม / ผู้เข้าร่วมประชุม เท่าที่มีข้อมูล',
      '5. ระเบียบวาระหรือหัวข้อประชุมตามต้นฉบับ',
      '6. สาระสำคัญ ข้อหารือ และข้อเสนอ เท่าที่มีหลักฐาน',
      '7. มติ / ข้อสรุป / ข้อสั่งการ เท่าที่มีหลักฐาน',
      '8. ผู้รับผิดชอบและกำหนดเวลา หากที่ประชุมกำหนด',
      '9. เรื่องติดตาม เท่าที่มีหลักฐาน',
      '10. เวลาเลิกประชุม',
      '11. ผู้จด / ผู้ตรวจรายงาน หากมีข้อมูล',
      '- ใช้กับประชุมผู้บริหาร หัวหน้าส่วนราชการ คณะกรรมการ คณะอนุกรรมการ คณะทำงาน โครงการ ประจำเดือน และประชุมทั่วไป',
      '- ไม่บังคับใช้โครงสร้างสภาท้องถิ่นหรือวาระ 1–5 หากต้นฉบับไม่ได้ใช้รูปแบบนั้น; ไม่เพิ่มญัตติหรือคะแนนเสียงเมื่อไม่มีหลักฐาน'
    ];
    return [
      'GovPrompt Meeting Minutes Draft Contract v1',
      '- สถานะ: draft-available / facts-pending',
      '- งานนี้คือการบันทึกข้อเท็จจริงที่เกิดขึ้นแล้ว ไม่ใช่การวินิจฉัยความชอบด้วยกฎหมาย',
      '- Draft Minutes ≠ Legal Decision: Official Authority Retrieval Gate / Legal Version Gate / Decision Lock ใช้กับข้อวินิจฉัยทางกฎหมาย ไม่บล็อกการร่างข้อเท็จจริงเพียงเพราะยังไม่ตรวจฐานกฎหมาย; คำถามทางกฎหมายต้องผ่าน Gate เดิมครบถ้วน',
      councilMinutes
        ? '- การร่างรายงานสภาไม่ถูก block เพียงเพราะยังไม่มี councilAuthority; ถ้าผู้ใช้ถามว่ามติ/ญัตติชอบด้วยกฎหมายหรือไม่ จึงค่อยเข้า Authority/Evidence Gate แยกต่างหาก'
        : '- การร่างรายงานประชุมทั่วไปทำจากข้อเท็จจริงที่มีได้เลย; ถ้ามีคำถามด้านกฎหมายหรืออำนาจ ให้แยก Legal Review ออกจากงานบันทึกรายงาน',
      '',
      'Guided Intake / Answer First',
      '- ใช้ข้อมูลที่มีแล้วก่อน ห้ามถามซ้ำข้อมูลที่ผู้ใช้ให้หรือมีในเอกสาร/ข้อความต้นทาง',
      '- ถ้ามีข้อมูลพอ ให้สร้าง “ร่างรายงานการประชุม” ทันที แม้บางช่องยังขาด',
      '- ช่องที่ยังไม่ทราบให้ใช้ [ระบุ...] / [ยังไม่พบผลการลงมติ] / [ต้องตรวจสอบจากต้นฉบับ] แทนการเดา แล้วถามเพิ่มเฉพาะช่องว่างที่มีผลจริง',
      '- ถ้ายังไม่มีเนื้อหาประชุมเลย ให้เชิญผู้ใช้ส่งบันทึกย่อ ระเบียบวาระ transcript หรือข้อความที่มี โดยไม่เปิดแบบฟอร์มยาว',
      '',
      '🎙️ มีไฟล์เสียงการประชุม?',
      '- ถ้าต้นทางเป็นไฟล์เสียงและ GovPrompt ไม่มีช่องรับไฟล์เสียง ให้สั่งผู้ใช้แนบไฟล์เสียงกับ AI ปลายทางที่รองรับโดยตรงพร้อม Prompt นี้; GovPrompt ไม่ต้องรับ อัปโหลด เก็บ หรือถอดเสียงแทน AI ปลายทาง',
      '- GovPrompt ไม่ถอดเสียง ไม่จัดเก็บเสียง และไม่ส่งไฟล์เสียงไปยัง AI ปลายทางโดยอัตโนมัติ',
      '',
      'Audio capability gate',
      '- ขั้นที่ 1 ตรวจว่ามีไฟล์เสียงแนบจริงในบทสนทนาของ AI ปลายทาง; การกล่าวว่ามีไฟล์หรือแสดงชื่อไฟล์ไม่ใช่หลักฐานว่าเข้าถึงเสียงได้',
      '- ขั้นที่ 2 ตรวจว่า runtime/AI ปลายทางอ่านและถอดเสียงไฟล์นั้นได้จริง ห้ามถือว่าอ่านได้เพียงเพราะแพลตฟอร์มรองรับการแนบไฟล์',
      '- ระบุผล capability และที่มาข้อมูลสั้น ๆ ในชั้น 1 ตามสิ่งที่ runtime ตรวจได้: เสียงที่อ่านได้ / transcript จากเครื่องมือของ runtime / ข้อความผู้ใช้ / เข้าถึงไม่ได้; ถ้า runtime ส่ง transcript จากไฟล์แนบมาเป็นข้อความ ให้ระบุที่มานั้นตามหลักฐาน ไม่เรียกว่าเป็นข้อความที่ผู้ใช้พิมพ์เอง และไม่กล่าวว่าไม่มีไฟล์เพียงเพราะเห็นแต่ transcript; หากตรวจที่มาไม่ได้ให้ใช้ [ต้องตรวจสอบที่มาข้อมูล] ห้ามอ้างว่าได้ฟังเอง',
      '- ตรวจ capability จริงก่อน: ถ้ามีไฟล์เสียงถูกแนบและ runtime/AI ปลายทางอ่านเสียงได้จริง จึงทำ Audio → Transcript → Speaker Segmentation เท่าที่หลักฐานรองรับ → Agenda/Topic Mapping → Discussion Summary → Motion/Proposal Detection เมื่อเกี่ยวข้อง → Resolution/Decision Detection → Vote Detection เฉพาะเมื่อมีหลักฐาน → Draft Minutes → Human Review',
      '- ถ้า runtime ไม่มีไฟล์เสียงหรือไม่มีความสามารถถอดเสียง ให้บอกข้อจำกัดตามจริง; หากผู้ใช้มีไฟล์เสียง ให้แนบไฟล์นั้นกับ AI ปลายทางที่รองรับพร้อม Prompt นี้ หรือใช้ transcript/text ที่ผู้ใช้นำมาให้; หากมีข้อความอยู่แล้วให้ร่างจากข้อความนั้นต่อ ห้ามอ้างว่าได้ฟังไฟล์หรือได้ถอดเสียง ห้ามสร้าง transcript จากชื่อไฟล์หรือ metadata และห้ามคาดเดาเนื้อหาเสียง',
      councilMinutes
        ? '- ห้ามระบุตัวบุคคลจากเสียงหรือทำ biometric identification; ผู้พูดที่ระบุไม่ได้ให้ใช้ “ผู้พูดที่ 1”, “สมาชิกสภาท่านหนึ่ง”, “ผู้ชี้แจง” หรือ UNIDENTIFIED'
        : '- ห้ามระบุตัวบุคคลจากเสียงหรือทำ biometric identification; ผู้พูดที่ระบุไม่ได้ให้ใช้ “ผู้พูดที่ 1”, “ผู้เข้าร่วมประชุมท่านหนึ่ง”, “ผู้ชี้แจง” หรือ UNIDENTIFIED',
      '- ส่วนฟังไม่ชัดใช้ [ฟังไม่ชัด] หรือ [ต้องตรวจสอบ]',
      '- แยกผู้พูดจากการเปลี่ยนผู้พูดที่ตรวจได้จริงเท่านั้น ไม่แยกตามประโยค วาระ หรือบุคคลที่ผู้บรรยายกล่าวถึง; เสียงเดียวที่บรรยายว่า “ผู้เข้าร่วมเสนอ” ยังเป็นผู้พูดที่ 1 คนเดิม ห้ามสร้างผู้พูดที่ 2/3 จากเนื้อหาบรรยาย หากตรวจแยกเสียงไม่ได้ให้ใช้ UNIDENTIFIED และ [ต้องตรวจสอบผู้พูด] โดยไม่กำหนดจำนวนผู้พูด',
      '',
      'Working Transcript vs Official-style Minutes',
      '- รูปแบบคำตอบบังคับเมื่อมีเนื้อหาประชุม: แสดงหัวข้อ “ชั้น 1 — Working Transcript / Review Evidence” ก่อน แล้วแสดง “ชั้น 2 — ร่างรายงานการประชุม” แยกกัน ห้ามส่งเฉพาะฉบับสะอาด; ถ้าเข้าถึงเสียงไม่ได้และไม่มีข้อความ ให้แจ้งข้อจำกัดและขอข้อความแทนโดยไม่สร้างสองชั้นขึ้นเอง',
      '- ชั้น 1 Working Transcript / Review Evidence: แสดง transcript หรือบันทึกต้นทาง ผู้พูดที่ไม่ระบุตัว จุดฟังไม่ชัด จุดข้อมูลขาด และ timestamp เฉพาะที่มีจริง ห้ามสร้าง timestamp; เมื่อมีแต่บันทึกย่อห้ามเรียกว่าเป็น transcript ที่ถอดจากเสียง',
      '- ชั้น 2 Official-style Meeting Minutes: ร่างฉบับสะอาดจากข้อมูลที่ตรวจได้เท่าที่มี สรุปสาระสำคัญเป็นภาษาราชการ ไม่คัด verbatim ทั้งหมด; ไม่แสดง metadata VERIFIED / PARTIAL / UNVERIFIED ในรายงานฉบับสะอาด เว้นแต่ผู้ใช้ร้องขอ',
      '- รักษา trace กลับไปยังข้อความหรือช่วงเสียงต้นทางเท่าที่ระบบรองรับ',
      '',
      'มติและคะแนนเสียง — No Fabrication',
      '- มติแต่ละรายการต้องกำกับสถานะ VERIFIED / PARTIAL / UNVERIFIED เฉพาะในชั้น 1 Review Evidence; VERIFIED หมายถึงตรวจเทียบหลักฐานต้นทางแล้ว ไม่ใช่รับรองความชอบด้วยกฎหมาย และ transcript อัตโนมัติไม่ถูกต้อง 100% โดยอัตโนมัติ',
      '- ถ้าต้นฉบับระบุเพียง “ที่ประชุมเห็นชอบ” ให้บันทึกเฉพาะ “มติที่ประชุม: เห็นชอบตามที่เสนอ” ห้ามเติมจำนวนเสียง',
      '- ถ้ามติหรือคะแนนไม่ชัด ให้ใช้ “มติที่ประชุม: [ยังต้องตรวจสอบจากต้นฉบับ]” และสถานะ UNVERIFIED',
      '- ห้ามแต่งชื่อบุคคล ผู้พูด วัน เวลา สถานที่ ระเบียบวาระ ญัตติ ข้อเสนอ ข้อสั่งการ ผู้รับผิดชอบ deadline มติ คะแนนเสียง หรือเหตุการณ์ที่ไม่มีต้นฉบับรองรับ',
      '- การแจ้งเรื่องหรือกล่าวถึงเรื่องหนึ่งไม่เท่ากับเสนอญัตติ/ข้อเสนอ; ถ้ามีเพียง “ประธานแจ้งเรื่อง” ให้บันทึกในสาระสำคัญ ห้ามย้ายเป็นญัตติ ข้อเสนอ หรือระเบียบวาระที่แต่งขึ้น; มติ “เห็นชอบตามที่เสนอ” ไม่เพียงพอให้แต่งเนื้อหาข้อเสนอที่ไม่ได้ระบุ',
      '- ห้ามอนุมานผู้เสนอจากผู้แจ้งเรื่อง ทั้งในชั้นหลักฐาน ร่างฉบับสะอาด placeholder และคำถามเพิ่มเติม: เมื่อไม่ทราบว่าใครเสนอ ให้ใช้ “ผู้เสนอ: [ต้องตรวจสอบ]” หรือถาม “ข้อเสนอที่ที่ประชุมเห็นชอบคือเรื่องใด และใครเป็นผู้เสนอ” ห้ามใช้ “ข้อเสนอที่ประธานเสนอ” หากต้นฉบับไม่ได้ระบุ',
      '- แยกคำขอ/ข้อเสนอของผู้พูดออกจากข้อสรุป/มติของที่ประชุม: ข้อความ “ขอให้รวบรวมข้อเสนอ” ให้บันทึกว่ามีการขอให้ดำเนินการ ห้ามยกระดับเป็น “ที่ประชุมมีข้อสรุป/มีมติ/มีข้อสั่งการ” หากต้นฉบับไม่ยืนยัน',
      '- หัวข้อญัตติ/ข้อเสนอและคะแนนเสียงเป็นหัวข้อมีเงื่อนไข: เมื่อไม่มีหลักฐานให้ละหัวข้อนั้นในฉบับสะอาด และแจ้งข้อมูลที่ขาดในชั้นตรวจสอบแทน ไม่สร้างรายการคะแนนเปล่า',
      '',
      ...structureLines,
      '- ก่อนส่งคำตอบ ตรวจทุกชั้นและคำถามเพิ่มเติมว่าชื่อ/บทบาทผู้เสนอ สาระข้อเสนอ การอภิปราย มติ คะแนน ผู้รับผิดชอบ และกำหนดเวลามีข้อความต้นทางรองรับ; ลบถ้อยคำอนุมานที่ไม่มีหลักฐาน และละหัวข้อญัตติ/คะแนนที่ไม่มีหลักฐานในฉบับสะอาด',
      '- ตรวจฉบับสะอาดอีกครั้งก่อนส่ง: ลบ VERIFIED / PARTIAL / UNVERIFIED ทุกตำแหน่งในชั้น 2 รวมชื่อหัวข้อ วงเล็บ และหมายเหตุ; เมื่อไม่มีจำนวนคะแนนจากต้นฉบับให้ละหัวข้อคะแนนและรายงานช่องว่างเฉพาะชั้น 1; ห้ามเพิ่มข้อกำหนดว่าต้องมีหลักฐานการลงมติทางกฎหมายก่อนบันทึกมติที่ต้นฉบับระบุแล้ว',
      '',
      'Privacy',
      '- ใช้ข้อมูลส่วนบุคคลเท่าที่จำเป็นต่อรายงาน หลีกเลี่ยงข้อมูลอ่อนไหวที่ไม่เกี่ยวข้อง และห้ามเดาตัวตนผู้พูดจากเสียง',
      '- ร่างทุกฉบับต้องผ่าน Human Review ก่อนถือเป็นรายงานที่รับรองแล้ว; AI ห้ามรับรองแทนที่ประชุม ลงนาม ลงมติ หรือยืนยันความชอบด้วยกฎหมายโดยไม่ผ่าน Legal Gate',
      '- แจ้งสั้น ๆ: “ร่างจากข้อมูลที่มี กรุณาตรวจสอบกับต้นฉบับก่อนรับรองรายงานการประชุม”'
    ].join('\n');
  }

  const deliverableLines = (primary.deliverables || []).map((item) => [
    `- ${item.artifactKey} [${item.profile || 'structured'}]`,
    item.requiredContent.length ? `  โครงสร้างบังคับ: ${item.requiredContent.join(', ')}` : '',
    item.requiredEvidence.length ? `  ต้องโยงหลักฐาน: ${item.requiredEvidence.join(', ')}` : '',
    item.requiresSignoff ? '  ต้องมี human sign-off ของขั้นนี้ก่อนถือว่า final' : ''
  ].filter(Boolean).join('\n'));

  const workflowLines = (view.workflows || []).map((item) =>
    `- ${item.workflowId}: ${item.currentStage?.title || 'เสร็จแล้ว'} → ${item.actionLabel}`
  );

  return [
    'GovPrompt Workflow Execution Contract v5',
    `- Case: ${view.caseId || 'new'} · ${view.resumeLabel || 'เริ่มเรื่องใหม่'}`,
    `- Orchestration: ${view.orchestration || 'single-workflow'}`,
    `- Primary workflow: ${primary.workflowId}`,
    `- ขั้นปัจจุบัน: ${primary.currentStage?.title || 'เสร็จแล้ว'}${primary.currentStage?.id ? ` (${primary.currentStage.id})` : ''}`,
    `- สถานะ: ${primary.workflowStatus}`,
    `- งานถัดไป: ${primary.actionLabel}`,
    `- หลักฐานที่ยังขาด: ${formatList(primary.missingEvidence)}`,
    `- หลักฐานราชการที่ยังต้องยืนยัน: ${formatList(primary.missingOfficialEvidence)}`,
    primary.riskReviewRequired ? `- Risk gate: ต้องตรวจความเสี่ยงก่อนเดินต่อ (${formatList(primary.unresolvedRiskCodes, 'ตรวจตาม risk review ของขั้น')})` : '',
    primary.approvalRequired ? '- Human gate: ต้องหยุดรอผู้มีอำนาจตรวจ/อนุมัติ ห้าม AI อนุมัติแทน' : '',
    workflowLines.length > 1 ? ['- Cross-workflow:', ...workflowLines].join('\n') : '',
    deliverableLines.length ? ['- Deliverables ที่ขั้นนี้ต้องจัดทำ/ตรวจ:', ...deliverableLines].join('\n') : '',
    '',
    'กติกาการเดินงาน',
    '- ใช้ state/evidence/risk/deliverable gates ตามลำดับ ห้ามข้ามขั้นหรือถือว่าผ่านจากชื่อเอกสารอย่างเดียว',
    '- Case Memory เก็บเฉพาะสถานะ workflow ที่ผ่านการลดข้อมูล ไม่เก็บ prompt ดิบ หลักฐานดิบ ข้อมูลส่วนบุคคล หรือ secret',
    '- ห้ามสมมติข้อเท็จจริง เลขหนังสือ กฎหมาย ราคา อัตรา ผู้มีอำนาจ หรือหลักฐานที่ผู้ใช้ยังไม่ได้ให้/ยังไม่ได้ยืนยัน',
    '- ถ้าหลักฐานยังไม่ครบ ให้ตอบเบื้องต้นเท่าที่หลักฐานรองรับ แล้วขอเฉพาะข้อมูลหรือเอกสารที่เปลี่ยนผลลัพธ์จริง',
    '- ถ้าผลขึ้นกับกฎ ให้ตรวจต้นฉบับราชการที่ใช้กับบุคคล เหตุการณ์ และช่วงเวลาที่วินิจฉัย พร้อมฉบับปัจจุบันและบทเฉพาะกาลประกอบก่อนฟันธง',
    '- ชิ้นงาน final ต้องผ่าน content contract, provenance/evidence linkage, validation และ sign-off เมื่อขั้นนั้นกำหนด',
    '- เดินต่อจนได้ผลลัพธ์พร้อมใช้ หรือหยุดอย่างชัดเจนที่ blocker ที่ยังต้องให้มนุษย์/หลักฐานจริงดำเนินการ',
    '- ห้ามเปิดเผย chain-of-thought; ให้แสดงเฉพาะข้อเท็จจริง เหตุผลสรุป หลักฐาน ความเสี่ยง สถานะ และผลลัพธ์ที่ผู้ใช้ต้องใช้ต่อ'
  ].filter(Boolean).join('\n');
}

const api = Object.freeze({
  version: WORKFLOW_RUNTIME_BRIDGE_VERSION,
  buildWorkflowRuntimeView,
  buildWorkflowPromptBlock,
  resolveMeetingMinutesType,
  listRememberedCases,
  forgetRememberedCase,
  clearRememberedCases
});

if (typeof window !== 'undefined') {
  window.GovPromptV7 = window.GovPromptV7 || {};
  window.GovPromptV7.WorkflowRuntimeV5 = api;
}

export default api;
