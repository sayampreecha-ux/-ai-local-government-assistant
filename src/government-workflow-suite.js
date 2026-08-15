import { buildCrossWorkflowCase, executeDeepGovernmentWorkflow, DEEP_WORKFLOWS } from "./government-workflow-engine.js";
import { buildCrossWorkflowCaseV2, executeGovernmentWorkflowV2, transitionGovernmentWorkflowV2 } from "./government-workflow-state-machine-v2.js";
import { buildCrossWorkflowCaseV3, executeGovernmentWorkflowV3, transitionGovernmentWorkflowV3 } from "./government-deliverable-contracts-v3.js";
import { buildGovernmentWorkOrderV4, advanceGovernmentWorkflowV4, driveGovernmentWorkflowV4, runGovernmentCaseV4, driveGovernmentCaseV4 } from "./government-case-orchestrator-v4.js";

const WORKFLOWS = Object.freeze({
  procurement: { id: "gov.procurement", keywords: ["จัดซื้อ", "จัดจ้าง", "ซื้อ", "เครื่องจักร", "รถขุด", "รถบรรทุก", "tor", "ราคากลาง", "e-bidding", "เฉพาะเจาะจง"] },
  finance: { id: "gov.finance", keywords: ["เบิก", "เบิกจ่าย", "งบประมาณ", "เงินกู้", "กู้เงิน", "เงินสะสม", "ค่าใช้จ่าย", "การเงิน"] },
  correspondence: { id: "gov.correspondence", keywords: ["หนังสือราชการ", "ร่างหนังสือ", "บันทึกข้อความ", "หนังสือภายนอก", "หนังสือภายใน"] },
  legal: { id: "gov.legal", keywords: ["กฎหมาย", "ระเบียบ", "ข้อกฎหมาย", "อำนาจ", "หารือ", "คำพิพากษา", "วินัย"] },
  project: { id: "gov.project", keywords: ["ทำโครงการ", "โครงการ", "จัดอบรม", "กิจกรรม", "ดำเนินโครงการ"] },
  hr: { id: "gov.hr", keywords: ["บุคคล", "อัตรากำลัง", "เลื่อนขั้น", "เลื่อนเงินเดือน", "บรรจุ", "แต่งตั้ง", "โอน", "ย้าย"] }
});

const HIGH_RISK = ["เงินกู้", "กู้เงิน", "เครื่องจักร", "e-bidding", "เฉพาะเจาะจง", "ยุบตำแหน่ง", "เพิ่มตำแหน่ง", "วินัย", "คำพิพากษา"];
const textOf = (input = {}) => String(input.query || input.question || input.text || input.intent || "").toLowerCase();

export function detectGovernmentWorkflows(input = {}) {
  const text = textOf(input);
  const matched = Object.values(WORKFLOWS).filter((wf) => wf.keywords.some((k) => text.includes(k.toLowerCase())));
  const ids = new Set(matched.map((x) => x.id));
  if (ids.has("gov.procurement")) { ids.add("gov.project"); ids.add("gov.finance"); }
  if (text.includes("เงินกู้") || text.includes("กู้เงิน")) { ids.add("gov.finance"); ids.add("gov.legal"); }
  return Object.values(WORKFLOWS).filter((wf) => ids.has(wf.id));
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
