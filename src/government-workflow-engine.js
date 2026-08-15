const stage = (id, title, requiredEvidence = [], deliverables = [], options = {}) => ({
  id, title, requiredEvidence, deliverables,
  officialEvidenceRequired: Boolean(options.officialEvidenceRequired),
  humanApprovalRequired: Boolean(options.humanApprovalRequired),
  handoffs: options.handoffs || [],
  riskChecks: options.riskChecks || []
});

export const DEEP_WORKFLOWS = Object.freeze({
  "gov.procurement": [
    stage("need-and-authority", "ความจำเป็นและอำนาจหน้าที่", ["missionAuthority", "needJustification"], ["need-memo"], { officialEvidenceRequired: true }),
    stage("plan-and-budget", "แผนและงบประมาณ", ["planLinkage", "fundingSource", "budgetAvailability"], ["plan-budget-check"], { handoffs: ["gov.project", "gov.finance"] }),
    stage("technical-requirements", "ความต้องการเชิงเทคนิค", ["useCase", "operatingConditions", "performanceNeeds"], ["technical-requirement-framework"], { riskChecks: ["vendor-lock"] }),
    stage("market-and-standard-price", "ข้อมูลตลาดและราคามาตรฐาน", ["priceEvidence"], ["market-price-evidence-sheet"], { officialEvidenceRequired: true }),
    stage("tor-and-competition-check", "TOR และการตรวจการแข่งขัน", ["draftTor"], ["tor-review", "competition-risk-report"], { riskChecks: ["vendor-lock", "unnecessary-restriction", "bundling-risk"] }),
    stage("method-selection", "การเลือกวิธีจัดซื้อจัดจ้าง", ["currentProcurementRule", "methodDecisionFacts"], ["procurement-method-recommendation"], { officialEvidenceRequired: true, humanApprovalRequired: true }),
    stage("reference-price", "ราคากลาง/ราคาอ้างอิง", ["referencePriceBasis", "referencePriceCalculation"], ["reference-price-sheet"], { officialEvidenceRequired: true }),
    stage("approval-and-publication", "อนุมัติและประกาศ", ["approvalAuthority", "approvedDocuments"], ["approval-publication-checklist"], { humanApprovalRequired: true }),
    stage("bid-clarification", "ข้อซักถาม/วิจารณ์", [], ["clarification-log"]),
    stage("evaluation", "พิจารณาผล", ["evaluationCriteria", "bidEvidence"], ["evaluation-checklist", "evaluation-record"], { humanApprovalRequired: true }),
    stage("contract", "ทำสัญญา", ["awardDecision", "contractTerms"], ["contract-checklist"], { humanApprovalRequired: true }),
    stage("delivery-and-inspection", "ส่งมอบและตรวจรับ", ["deliveryEvidence", "inspectionCriteria"], ["inspection-checklist", "acceptance-record"], { humanApprovalRequired: true }),
    stage("asset-registration-and-maintenance", "ขึ้นทะเบียนและบำรุงรักษา", ["assetData", "maintenancePlan"], ["asset-maintenance-record"])
  ],
  "gov.finance": [
    stage("authority", "ฐานอำนาจทางการเงิน", ["financialAuthority"], ["financial-authority-check"], { officialEvidenceRequired: true }),
    stage("funding-source", "แหล่งเงิน", ["fundingSource"], ["funding-source-check"]),
    stage("budget-appropriation", "งบประมาณรองรับ", ["budgetAvailability"], ["budget-availability-check"]),
    stage("fiscal-capacity", "ฐานะการคลังและภาระผูกพัน", ["fiscalCapacity"], ["fiscal-capacity-analysis"]),
    stage("loan-debt", "เงินกู้และภาระหนี้", ["loanFacts"], ["loan-debt-analysis"], { officialEvidenceRequired: true, handoffs: ["gov.legal"] }),
    stage("supporting-documents", "เอกสารประกอบ", ["paymentDocuments"], ["payment-document-checklist"]),
    stage("approval", "อนุมัติ", ["approvalAuthority"], ["finance-approval-check"], { humanApprovalRequired: true }),
    stage("payment", "เบิกจ่าย", ["paymentEvidence"], ["payment-readiness"], { humanApprovalRequired: true }),
    stage("accounting", "บันทึกบัญชี", ["accountingData"], ["accounting-checklist"]),
    stage("audit", "ร่องรอยตรวจสอบ", [], ["finance-audit-trail"])
  ],
  "gov.legal": [
    stage("facts", "ข้อเท็จจริง", ["facts"], ["fact-summary"]),
    stage("legal-questions", "ประเด็นข้อกฎหมาย", ["legalQuestions"], ["legal-issue-list"]),
    stage("authoritative-sources", "แหล่งกฎหมายต้นฉบับ", ["officialLegalSource"], ["source-register"], { officialEvidenceRequired: true }),
    stage("freshness-status", "สถานะความเป็นปัจจุบัน", ["currentStatusEvidence"], ["freshness-check"], { officialEvidenceRequired: true }),
    stage("application", "ปรับบทกฎหมายกับข้อเท็จจริง", ["facts", "officialLegalSource"], ["legal-analysis"]),
    stage("ambiguity-conflict", "ข้อขัดแย้ง/ความไม่ชัดเจน", [], ["ambiguity-note"]),
    stage("risk-options", "ความเสี่ยงและทางเลือก", [], ["legal-risk-options"]),
    stage("human-decision", "การวินิจฉัย/ตัดสินใจโดยผู้มีอำนาจ", ["decisionAuthority"], ["decision-record"], { humanApprovalRequired: true })
  ],
  "gov.project": [
    stage("authority", "อำนาจหน้าที่", ["missionAuthority"], ["project-authority-check"], { officialEvidenceRequired: true }),
    stage("problem-need", "ปัญหาและความจำเป็น", ["problemEvidence"], ["problem-need-analysis"]),
    stage("plan-linkage", "ความเชื่อมโยงกับแผน", ["planLinkage"], ["plan-linkage-check"]),
    stage("objective-outcome", "วัตถุประสงค์และผลลัพธ์", ["objective", "expectedOutcome"], ["objective-outcome-matrix"]),
    stage("target-beneficiary", "กลุ่มเป้าหมาย", ["targetGroup"], ["target-definition"]),
    stage("activities-timeline", "กิจกรรมและระยะเวลา", ["activities", "timeline"], ["activity-timeline"]),
    stage("budget-reasonableness", "งบประมาณและความสมเหตุสมผล", ["budget", "costBasis"], ["budget-rationale"], { handoffs: ["gov.finance"] }),
    stage("procurement-dependency", "รายการที่ต้องจัดซื้อจัดจ้าง", [], ["procurement-dependency-map"], { handoffs: ["gov.procurement"] }),
    stage("kpi", "ตัวชี้วัด", ["kpi"], ["kpi-matrix"]),
    stage("risk", "ความเสี่ยงโครงการ", [], ["project-risk-register"]),
    stage("approval", "อนุมัติโครงการ", ["approvalAuthority"], ["project-approval-pack"], { humanApprovalRequired: true }),
    stage("monitor-evaluate", "ติดตามและประเมินผล", [], ["monitoring-plan"]),
    stage("closeout", "ปิดโครงการ", [], ["project-closeout-checklist"])
  ],
  "gov.correspondence": [
    stage("document-type", "ประเภทหนังสือ", ["documentType"], ["document-type-decision"]),
    stage("sender-recipient", "ผู้ส่ง ผู้รับ และอำนาจลงนาม", ["senderUnit", "recipient", "signingAuthority"], ["routing-header"]),
    stage("facts", "ข้อเท็จจริง", ["facts"], ["fact-summary"]),
    stage("references", "อ้างถึง/สิ่งที่ส่งมาด้วย", [], ["reference-list"]),
    stage("requested-action", "ความประสงค์ของหนังสือ", ["requestedAction"], ["action-statement"]),
    stage("draft", "ร่างหนังสือ", [], ["official-letter-draft"]),
    stage("style-format", "ตรวจรูปแบบสารบรรณ", [], ["records-style-check"]),
    stage("pii", "ตรวจข้อมูลส่วนบุคคล", [], ["pii-check"]),
    stage("signature", "เสนอผู้มีอำนาจลงนาม", ["signingAuthority"], ["signature-check"], { humanApprovalRequired: true }),
    stage("dispatch-record", "ส่งและลงทะเบียน", [], ["dispatch-record-checklist"])
  ],
  "gov.hr": [
    stage("intent-facts", "ประเภทงานบุคคลและข้อเท็จจริง", ["hrIntent", "facts"], ["hr-fact-summary"]),
    stage("current-rule", "หลักเกณฑ์ปัจจุบัน", ["officialHrRule"], ["hr-rule-register"], { officialEvidenceRequired: true }),
    stage("eligibility", "คุณสมบัติ/เงื่อนไข", ["eligibilityFacts"], ["eligibility-analysis"]),
    stage("workforce-impact", "ผลต่อกรอบกำลังคน", [], ["workforce-impact"]),
    stage("financial-impact", "ผลด้านงบประมาณ", [], ["hr-financial-impact"], { handoffs: ["gov.finance"] }),
    stage("recommendation", "ข้อเสนอ", [], ["hr-recommendation"]),
    stage("human-approval", "เสนอผู้มีอำนาจ", ["decisionAuthority"], ["hr-decision-pack"], { humanApprovalRequired: true })
  ]
});

