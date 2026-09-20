/**
 * GP Approval Workflow Engine v1.0
 * Pure, dependency-free safeguards for request-to-approval workflows.
 * This module classifies only from supplied facts and preserves uncertainty.
 */

export const APPROVAL_STATES = Object.freeze([
  'RECEIVED', 'FACT_REVIEW', 'INTENT_STAGE_ANALYSIS', 'CLASSIFICATION_PENDING',
  'AUTHORITY_CHECK', 'APPROVAL_STAGE_SELECTION', 'READINESS_ASSESSMENT',
  'DRAFT_ALLOWED', 'QUALITY_GATE', 'HUMAN_REVIEW', 'READY_FOR_SUBMISSION'
]);

const asText = (value) => (typeof value === 'string' ? value.trim() : '');
const list = (value) => (Array.isArray(value) ? [...value] : []);
const unknown = (value) => value === undefined || value === null || value === '';

export function createApprovalCase(input = {}) {
  const now = new Date().toISOString();
  return {
    caseId: asText(input.caseId) || `CASE-${Date.now()}`,
    schemaVersion: '1.0.0',
    createdAt: now,
    updatedAt: now,
    state: 'RECEIVED',
    sourceChannel: asText(input.sourceChannel) || 'smart-saraban',
    requester: input.requester ?? null,
    owningUnit: asText(input.owningUnit) || null,
    requestText: asText(input.requestText),
    objective: asText(input.objective),
    facts: list(input.facts),
    assumptions: list(input.assumptions),
    missingInformation: list(input.missingInformation),
    items: list(input.items),
    estimatedAmount: input.estimatedAmount ?? null,
    fundingSource: input.fundingSource ?? null,
    budgetCategory: input.budgetCategory ?? null,
    expenditureClassification: input.expenditureClassification ?? null,
    procurementIntent: input.procurementIntent ?? null,
    approvalStage: input.approvalStage ?? null,
    candidateDocumentTypes: list(input.candidateDocumentTypes),
    authorityQuestions: list(input.authorityQuestions),
    evidenceReferences: list(input.evidenceReferences),
    requiredAttachments: list(input.requiredAttachments),
    riskFlags: list(input.riskFlags),
    qualityGateResult: null,
    decisionLock: true,
    humanReviewStatus: 'pending',
    auditTrail: [{ at: now, action: 'CREATE_CASE', state: 'RECEIVED' }]
  };
}

export function assessCase(caseData = {}) {
  const missing = new Set(list(caseData.missingInformation));
  if (unknown(caseData.owningUnit)) missing.add('owningUnit');
  if (!asText(caseData.requestText)) missing.add('requestText');
  if (!list(caseData.facts).length) missing.add('facts');
  if (!list(caseData.evidenceReferences).length) missing.add('evidenceReferences');
  const conflicts = list(caseData.riskFlags).filter((flag) => /conflict|ขัดแย้ง|ฉบับใหม่|ยกเลิก/u.test(String(flag)));
  return {
    missingInformation: [...missing],
    hasMaterialGaps: missing.size > 0,
    hasConflict: conflicts.length > 0,
    factStatus: missing.has('facts') ? 'missing' : 'provided-needs-verification',
    evidenceStatus: list(caseData.evidenceReferences).length ? 'provided-needs-applicability-check' : 'missing'
  };
}

export function evaluateDecisionLock(caseData = {}) {
  const assessment = assessCase(caseData);
  const explicitLocks = list(caseData.riskFlags).filter(Boolean);
  const locked = assessment.hasMaterialGaps || assessment.hasConflict || explicitLocks.length > 0 || caseData.humanReviewStatus !== 'approved';
  return {
    locked,
    reasons: [
      ...(assessment.hasMaterialGaps ? ['ข้อมูลสาระสำคัญยังไม่ครบ'] : []),
      ...(assessment.hasConflict ? ['พบหรืออาจพบความขัดแย้งของข้อมูล/หลักเกณฑ์'] : []),
      ...(explicitLocks.length ? explicitLocks.map(String) : []),
      ...(caseData.humanReviewStatus !== 'approved' ? ['ยังไม่มี Human Review ที่อนุมัติ'] : [])
    ]
  };
}

