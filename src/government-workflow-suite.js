import { buildCrossWorkflowCase, executeDeepGovernmentWorkflow, DEEP_WORKFLOWS } from "./government-workflow-engine.js";
import { buildCrossWorkflowCaseV2, executeGovernmentWorkflowV2, transitionGovernmentWorkflowV2 } from "./government-workflow-state-machine-v2.js";
import { buildCrossWorkflowCaseV3, executeGovernmentWorkflowV3, transitionGovernmentWorkflowV3 } from "./government-deliverable-contracts-v3.js";
import { buildGovernmentWorkOrderV4, advanceGovernmentWorkflowV4, driveGovernmentWorkflowV4, runGovernmentCaseV4, driveGovernmentCaseV4 } from "./government-case-orchestrator-v4.js";

const WORKFLOWS = Object.freeze({
  budgetDraft: { id: "gov.budget-draft", keywords: ["ทำร่างงบ", "ร่างงบประมาณ", "ร่างงบ", "ข้อบัญญัติงบประมาณ", "ทำกรอบงบ", "กรอบงบ", "จัดร่างงบ", "สรุปคำของบ"] },
  procurement: { id: "gov.procurement", keywords: ["จัดซื้อ", "จัดจ้าง", "ซื้อ", "เครื่องจักร", "รถขุด", "รถบรรทุก", "tor", "ราคากลาง", "e-bidding", "เฉพาะเจาะจง"] },
  finance: { id: "gov.finance", keywords: ["เบิก", "เบิกจ่าย", "งบประมาณ", "เงินกู้", "กู้เงิน", "เงินสะสม", "ค่าใช้จ่าย", "การเงิน"] },
  correspondence: { id: "gov.correspondence", keywords: ["หนังสือราชการ", "ร่างหนังสือ", "บันทึกข้อความ", "หนังสือภายนอก", "หนังสือภายใน"] },
  legal: { id: "gov.legal", keywords: ["กฎหมาย", "ระเบียบ", "ข้อกฎหมาย", "อำนาจ", "หารือ", "คำพิพากษา", "วินัย"] },
  project: { id: "gov.project", keywords: ["ทำโครงการ", "โครงการ", "จัดอบรม", "กิจกรรม", "ดำเนินโครงการ"] },
  hr: { id: "gov.hr", keywords: ["บุคคล", "อัตรากำลัง", "เลื่อนขั้น", "เลื่อนเงินเดือน", "บรรจุ", "แต่งตั้ง", "โอน", "ย้าย"] },
  engineering: { id: "gov.engineering", keywords: ["งานช่าง", "วิศวกรรม", "ถนน", "สะพาน", "ก่อสร้าง", "แบบก่อสร้าง", "ประมาณราคา", "ควบคุมงาน", "ตรวจรับงาน", "ความหนาแน่นดิน"] },
  health: { id: "gov.health", keywords: ["สาธารณสุข", "รพ.สต", "รพสต", "สุขภาพ", "เงินบำรุง", "ผู้ป่วย", "อสม", "เวชภัณฑ์", "บริการสุขภาพ"] },
  education: { id: "gov.education", keywords: ["การศึกษา", "โรงเรียน", "นักเรียน", "ผู้เรียน", "ครู", "ศูนย์พัฒนาเด็ก", "เด็กเล็ก", "ทุนการศึกษา"] },
  internalAudit: { id: "gov.internal-audit", keywords: ["ตรวจสอบภายใน", "แผนตรวจสอบ", "ข้อค้นพบ", "กระดาษทำการ", "หน่วยรับตรวจ", "ควบคุมภายใน"] },
  executive: { id: "gov.executive", keywords: ["ผู้บริหาร", "สรุปผู้บริหาร", "ข้อเสนอผู้บริหาร", "ช่วยตัดสินใจ", "ทางเลือก", "สั่งการ", "มอบหมายงาน"] },
  publicRelations: { id: "gov.public-relations", keywords: ["ประชาสัมพันธ์", "โพสต์", "ข่าวประชาสัมพันธ์", "อินโฟกราฟิก", "แคปชัน", "โปสเตอร์", "สื่อประชาสัมพันธ์", "วิดีโอ", "วีดีโอ", "คลิป", "video", "แนะนำองค์กร", "แนะนำหน่วยงาน"] },
  council: { id: "gov.council", keywords: ["สภาท้องถิ่น", "สภา", "ญัตติ", "องค์ประชุม", "มติสภา", "ข้อบัญญัติ", "ระเบียบวาระ", "รายงานการประชุมสภา"] }
});

