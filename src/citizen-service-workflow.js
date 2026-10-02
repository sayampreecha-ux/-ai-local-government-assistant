const WORKFLOW_ID = "gov.citizen-service";

const SERVICE_PROFILES = Object.freeze({
  building: {
    id: "building-permit",
    keywords: ["ขออนุญาตก่อสร้าง", "อนุญาตก่อสร้าง", "ก่อสร้างบ้าน", "ดัดแปลงอาคาร", "รื้อถอนอาคาร", "ใบอนุญาตก่อสร้าง"],
    handoffs: ["gov.engineering", "gov.legal"]
  },
  publicHealth: {
    id: "public-health-license",
    keywords: ["ใบอนุญาตสาธารณสุข", "ขออนุญาตสาธารณสุข", "กิจการที่เป็นอันตรายต่อสุขภาพ", "สถานที่จำหน่ายอาหาร", "สะสมอาหาร", "ตลาด", "ใบอนุญาตอาหาร"],
    handoffs: ["gov.health", "gov.legal"]
  },
  generic: {
    id: "generic-local-service",
    keywords: ["ขออนุญาต", "ยื่นคำขอ", "บริการประชาชน", "คู่มือประชาชน", "ขอใบอนุญาต", "ต่อใบอนุญาต", "แจ้งประกอบกิจการ", "คำขอออนไลน์"],
    handoffs: ["gov.legal"]
  }
});

const STAGES = Object.freeze([
  { id: "identify-service", title: "ระบุบริการและหน่วยงานเจ้าของเรื่อง", required: ["serviceType"], deliverables: ["service-identification"], humanApproval: false },
  { id: "official-manual", title: "ตรวจคู่มือประชาชน/หลักเกณฑ์ฉบับปัจจุบัน", required: ["officialServiceManual"], official: ["officialServiceManual"], deliverables: ["official-manual-register"], humanApproval: false },
  { id: "authority-scope", title: "ตรวจอำนาจและขอบเขตบริการ", required: ["serviceAuthority"], official: ["serviceAuthority"], deliverables: ["authority-scope-check"], humanApproval: false },
  { id: "minimum-applicant-data", title: "กำหนดข้อมูลผู้ยื่นเท่าที่จำเป็น", required: ["minimumApplicantData"], deliverables: ["data-minimization-check"], humanApproval: false },
  { id: "requirements", title: "เอกสารและเงื่อนไขตามคู่มือ", required: ["requiredDocuments"], deliverables: ["requirements-checklist"], humanApproval: false },
  { id: "fees-and-time", title: "ค่าธรรมเนียมและระยะเวลาดำเนินการ", required: ["feeRule", "serviceTimeRule"], official: ["feeRule", "serviceTimeRule"], deliverables: ["fee-time-summary"], humanApproval: false },
  { id: "intake", title: "รับคำขอและออกหลักฐานรับเรื่อง", required: ["applicationData"], deliverables: ["application-receipt"], humanApproval: false },
  { id: "completeness", title: "ตรวจความครบถ้วน", required: ["applicationData", "requiredDocuments"], deliverables: ["completeness-check"], humanApproval: false },
  { id: "deficiency-handling", title: "แจ้งรายการที่ขาดโดยอ้างฐานที่กำหนด", required: [], deliverables: ["deficiency-notice-or-clearance"], humanApproval: false },
  { id: "substantive-review", title: "เจ้าหน้าที่ตรวจเนื้อหาตามกฎหมาย/มาตรฐาน", required: ["reviewCriteria"], official: ["reviewCriteria"], deliverables: ["officer-review-record"], humanApproval: false },
  { id: "decision", title: "ผู้มีอำนาจพิจารณาอนุญาต/ไม่อนุญาต", required: ["decisionAuthority"], deliverables: ["decision-pack"], humanApproval: true },
  { id: "notification", title: "แจ้งผลและสิทธิที่เกี่ยวข้อง", required: ["decisionRecord"], deliverables: ["decision-notification"], humanApproval: false },
  { id: "status-tracking", title: "ติดตามสถานะและกรอบเวลา", required: [], deliverables: ["service-status-timeline"], humanApproval: false },
  { id: "records-audit", title: "จัดเก็บหลักฐานและ Audit Trail", required: [], deliverables: ["service-audit-trail"], humanApproval: false }
]);