export function classifyItems(items = []) {
  return list(items).map((item, index) => {
    const type = asText(item?.declaredType).toLowerCase();
    const basis = list(item?.classificationEvidence);
    const known = ['วัสดุ', 'ครุภัณฑ์', 'material', 'asset'].includes(type);
    return {
      index,
      description: asText(item?.description),
      classification: known ? type : 'undetermined',
      basis,
      status: known && basis.length ? 'provisional' : 'needs-review',
      warning: known ? null : 'ห้ามจำแนกจากคำสำคัญเพียงอย่างเดียว ต้องตรวจลักษณะการใช้งาน อายุการใช้งาน และหลักเกณฑ์ที่ใช้บังคับ'
    };
  });
}

const transitions = Object.freeze({
  RECEIVED: ['FACT_REVIEW'],
  FACT_REVIEW: ['INTENT_STAGE_ANALYSIS', 'AUTHORITY_CHECK'],
  INTENT_STAGE_ANALYSIS: ['CLASSIFICATION_PENDING', 'AUTHORITY_CHECK'],
  CLASSIFICATION_PENDING: ['AUTHORITY_CHECK'],
  AUTHORITY_CHECK: ['APPROVAL_STAGE_SELECTION', 'FACT_REVIEW'],
  APPROVAL_STAGE_SELECTION: ['READINESS_ASSESSMENT', 'AUTHORITY_CHECK'],
  READINESS_ASSESSMENT: ['DRAFT_ALLOWED', 'FACT_REVIEW', 'AUTHORITY_CHECK'],
  DRAFT_ALLOWED: ['QUALITY_GATE', 'FACT_REVIEW', 'AUTHORITY_CHECK'],
  QUALITY_GATE: ['HUMAN_REVIEW', 'FACT_REVIEW', 'AUTHORITY_CHECK'],
  HUMAN_REVIEW: ['READY_FOR_SUBMISSION', 'FACT_REVIEW', 'AUTHORITY_CHECK'],
  READY_FOR_SUBMISSION: ['FACT_REVIEW', 'AUTHORITY_CHECK']
});

export function canTransition(caseData = {}, nextState) {
  const current = caseData.state;
  if (!APPROVAL_STATES.includes(nextState)) return { allowed: false, reason: 'สถานะปลายทางไม่อยู่ใน workflow ที่รับรอง' };
  if (!transitions[current]?.includes(nextState)) return { allowed: false, reason: `ไม่อนุญาตให้เปลี่ยนจาก ${current} ไป ${nextState}` };
  if (['DRAFT_ALLOWED', 'QUALITY_GATE', 'HUMAN_REVIEW', 'READY_FOR_SUBMISSION'].includes(nextState)) {
    const lock = evaluateDecisionLock(caseData);
    if (lock.locked && nextState !== 'QUALITY_GATE') return { allowed: false, reason: lock.reasons.join('; ') };
  }
  return { allowed: true, reason: null };
}

export function transitionCase(caseData = {}, nextState, actor = 'system', evidence = []) {
  const result = canTransition(caseData, nextState);
  if (!result.allowed) return { ok: false, error: result.reason, caseData };
  const at = new Date().toISOString();
  return {
    ok: true,
    caseData: {
      ...caseData,
      state: nextState,
      updatedAt: at,
      auditTrail: [...list(caseData.auditTrail), { at, action: 'STATE_TRANSITION', from: caseData.state, to: nextState, actor, evidence: list(evidence) }]
    }
  };
}

export function runApprovalQualityGates(caseData = {}) {
  const assessment = assessCase(caseData);
  const lock = evaluateDecisionLock(caseData);
  const checks = [
    { id: 'FACT_GATE', status: assessment.hasMaterialGaps ? 'fail' : 'review' },
    { id: 'EVIDENCE_GATE', status: assessment.evidenceStatus === 'missing' ? 'fail' : 'review' },
    { id: 'APPLICABLE_AUTHORITY_GATE', status: 'review' },
    { id: 'CLASSIFICATION_GATE', status: classifyItems(caseData.items).some((x) => x.status === 'needs-review') ? 'review' : 'pass' },
    { id: 'HUMAN_REVIEW_GATE', status: caseData.humanReviewStatus === 'approved' ? 'pass' : 'fail' }
  ];
  return { status: checks.some((x) => x.status === 'fail') ? 'red' : 'yellow', checks, decisionLock: lock.locked, lockReasons: lock.reasons, humanReviewRequired: true };
}

export const approvalWorkflow = Object.freeze({
  createApprovalCase, assessCase, evaluateDecisionLock, classifyItems,
  canTransition, transitionCase, runApprovalQualityGates
});