const HIGH_RISK = [
  "เงินกู้", "กู้เงิน", "เครื่องจักร", "e-bidding", "เฉพาะเจาะจง", "ยุบตำแหน่ง", "เพิ่มตำแหน่ง", "วินัย", "คำพิพากษา",
  "ทำร่างงบ", "ร่างงบประมาณ", "ข้อบัญญัติงบประมาณ", "จัดร่างงบ", "ข้อมูลผู้ป่วย", "ผู้ป่วย", "องค์ประชุม", "มติสภา"
];

const PRIMARY_ACTION_RULES = Object.freeze([
  ['gov.correspondence', /(?:ช่วย)?(?:ร่าง|ทำ|เขียน).{0,16}(?:หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|หนังสือภายใน)/i],
  ['gov.procurement', /(?:จัดซื้อ|จัดจ้าง|ร่าง\s*tor|ตรวจ\s*tor|e-?bidding|เฉพาะเจาะจง|ราคากลาง)/i],
  ['gov.finance', /(?:เบิก|เบิกจ่าย|ขอเบิก|จ่ายได้ไหม|จ่ายได้หรือไม่|ใช้งบ.{0,16}(?:ได้ไหม|ได้หรือไม่)|กู้เงิน|เงินกู้)/i],
  ['gov.public-relations', /(?:(?:ทำ|สร้าง|ออกแบบ|เขียน|ร่าง).{0,24}(?:วิดีโอ|วีดีโอ|คลิป|video|โพสต์|ข่าวประชาสัมพันธ์|อินโฟกราฟิก|แคปชัน|โปสเตอร์|สื่อประชาสัมพันธ์)|(?:วิดีโอ|วีดีโอ|คลิป|video).{0,30}(?:ประชาสัมพันธ์|แนะนำองค์กร|แนะนำหน่วยงาน|องค์กร|หน่วยงาน)|ประชาสัมพันธ์.{0,24}(?:โครงการ|กิจกรรม|ข่าว|องค์กร|หน่วยงาน))/i],
  ['gov.budget-draft', /(?:ทำร่างงบ|ร่างงบประมาณ|ร่างงบ|จัดร่างงบ|ทำกรอบงบ)/i],
  ['gov.legal', /(?:(?:วิเคราะห์|ตรวจ|หารือ).{0,24}(?:กฎหมาย|ข้อกฎหมาย|อำนาจ)|(?:มีอำนาจ|ผิดกฎหมาย).{0,30}(?:ไหม|หรือไม่))/i]
]);

const PRIMARY_DOMAIN_RULES = Object.freeze([
  ['gov.health', /(?:รพ\.?สต\.?|รพสต|สาธารณสุข|สุขภาพ|เงินบำรุง|ผู้ป่วย|อสม\.?|เวชภัณฑ์|บริการสุขภาพ)/i],
  ['gov.engineering', /(?:งานช่าง|วิศวกรรม|ถนน|สะพาน|ก่อสร้าง|แบบก่อสร้าง|boq|บัญชีปริมาณงาน|ประมาณราคา|ควบคุมงาน|ตรวจรับงาน|ความหนาแน่นดิน)/i],
  ['gov.education', /(?:งานการศึกษา|โรงเรียน|นักเรียน|ผู้เรียน|ครู|ศูนย์พัฒนาเด็ก|เด็กเล็ก|ทุนการศึกษา)/i],
  ['gov.internal-audit', /(?:ตรวจสอบภายใน|แผนตรวจสอบ|กระดาษทำการ|หน่วยรับตรวจ|ควบคุมภายใน)/i],
  ['gov.council', /(?:สภาท้องถิ่น|ญัตติ|องค์ประชุม|มติสภา|รายงานการประชุมสภา|ระเบียบวาระ.{0,12}สภา)/i],
  ['gov.hr', /(?:อัตรากำลัง|เลื่อนขั้น|เลื่อนเงินเดือน|บรรจุ|แต่งตั้ง|โอนย้าย|งานบุคคล)/i],
  ['gov.public-relations', /(?:งานประชาสัมพันธ์|ข่าวประชาสัมพันธ์|โพสต์|อินโฟกราฟิก|แคปชัน|โปสเตอร์|วิดีโอ|วีดีโอ|คลิป|video|แนะนำองค์กร|แนะนำหน่วยงาน)/i],
  ['gov.correspondence', /(?:หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|หนังสือภายใน)/i],
  ['gov.executive', /(?:สรุปผู้บริหาร|ข้อเสนอผู้บริหาร|ช่วยตัดสินใจ|สั่งการ|มอบหมายงาน)/i],
  ['gov.legal', /(?:ข้อกฎหมาย|กฎหมาย|คำพิพากษา|ข้อหารือ)/i],
  ['gov.project', /(?:ทำโครงการ|จัดอบรม|ดำเนินโครงการ|กิจกรรม)/i],
  ['gov.procurement', /(?:เครื่องจักร|รถขุด|รถบรรทุก|พัสดุ)/i],
  ['gov.finance', /(?:เงินสะสม|ค่าใช้จ่าย|การเงิน)/i]
]);