const textOf = (input = {}) => String(input.query || input.question || input.text || "").normalize("NFC").toLowerCase();
const keyOf = (value) => String(value?.key || value?.id || value?.type || "").trim();
const usable = (item) => Boolean(keyOf(item) && item?.value !== undefined && item?.value !== null && item?.valid !== false && item?.revoked !== true);
const official = (item) => Boolean(usable(item) && item?.official === true && item?.verified === true && item?.fresh !== false && item?.current !== false);

export function detectCitizenServiceIntent(input = {}) {
  const text = textOf(input);
  const matched = Object.values(SERVICE_PROFILES).find((profile) => profile.keywords.some((keyword) => text.includes(keyword.normalize("NFC").toLowerCase())));
  return matched ? { matched: true, workflowId: WORKFLOW_ID, serviceProfile: matched.id, handoffs: [...matched.handoffs] } : { matched: false, workflowId: null, serviceProfile: null, handoffs: [] };
}

export function createCitizenServiceState(caseId = null) {
  return {
    schemaVersion: "1.0",
    workflowId: WORKFLOW_ID,
    caseId,
    status: "active",
    completedStages: [],
    currentStageId: STAGES[0].id,
    transitionLog: []
  };
}

function validateState(state) {
  if (!state || typeof state !== "object" || Array.isArray(state)) return { valid: false, reason: "missing-state" };
  if (state.workflowId !== WORKFLOW_ID) return { valid: false, reason: "workflow-id" };
  if (state.schemaVersion !== "1.0") return { valid: false, reason: "schema-version" };
  const completed = Array.isArray(state.completedStages) ? state.completedStages : [];
  const expected = STAGES.slice(0, completed.length).map((stage) => stage.id);
  if (completed.some((id, index) => id !== expected[index])) return { valid: false, reason: "completed-stage-prefix" };
  const current = STAGES[completed.length]?.id || null;
  if ((state.currentStageId ?? null) !== current) return { valid: false, reason: "current-stage" };
  return { valid: true };
}

function evidenceIndex(evidence = []) {
  return new Map((Array.isArray(evidence) ? evidence : []).filter(usable).map((item) => [keyOf(item), item]));
}

function approvalFor(input, stageId) {
  return (Array.isArray(input?.approvals) ? input.approvals : []).find((item) => item?.workflowId === WORKFLOW_ID && item?.stageId === stageId && item?.approved === true && item?.revoked !== true) || null;
}

function requestOutsideManualRisk(input = {}) {
  const requested = Array.isArray(input.requestedDocuments) ? input.requestedDocuments.map(String) : [];
  const allowed = Array.isArray(input.manualDocuments) ? input.manualDocuments.map(String) : [];
  if (!requested.length || !allowed.length) return [];
  const extra = requested.filter((doc) => !allowed.includes(doc));
  return extra.length ? [{ code: "extra-document-request", severity: "high", message: "พบการเรียกเอกสารที่ไม่อยู่ในรายการคู่มือ/หลักเกณฑ์ที่ระบบได้รับ", documents: extra }] : [];
}

function aiDecisionRisk(input = {}) {
  return input.aiDecision === true || input.autoApprove === true
    ? [{ code: "ai-cannot-authorize", severity: "critical", message: "AI ห้ามเป็นผู้อนุญาตหรือไม่อนุญาตแทนผู้มีอำนาจ" }]
    : [];
}

function piiRisk(input = {}) {
  const excessive = Array.isArray(input.excessivePersonalData) ? input.excessivePersonalData.filter(Boolean) : [];
  return excessive.length ? [{ code: "excessive-pii", severity: "high", message: "พบข้อมูลส่วนบุคคลเกินความจำเป็นต่อบริการ", fields: excessive }] : [];
}