const byKey = (evidence = []) => new Map(evidence.filter(Boolean).map((e) => [e.key, e]));
const isVerifiedOfficial = (e) => Boolean(e && e.official === true && e.verified === true);

export function detectProcurementRisks(input = {}) {
  const text = `${input.query || ""} ${input.draftTor || ""} ${input.specification || ""}`.toLowerCase();
  const findings = [];
  if (/(ยี่ห้อ|brand|รุ่น\s*[a-z0-9]|model\s*[a-z0-9])/i.test(text)) findings.push({ code: "vendor-lock", severity: "high", message: "พบถ้อยคำที่อาจระบุยี่ห้อ/รุ่น ต้องพิสูจน์ความจำเป็นและการแข่งขัน" });
  if (/(ต้องเป็นตัวแทนจำหน่ายรายเดียว|exclusive distributor|เฉพาะผู้ผลิต)/i.test(text)) findings.push({ code: "unnecessary-restriction", severity: "high", message: "พบเงื่อนไขที่อาจจำกัดการแข่งขัน" });
  if (/(รวมหลายรายการ|bundle|พร้อมกันทั้งหมด)/i.test(text)) findings.push({ code: "bundling-risk", severity: "medium", message: "ควรตรวจเหตุผลของการรวมรายการว่าจำเป็นและไม่กีดกันการแข่งขัน" });
  return findings;
}