const textOf = (input = {}) => String(input.query || input.question || input.text || input.intent || "").toLowerCase();

function resolvePrimaryWorkflowId(text, directIds, matched) {
  for (const [workflowId, pattern] of PRIMARY_ACTION_RULES) {
    if (directIds.has(workflowId) && pattern.test(text)) return workflowId;
  }
  for (const [workflowId, pattern] of PRIMARY_DOMAIN_RULES) {
    if (directIds.has(workflowId) && pattern.test(text)) return workflowId;
  }
  return matched[0]?.id || null;
}

export function detectGovernmentWorkflows(input = {}) {
  const text = textOf(input);
  const all = Object.values(WORKFLOWS);
  const matched = all.filter((wf) => wf.keywords.some((k) => text.includes(k.toLowerCase())));
  const directIds = new Set(matched.map((x) => x.id));
  const ids = new Set(directIds);
  if (ids.has("gov.budget-draft")) ids.add("gov.finance");
  if (ids.has("gov.procurement")) { ids.add("gov.project"); ids.add("gov.finance"); }
  if (text.includes("เงินกู้") || text.includes("กู้เงิน")) { ids.add("gov.finance"); ids.add("gov.legal"); }

  const primaryId = resolvePrimaryWorkflowId(text, directIds, matched);
  const orderedIds = [];
  if (primaryId) orderedIds.push(primaryId);
  for (const workflow of matched) if (!orderedIds.includes(workflow.id)) orderedIds.push(workflow.id);
  for (const workflow of all) if (ids.has(workflow.id) && !orderedIds.includes(workflow.id)) orderedIds.push(workflow.id);
  return orderedIds.map((workflowId) => all.find((workflow) => workflow.id === workflowId)).filter(Boolean);
}

export function runGovernmentWorkflow(input = {}) {
  const text = textOf(input);
  const workflows = detectGovernmentWorkflows(input);
  const evidence = Array.isArray(input.evidence) ? input.evidence : [];
  const artifacts = Array.isArray(input.artifacts) ? input.artifacts : [];
  const officialVerified = evidence.some((e) => e?.official === true && e?.verified === true);
  const highRisk = HIGH_RISK.some((term) => text.includes(term));
  const workflowIds = workflows.map((w) => w.id);
  const deepCase = buildCrossWorkflowCase(input, workflowIds, evidence, input.workflowState || {});
  const stateMachineV2 = buildCrossWorkflowCaseV2(input, workflowIds, evidence, input.workflowStateV2 || input.workflowState || {}, artifacts);
  const stateMachineV3 = buildCrossWorkflowCaseV3(input, workflowIds, evidence, input.workflowStateV3 || input.workflowStateV2 || input.workflowState || {}, artifacts);
  const caseOrchestrationV4 = runGovernmentCaseV4({ input, workflowIds, evidence, artifacts, state: input.workflowStateV4 || input.workflowStateV3 || input.workflowStateV2 || input.workflowState || {} });
  const primary = deepCase.workflows[0] || null;
  const primaryV2 = stateMachineV2.workflows[0] || null;
  const primaryV3 = stateMachineV3.workflows[0] || null;
  const primaryV4 = caseOrchestrationV4.workflows[0] || null;
  const needsOfficialEvidence = highRisk && !officialVerified;
  const topLevelStatus = workflows.length === 0 ? "needs-intent" : needsOfficialEvidence ? "needs-official-evidence" : "workflow-ready";

  return {
    intent: workflowIds,
    orchestration: workflows.length > 1 ? "cross-workflow" : workflows.length === 1 ? "single-workflow" : "unclassified",
    deepCase,
    stateMachineV2,
    stateMachineV3,
    caseOrchestrationV4,
    current: primary,
    currentV2: primaryV2,
    currentV3: primaryV3,
    currentV4: primaryV4,
    governance: {
      officialSourceFirst: true,
      latestRuleVerificationRequired: highRisk,
      officialVerified,
      noFabrication: true,
      piiMinimization: true,
      auditTrailRequired: true,
      humanApprovalRequired: true,
      failClosed: needsOfficialEvidence,
      deepWorkflowFailClosed: Boolean(primary?.governance?.failClosed),
      stateMachineV2FailClosed: Boolean(primaryV2?.governance?.failClosed),
      deliverableContractsV3FailClosed: Boolean(primaryV3?.governance?.failClosed),
      caseOrchestratorV4FailClosed: Boolean(primaryV4?.governance?.failClosed)
    },
    status: topLevelStatus,
    next: workflows.length === 0 ? ["clarify-task"] : needsOfficialEvidence ? ["verified-official-evidence"] : primary?.nextRequestedInputs || []
  };
}