export function runCitizenServiceWorkflow(input = {}) {
  const intent = detectCitizenServiceIntent(input);
  const state = input.state || createCitizenServiceState(input.caseId || null);
  const stateCheck = validateState(state);
  if (!stateCheck.valid) {
    return { workflowId: WORKFLOW_ID, status: "blocked-invalid-state", stateIntegrity: stateCheck, governance: { failClosed: true, humanApprovalRequired: true, noFabrication: true, piiMinimization: true } };
  }

  const completed = state.completedStages || [];
  const stage = STAGES[completed.length] || null;
  if (!stage) {
    return { workflowId: WORKFLOW_ID, status: "complete", state, serviceProfile: intent.serviceProfile, handoffs: intent.handoffs, governance: { failClosed: false, humanApprovalRequired: true, noFabrication: true, piiMinimization: true, auditTrailRequired: true } };
  }

  const index = evidenceIndex(input.evidence || []);
  const requiredKeys = Array.isArray(stage.required) ? stage.required : [];
  const officialKeys = Array.isArray(stage.official) ? stage.official : [];
  const missingEvidence = requiredKeys.filter((key) => !index.has(key));
  const missingOfficialEvidence = officialKeys.filter((key) => !official(index.get(key)));
  const risks = [...requestOutsideManualRisk(input), ...aiDecisionRisk(input), ...piiRisk(input)];
  const stageRisks = stage.id === "requirements" || stage.id === "completeness" || stage.id === "deficiency-handling"
    ? risks.filter((risk) => risk.code === "extra-document-request" || risk.code === "excessive-pii")
    : stage.id === "decision" ? risks.filter((risk) => risk.code === "ai-cannot-authorize") : risks.filter((risk) => risk.code === "excessive-pii");
  const approval = stage.humanApproval ? approvalFor(input, stage.id) : null;

  let status = "ready";
  if (missingEvidence.length) status = "blocked-missing-evidence";
  else if (missingOfficialEvidence.length) status = "blocked-official-source";
  else if (stageRisks.length) status = "blocked-risk-review";
  else if (stage.humanApproval && !approval) status = "awaiting-human-approval";

  return {
    workflowId: WORKFLOW_ID,
    serviceProfile: intent.serviceProfile,
    handoffs: intent.handoffs,
    status,
    state,
    currentStage: stage,
    completedStages: [...completed],
    missingEvidence,
    missingOfficialEvidence,
    riskFindings: stageRisks,
    requiredDeliverables: [...stage.deliverables],
    nextRequestedInputs: [
      ...missingEvidence,
      ...missingOfficialEvidence.map((key) => `official:${key}`),
      ...(status === "blocked-risk-review" ? ["risk-resolution"] : []),
      ...(status === "awaiting-human-approval" ? ["human-approval"] : [])
    ],
    governance: {
      failClosed: status.startsWith("blocked-"),
      officialSourceFirst: true,
      noFabrication: true,
      piiMinimization: true,
      auditTrailRequired: true,
      humanApprovalRequired: true,
      aiDecisionAllowed: false,
      extraDocumentRequestAllowedWithoutLegalBasis: false
    }
  };
}

export function transitionCitizenServiceWorkflow(input = {}) {
  const execution = runCitizenServiceWorkflow(input);
  if (execution.status !== "ready") return execution;
  const stage = execution.currentStage;
  const nextIndex = execution.completedStages.length + 1;
  const nextStage = STAGES[nextIndex] || null;
  const state = {
    ...execution.state,
    status: nextStage ? "active" : "complete",
    completedStages: [...execution.completedStages, stage.id],
    currentStageId: nextStage?.id || null,
    transitionLog: [
      ...(execution.state.transitionLog || []),
      { type: "stage-transition", workflowId: WORKFLOW_ID, fromStageId: stage.id, toStageId: nextStage?.id || null, actor: input.actor || "human", at: input.at || new Date().toISOString() }
    ]
  };
  return runCitizenServiceWorkflow({ ...input, state });
}

export { WORKFLOW_ID as CITIZEN_SERVICE_WORKFLOW_ID, SERVICE_PROFILES, STAGES as CITIZEN_SERVICE_STAGES };
