import { validateBudgetBalance } from './budget-balance-validator.js';

const stage = (id, title, requiredEvidence = [], deliverables = [], options = {}) => ({
  id, title, requiredEvidence, deliverables,
  officialEvidenceRequired: Boolean(options.officialEvidenceRequired),
  officialEvidenceKeys: options.officialEvidenceKeys || [],
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
  "gov.budget-draft": [
    stage("budget-context", "บริบทและกรอบการจัดทำงบประมาณ", ["organizationContext", "targetBudgetYear", "currentBudgetRule"], ["budget-context-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["currentBudgetRule"] }),
    stage("baseline-budget", "ฐานงบประมาณเดิม", ["baselineBudget"], ["baseline-budget-analysis"]),
    stage("revenue-forecast", "ประมาณการรายรับ", ["latestRevenueActuals", "revenueForecastBasis"], ["budget-revenue-forecast-sheet"], { officialEvidenceRequired: true, officialEvidenceKeys: ["latestRevenueActuals"], handoffs: ["gov.finance"] }),
    stage("plan-project-linkage", "เชื่อมโยงแผนและคำขอโครงการ", ["targetYearPlan", "projectRequests"], ["budget-plan-project-matrix"], { officialEvidenceRequired: true, officialEvidenceKeys: ["targetYearPlan"], handoffs: ["gov.project"] }),
    stage("personnel-obligations", "ภาระบุคลากรและภาระผูกพัน", ["personnelObligations"], ["personnel-obligation-analysis"], { handoffs: ["gov.hr", "gov.finance"] }),
    stage("budget-allocation", "จัดสรรวงเงินงบประมาณ", ["allocationDraft"], ["budget-allocation-sheet"], { handoffs: ["gov.finance"] }),
    stage("priority-readiness", "จัดลำดับความสำคัญและความพร้อม", ["priorityReadiness"], ["budget-priority-readiness-matrix"]),
    stage("risk-review", "ทบทวนความเสี่ยงงบประมาณ", ["budgetRiskReview"], ["budget-risk-register"], { riskChecks: ["budget-source-gap", "budget-plan-gap", "budget-obligation-gap"] }),
    stage("budget-balance", "ตรวจสมดุลรายรับและรายจ่าย", ["budgetTotals"], ["budget-balance-check"], { riskChecks: ["budget-formula-mismatch", "budget-not-balanced", "budget-pending-confirmation", "budget-estimate-unlabelled"] }),
    stage("deliverables", "จัดทำร่างและชุดข้อมูลส่งออก", ["baselineBudget", "latestRevenueActuals", "targetYearPlan", "personnelObligations", "budgetTotals", "budgetSourceRegister"], ["budget-draft", "budget-structured-export"]),
    stage("human-approval", "เสนอผู้มีอำนาจตรวจและรับรอง", ["decisionAuthority"], ["budget-approval-pack"], { humanApprovalRequired: true })
  ],
  "gov.finance": [
    stage("authority", "ฐานอำนาจทางการเงิน", ["financialAuthority"], ["financial-authority-check"], { officialEvidenceRequired: true }),
    stage("funding-source", "แหล่งเงิน", ["fundingSource"], ["funding-source-check"]),
    stage("budget-appropriation", "งบประมาณรองรับ", ["budgetAvailability"], ["budget-availability-check"]),
    stage("fiscal-capacity", "ฐานะการคลังและภาระผูกพัน", ["fiscalCapacity"], ["fiscal-capacity-analysis"], { riskChecks: ["fiscal-capacity-risk"] }),
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
    stage("risk-options", "ความเสี่ยงและทางเลือก", [], ["legal-risk-options"], { riskChecks: ["legal-ambiguity", "authority-boundary"] }),
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
    stage("risk", "ความเสี่ยงโครงการ", [], ["project-risk-register"], { riskChecks: ["project-delivery-risk", "budget-assumption-risk"] }),
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
    stage("pii", "ตรวจข้อมูลส่วนบุคคล", [], ["pii-check"], { riskChecks: ["pii-exposure", "unverified-recipient"] }),
    stage("signature", "เสนอผู้มีอำนาจลงนาม", ["signingAuthority"], ["signature-check"], { humanApprovalRequired: true }),
    stage("dispatch-record", "ส่งและลงทะเบียน", [], ["dispatch-record-checklist"])
  ],
  "gov.hr": [
    stage("intent-facts", "ประเภทงานบุคคลและข้อเท็จจริง", ["hrIntent", "facts"], ["hr-fact-summary"]),
    stage("current-rule", "หลักเกณฑ์ปัจจุบัน", ["officialHrRule"], ["hr-rule-register"], { officialEvidenceRequired: true }),
    stage("eligibility", "คุณสมบัติ/เงื่อนไข", ["eligibilityFacts"], ["eligibility-analysis"], { riskChecks: ["eligibility-uncertainty", "hr-data-minimization"] }),
    stage("workforce-impact", "ผลต่อกรอบกำลังคน", [], ["workforce-impact"]),
    stage("financial-impact", "ผลด้านงบประมาณ", [], ["hr-financial-impact"], { handoffs: ["gov.finance"] }),
    stage("recommendation", "ข้อเสนอ", [], ["hr-recommendation"]),
    stage("human-approval", "เสนอผู้มีอำนาจ", ["decisionAuthority"], ["hr-decision-pack"], { humanApprovalRequired: true })
  ],
  "gov.engineering": [
    stage("scope-authority", "ขอบเขตงานและอำนาจหน้าที่", ["engineeringScope", "missionAuthority"], ["engineering-authority-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["missionAuthority"] }),
    stage("site-existing-condition", "สำรวจพื้นที่และสภาพเดิม", ["siteEvidence", "existingCondition"], ["site-condition-record"]),
    stage("survey-design-basis", "ข้อมูลสำรวจและเกณฑ์ออกแบบ", ["surveyData", "designCriteria"], ["engineering-design-basis"]),
    stage("drawings-calculations", "แบบ รายการ และการคำนวณ", ["drawings", "calculations"], ["drawing-calculation-check"]),
    stage("estimate-standard-price", "ประมาณราคาและราคามาตรฐาน", ["costEstimate", "standardPriceEvidence"], ["engineering-cost-estimate-sheet"], { officialEvidenceRequired: true, officialEvidenceKeys: ["standardPriceEvidence"], handoffs: ["gov.finance"] }),
    stage("procurement-handoff", "ชุดข้อมูลส่งต่อพัสดุ", ["technicalSpecification", "budgetAvailability"], ["engineering-procurement-pack"], { handoffs: ["gov.procurement", "gov.finance"] }),
    stage("construction-control", "ควบคุมงานและความปลอดภัยหน้างาน", ["workPlan", "controlEvidence"], ["construction-control-record"], { riskChecks: ["site-safety", "quality-deviation"] }),
    stage("inspection-acceptance", "ตรวจรับและยืนยันคุณภาพงาน", ["inspectionEvidence", "acceptanceCriteria"], ["engineering-inspection-checklist", "engineering-acceptance-record"], { humanApprovalRequired: true }),
    stage("defect-warranty", "ประกันผลงานและการแก้ไขข้อบกพร่อง", ["warrantyTerms", "defectRecord"], ["defect-warranty-register"])
  ],
  "gov.health": [
    stage("authority-service-scope", "อำนาจหน้าที่และขอบเขตบริการสุขภาพ", ["healthAuthority", "serviceScope"], ["health-authority-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["healthAuthority"] }),
    stage("population-need", "ปัญหาสุขภาพและกลุ่มเป้าหมาย", ["healthNeedEvidence", "targetPopulation"], ["health-need-analysis"]),
    stage("funding-source", "แหล่งเงินและหลักเกณฑ์เฉพาะ", ["fundingSource", "healthFundRule"], ["health-funding-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["healthFundRule"], handoffs: ["gov.finance"] }),
    stage("health-standard", "มาตรฐานบริการ/วิชาการที่ใช้", ["officialHealthStandard"], ["health-standard-register"], { officialEvidenceRequired: true, officialEvidenceKeys: ["officialHealthStandard"] }),
    stage("medicine-supply-procurement", "ยา เวชภัณฑ์ และรายการจัดซื้อ", ["medicineOrSupplyNeed"], ["health-procurement-plan"], { handoffs: ["gov.procurement"] }),
    stage("privacy-consent", "ข้อมูลสุขภาพ ความเป็นส่วนตัว และฐานการใช้ข้อมูล", ["dataCategory", "privacyBasis"], ["health-privacy-check"], { riskChecks: ["sensitive-health-data", "excessive-data"] }),
    stage("activity-service-plan", "แผนกิจกรรม/การให้บริการ", ["activities", "timeline"], ["health-service-plan"]),
    stage("quality-safety", "คุณภาพ ความปลอดภัย และเหตุไม่พึงประสงค์", ["qualityIndicators", "safetyPlan"], ["health-quality-safety-check"], { riskChecks: ["clinical-safety", "service-safety"] }),
    stage("approval", "เสนอผู้มีอำนาจอนุมัติ", ["approvalAuthority"], ["health-approval-pack"], { humanApprovalRequired: true }),
    stage("monitor-evaluate", "ติดตามผลและประเมินบริการ", ["monitoringData"], ["health-monitoring-report"])
  ],
  "gov.education": [
    stage("authority-policy", "อำนาจหน้าที่และนโยบายการศึกษา", ["educationAuthority", "educationPolicy"], ["education-authority-policy-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["educationAuthority", "educationPolicy"] }),
    stage("learner-need", "ความจำเป็นและกลุ่มผู้เรียน", ["learnerNeed", "targetGroup"], ["education-need-analysis"]),
    stage("plan-budget", "แผนและงบประมาณ", ["planLinkage", "budgetAvailability"], ["education-plan-budget-check"], { handoffs: ["gov.project", "gov.finance"] }),
    stage("program-design", "กิจกรรม หลักสูตร และระยะเวลา", ["programDesign", "timeline"], ["education-program-plan"]),
    stage("procurement-support", "พัสดุ/บริการสนับสนุน", ["procurementNeeds"], ["education-procurement-map"], { handoffs: ["gov.procurement"] }),
    stage("child-data-safety", "ข้อมูลเด็ก/ผู้เรียนและความปลอดภัย", ["privacyBasis", "safetyPlan"], ["education-privacy-safety-check"], { riskChecks: ["child-data", "learner-safety"] }),
    stage("approval", "เสนอผู้มีอำนาจอนุมัติ", ["approvalAuthority"], ["education-approval-pack"], { humanApprovalRequired: true }),
    stage("monitor-evaluate", "ติดตามและประเมินผลการเรียนรู้", ["learningIndicators"], ["education-evaluation-report"])
  ],
  "gov.internal-audit": [
    stage("audit-mandate", "อำนาจตรวจสอบและขอบเขต", ["auditAuthority", "auditScope"], ["audit-mandate-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["auditAuthority"] }),
    stage("risk-assessment", "ประเมินความเสี่ยงและจัดลำดับงานตรวจ", ["riskUniverse", "riskAssessment"], ["audit-risk-assessment"]),
    stage("audit-plan", "วัตถุประสงค์ เกณฑ์ และแผนตรวจ", ["auditObjectives", "auditCriteria"], ["audit-plan"]),
    stage("evidence-testing", "รวบรวมหลักฐานและทดสอบ", ["auditEvidence", "testResults"], ["audit-testing-record"]),
    stage("findings", "ข้อค้นพบ สาเหตุ ผลกระทบ และความเสี่ยง", ["auditFindings"], ["audit-findings-report"], { riskChecks: ["material-control-failure", "fraud-indicator"] }),
    stage("management-response", "คำชี้แจงและแผนแก้ไขของหน่วยรับตรวจ", ["managementResponse"], ["management-response-record"]),
    stage("report-approval", "รายงานผลและการรับรองโดยผู้มีอำนาจ", ["reportAuthority"], ["audit-report-pack"], { humanApprovalRequired: true }),
    stage("follow-up", "ติดตามการแก้ไข", ["followUpEvidence"], ["audit-follow-up-register"])
  ],
  "gov.executive": [
    stage("decision-question", "โจทย์ตัดสินใจและข้อเท็จจริง", ["decisionQuestion", "facts"], ["executive-fact-brief"]),
    stage("authority", "อำนาจและผู้ตัดสินใจ", ["decisionAuthority", "missionAuthority"], ["executive-authority-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["missionAuthority"] }),
    stage("options", "ทางเลือกที่เป็นไปได้", ["options"], ["executive-options-matrix"]),
    stage("impact-risk", "ผลกระทบ ความเสี่ยง และข้อจำกัด", ["impactAnalysis"], ["executive-risk-analysis"], { riskChecks: ["legal-impact", "financial-impact", "public-impact"] }),
    stage("briefing", "จัดทำข้อเสนอเพื่อการตัดสินใจ", ["briefingFacts"], ["executive-brief"]),
    stage("human-decision", "ตัดสินใจโดยผู้มีอำนาจ", ["decisionAuthority"], ["executive-decision-record"], { humanApprovalRequired: true }),
    stage("action-tracking", "มอบหมาย ติดตาม และกำหนดเวลา", ["actionOwners", "timeline"], ["executive-action-tracker"])
  ],
  "gov.public-relations": [
    stage("objective-audience", "วัตถุประสงค์และกลุ่มเป้าหมายการสื่อสาร", ["communicationObjective", "targetAudience"], ["pr-communication-brief"]),
    stage("facts-verification", "ตรวจข้อเท็จจริง ชื่อ ตัวเลข วันที่ และลิงก์", ["verifiedFacts"], ["pr-fact-check"]),
    stage("privacy-rights", "ข้อมูลส่วนบุคคล สิทธิภาพ และความเหมาะสม", ["mediaRights", "privacyBasis"], ["pr-privacy-rights-check"], { riskChecks: ["pii-exposure", "image-rights", "misleading-claim"] }),
    stage("content-draft", "ร่างเนื้อหา", ["contentBrief"], ["pr-content-draft"]),
    stage("channel-format", "ช่องทาง รูปแบบ และการเข้าถึง", ["channel", "format"], ["pr-channel-format-check"]),
    stage("approval", "อนุมัติก่อนเผยแพร่", ["approvalAuthority"], ["pr-approval-check"], { humanApprovalRequired: true }),
    stage("publication", "เผยแพร่และบันทึกหลักฐาน", ["publicationEvidence"], ["pr-publication-record"]),
    stage("correction-archive", "แก้ไขข้อความและเก็บประวัติ", [], ["pr-correction-archive"])
  ],
  "gov.council": [
    stage("matter-authority", "เรื่องเสนอและฐานอำนาจของสภา", ["councilMatter", "councilAuthority"], ["council-authority-check"], { officialEvidenceRequired: true, officialEvidenceKeys: ["councilAuthority"] }),
    stage("procedure-rule", "ข้อบังคับ/ระเบียบการประชุมปัจจุบัน", ["currentCouncilRule"], ["council-rule-register"], { officialEvidenceRequired: true, officialEvidenceKeys: ["currentCouncilRule"] }),
    stage("agenda-submission", "การเสนอญัตติ/ระเบียบวาระและเอกสาร", ["agendaFacts", "submissionEvidence"], ["council-agenda-check"]),
    stage("quorum-conflict", "องค์ประชุม ผลประโยชน์ทับซ้อน และผู้มีสิทธิ", ["memberFacts", "quorumFacts"], ["council-quorum-conflict-check"], { riskChecks: ["quorum-defect", "conflict-of-interest"] }),
    stage("meeting-deliberation", "การประชุมและการอภิปราย", ["meetingEvidence"], ["council-deliberation-record"]),
    stage("vote-resolution", "การลงมติและผลมติ", ["voteEvidence"], ["council-resolution-record"], { humanApprovalRequired: true }),
    stage("minutes", "รายงานการประชุม", ["minutesEvidence"], ["council-minutes-check"]),
    stage("follow-up", "ติดตามการดำเนินการตามมติ", ["resolutionActions"], ["council-resolution-tracker"])
  ]
});

const byKey = (evidence = []) => new Map(evidence.filter(Boolean).map((e) => [e.key, e]));
const isVerifiedOfficial = (e) => Boolean(e && e.official === true && e.verified === true && e.fresh !== false && e.current !== false);

export function detectProcurementRisks(input = {}) {
  const text = `${input.query || ""} ${input.draftTor || ""} ${input.specification || ""}`.toLowerCase();
  const findings = [];
  if (/(ยี่ห้อ|brand|รุ่น\s*[a-z0-9]|model\s*[a-z0-9])/i.test(text)) findings.push({ code: "vendor-lock", severity: "high", message: "พบถ้อยคำที่อาจระบุยี่ห้อ/รุ่น ต้องพิสูจน์ความจำเป็นและการแข่งขัน" });
  if (/(ต้องเป็นตัวแทนจำหน่ายรายเดียว|exclusive distributor|เฉพาะผู้ผลิต)/i.test(text)) findings.push({ code: "unnecessary-restriction", severity: "high", message: "พบเงื่อนไขที่อาจจำกัดการแข่งขัน" });
  if (/(รวมหลายรายการ|bundle|พร้อมกันทั้งหมด)/i.test(text)) findings.push({ code: "bundling-risk", severity: "medium", message: "ควรตรวจเหตุผลของการรวมรายการว่าจำเป็นและไม่กีดกันการแข่งขัน" });
  return findings;
}

function budgetBalancePayload(index, input) {
  const evidenceValue = index.get('budgetTotals')?.value;
  if (evidenceValue && typeof evidenceValue === 'object') return evidenceValue;
  if (input?.budgetBalance && typeof input.budgetBalance === 'object') return input.budgetBalance;
  if (input?.budgetTotals && typeof input.budgetTotals === 'object') return input.budgetTotals;
  return {};
}

export function evaluateWorkflowStage(workflowId, stageIndex, evidence = [], input = {}) {
  const stages = DEEP_WORKFLOWS[workflowId] || [];
  const current = stages[stageIndex];
  if (!current) return { status: "complete", current: null, missingEvidence: [], riskFindings: [] };
  const index = byKey(evidence);
  const missingEvidence = current.requiredEvidence.filter((key) => !index.has(key));
  const pendingEvidence = workflowId === 'gov.budget-draft'
    ? current.requiredEvidence.filter((key) => index.get(key)?.status === 'pending-confirmation')
    : [];
  const explicitOfficialKeys = Array.isArray(current.officialEvidenceKeys) ? current.officialEvidenceKeys : [];
  const officialMissingKeys = explicitOfficialKeys.length
    ? explicitOfficialKeys.filter((key) => !isVerifiedOfficial(index.get(key)))
    : [];
  const officialMissing = explicitOfficialKeys.length
    ? officialMissingKeys.length > 0
    : current.officialEvidenceRequired && !current.requiredEvidence.some((key) => isVerifiedOfficial(index.get(key)));
  const procurementRisks = workflowId === "gov.procurement" ? detectProcurementRisks(input) : [];
  const balanceValidation = workflowId === 'gov.budget-draft' && current.id === 'budget-balance'
    ? validateBudgetBalance(budgetBalancePayload(index, input))
    : null;
  const riskFindings = [...procurementRisks, ...(balanceValidation?.findings || [])];
  const blockingRisk = current.riskChecks?.some((code) => riskFindings.some((r) => r.code === code && r.severity === "high"));
  let status = "ready";
  if (missingEvidence.length) status = "blocked-missing-evidence";
  else if (pendingEvidence.length) status = 'blocked-missing-evidence';
  else if (officialMissing) status = "blocked-official-source";
  else if (balanceValidation && !balanceValidation.valid) status = 'blocked-risk-review';
  else if (blockingRisk) status = "blocked-risk-review";
  else if (current.humanApprovalRequired && input.humanApproved !== true) status = "awaiting-human-approval";
  return { status, current, missingEvidence: [...new Set([...missingEvidence, ...pendingEvidence])], officialMissing, officialMissingKeys, riskFindings, balanceValidation, deliverables: current.deliverables, handoffs: current.handoffs };
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
    missingOfficialEvidence: evaluation.officialMissingKeys || [],
    riskFindings: evaluation.riskFindings,
    budgetBalanceValidation: evaluation.balanceValidation || null,
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