export function runGovernmentWorkflowById(workflowId, input = {}) {
  return executeDeepGovernmentWorkflow({
    workflowId,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    input,
    completedStages: input.completedStages || []
  });
}

export function runGovernmentWorkflowByIdV2(workflowId, input = {}) {
  return executeGovernmentWorkflowV2({
    workflowId,
    state: input.state || null,
    completedStages: input.completedStages || [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input
  });
}

export function transitionGovernmentWorkflowByIdV2(workflowId, input = {}) {
  return transitionGovernmentWorkflowV2({
    workflowId,
    state: input.state || null,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input,
    actor: input.actor || "human",
    at: input.at || null
  });
}

export function runGovernmentWorkflowByIdV3(workflowId, input = {}) {
  return executeGovernmentWorkflowV3({
    workflowId,
    state: input.state || null,
    completedStages: input.completedStages || [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input
  });
}

export function transitionGovernmentWorkflowByIdV3(workflowId, input = {}) {
  return transitionGovernmentWorkflowV3({
    workflowId,
    state: input.state || null,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input,
    actor: input.actor || "human",
    at: input.at || null
  });
}

export function runGovernmentWorkflowByIdV4(workflowId, input = {}) {
  return buildGovernmentWorkOrderV4({
    workflowId,
    state: input.state || null,
    completedStages: input.completedStages || [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input
  });
}

export function advanceGovernmentWorkflowByIdV4(workflowId, input = {}) {
  return advanceGovernmentWorkflowV4({
    workflowId,
    state: input.state || null,
    completedStages: input.completedStages || [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input,
    actor: input.actor || "system-orchestrator",
    at: input.at || null
  });
}

export function driveGovernmentWorkflowByIdV4(workflowId, input = {}) {
  return driveGovernmentWorkflowV4({
    workflowId,
    state: input.state || null,
    completedStages: input.completedStages || [],
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    input,
    actor: input.actor || "system-orchestrator",
    at: input.at || null,
    maxTransitions: input.maxTransitions
  });
}

export function runGovernmentCaseByDetectedWorkflowsV4(input = {}) {
  const workflowIds = detectGovernmentWorkflows(input).map((workflow) => workflow.id);
  return runGovernmentCaseV4({
    input,
    workflowIds,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    state: input.workflowStateV4 || input.workflowStateV3 || input.workflowStateV2 || input.workflowState || {}
  });
}

export function driveGovernmentCaseByDetectedWorkflowsV4(input = {}) {
  const workflowIds = detectGovernmentWorkflows(input).map((workflow) => workflow.id);
  return driveGovernmentCaseV4({
    input,
    workflowIds,
    evidence: Array.isArray(input.evidence) ? input.evidence : [],
    artifacts: Array.isArray(input.artifacts) ? input.artifacts : [],
    state: input.workflowStateV4 || input.workflowStateV3 || input.workflowStateV2 || input.workflowState || {},
    actor: input.actor || "system-orchestrator",
    at: input.at || null,
    maxTransitionsPerWorkflow: input.maxTransitionsPerWorkflow
  });
}

export { WORKFLOWS, DEEP_WORKFLOWS };