export function evaluateWorkflowStage(workflowId, stageIndex, evidence = [], input = {}) {
  const stages = DEEP_WORKFLOWS[workflowId] || [];
  const current = stages[stageIndex];
  if (!current) return { status: "complete", current: null, missingEvidence: [], riskFindings: [] };
  const index = byKey(evidence);
  const missingEvidence = current.requiredEvidence.filter((key) => !index.has(key));
  const officialMissing = current.officialEvidenceRequired && !current.requiredEvidence.some((key) => isVerifiedOfficial(index.get(key)));
  const riskFindings = workflowId === "gov.procurement" ? detectProcurementRisks(input) : [];
  const blockingRisk = current.riskChecks?.some((code) => riskFindings.some((r) => r.code === code && r.severity === "high"));
  let status = "ready";
  if (missingEvidence.length) status = "blocked-missing-evidence";
  else if (officialMissing) status = "blocked-official-source";
  else if (blockingRisk) status = "blocked-risk-review";
  else if (current.humanApprovalRequired && input.humanApproved !== true) status = "awaiting-human-approval";
  return { status, current, missingEvidence, officialMissing, riskFindings, deliverables: current.deliverables, handoffs: current.handoffs };
}

export function executeDeepGovernmentWorkflow({ workflowId, evidence = [], input = {}, completedStages = [] } = {}) {
  const stages = DEEP_WORKFLOWS[workflowId];
  if (!stages) return { status: "unknown-workflow", workflowId, unresolved: ["workflowId"] };
  const completed = new Set(completedStages);
  const stageIndex = stages.findIndex((s) => !completed.has(s.id));
  if (stageIndex === -1) return { status: "complete", workflowId, completedStages: stages.map((s) => s.id), deliverablesReady: stages.flatMap((s) => s.deliverables), humanApprovalRequired: true };
  const evaluation = evaluateWorkflowStage(workflowId, stageIndex, evidence, input);
  return {
    workflowId,
    status: evaluation.status,
    currentStage: evaluation.current,
    completedStages: [...completed],
    missingEvidence: evaluation.missingEvidence,
    riskFindings: evaluation.riskFindings,
    deliverablesReady: evaluation.status === "ready" ? evaluation.deliverables : [],
    handoffs: evaluation.handoffs || [],
    nextRequestedInputs: evaluation.missingEvidence,
    governance: { noFabrication: true, piiMinimization: true, auditTrailRequired: true, humanApprovalRequired: true, failClosed: evaluation.status.startsWith("blocked-") }
  };
}

export function buildCrossWorkflowCase(input = {}, workflowIds = [], evidence = [], state = {}) {
  const unique = [...new Set(workflowIds)];
  return {
    caseId: input.caseId || null,
    workflows: unique.map((workflowId) => executeDeepGovernmentWorkflow({ workflowId, evidence, input, completedStages: state[workflowId] || [] })),
    governance: { sharedEvidenceRegister: true, crossWorkflowAuditTrail: true, humanApprovalRequired: true }
  };
}
