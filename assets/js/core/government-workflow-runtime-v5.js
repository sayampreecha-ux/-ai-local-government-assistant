import {
  runGovernmentWorkflow,
  runGovernmentCaseByDetectedWorkflowsV4,
  DEEP_WORKFLOWS
} from '../../../src/government-workflow-suite.js';
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
import { publishWorkflowProgressView } from '../ui/workflow-progress-ui-v1.js';

export const WORKFLOW_RUNTIME_BRIDGE_VERSION = '5.2';

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

function safeStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCaseMemory() {
  const storage = safeStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(CASE_MEMORY_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCaseMemory(cases) {
  const storage = safeStorage();
  if (!storage) return false;
  try {
    storage.setItem(CASE_MEMORY_STORAGE_KEY, JSON.stringify(cases));
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

function detectIntentIds(query) {
  try {
    return uniq(runGovernmentWorkflow({ query })?.intent);
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

function resolveCaseContext(query, explicitState, explicitCaseId) {
  const hasExplicitState = explicitState && typeof explicitState === 'object' && Object.keys(explicitState).length > 0;
  if (hasExplicitState || explicitCaseId) {
    return { caseId: explicitCaseId || generateCaseId(), workflowState: explicitState || {}, resumed: false, memoryRecord: null, effectiveQuery: query };
  }

  const stored = readCaseMemory();
  const detectedIds = detectIntentIds(query);
  const record = resolveResumeCase(stored, query, detectedIds);
  if (!record) {
    return { caseId: generateCaseId(), workflowState: {}, resumed: false, memoryRecord: null, effectiveQuery: query };
  }

  const effectiveQuery = detectedIds.length ? query : `${query} ${record.routingHint || ''}`.trim();
  return {
    caseId: record.caseId,
    workflowState: workflowStateFromMemory(record),
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

export function buildWorkflowRuntimeView({ query = '', evidence = [], artifacts = [], workflowState = {}, caseId = null } = {}) {
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

  const caseContext = resolveCaseContext(normalizedQuery, workflowState, caseId);
  const input = {
    query: caseContext.effectiveQuery,
    caseId: caseContext.caseId,
    evidence: Array.isArray(evidence) ? evidence : [],
    artifacts: Array.isArray(artifacts) ? artifacts : [],
    workflowStateV4: caseContext.workflowState
  };
  const result = runGovernmentWorkflow(input);
  const caseView = runGovernmentCaseByDetectedWorkflowsV4(input);
  const workflows = Object.freeze((caseView.workflows || []).map(safeWorkOrder));

  const view = Object.freeze({
    bridgeVersion: WORKFLOW_RUNTIME_BRIDGE_VERSION,
    status: safeText(result.status, 80),
    orchestration: safeText(result.orchestration, 80),
    workflowIds: Object.freeze(uniq(result.intent)),
    caseId: caseContext.caseId,
    resumedCase: caseContext.resumed,
    resumeLabel: caseContext.resumed ? 'ทำต่อจากเรื่องเดิม' : 'เริ่มเรื่องใหม่',
    caseStatus: safeText(caseView.status, 80),
    primary: safeWorkOrder(result.currentV4),
    workflows,
    nextActions: Object.freeze((caseView.nextActions || []).map((item) => Object.freeze({
      workflowId: safeText(item?.workflowId, 80),
      stageId: safeText(item?.stageId, 100),
      action: safeText(item?.action, 80),
      actionLabel: ACTION_LABELS[item?.action] || 'ดำเนินการตาม blocker ปัจจุบัน'
    }))),
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
      failClosed: Boolean(result.currentV4?.governance?.failClosed),
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
    '- ถ้าต้องใช้ข้อมูลปัจจุบัน ให้ตรวจต้นฉบับราชการและสถานะความใหม่ก่อนฟันธง',
    '- ชิ้นงาน final ต้องผ่าน content contract, provenance/evidence linkage, validation และ sign-off เมื่อขั้นนั้นกำหนด',
    '- เดินต่อจนได้ผลลัพธ์พร้อมใช้ หรือหยุดอย่างชัดเจนที่ blocker ที่ยังต้องให้มนุษย์/หลักฐานจริงดำเนินการ',
    '- ห้ามเปิดเผย chain-of-thought; ให้แสดงเฉพาะข้อเท็จจริง เหตุผลสรุป หลักฐาน ความเสี่ยง สถานะ และผลลัพธ์ที่ผู้ใช้ต้องใช้ต่อ'
  ].filter(Boolean).join('\n');
}

const api = Object.freeze({
  version: WORKFLOW_RUNTIME_BRIDGE_VERSION,
  buildWorkflowRuntimeView,
  buildWorkflowPromptBlock,
  listRememberedCases,
  forgetRememberedCase,
  clearRememberedCases
});

if (typeof window !== 'undefined') {
  window.GovPromptV7 = window.GovPromptV7 || {};
  window.GovPromptV7.WorkflowRuntimeV5 = api;
}

export default api;
