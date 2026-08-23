import { runGovernmentWorkflow, detectGovernmentWorkflows } from "./government-workflow-suite.js";
import { detectCitizenServiceIntent, runCitizenServiceWorkflow } from "./citizen-service-workflow.js";
import { buildAssessmentPack } from "./evidence-assessment-layer.js";

export const GOVERNMENT_TASK_ROUTER_VERSION = "5.1";

export function detectGovernmentTaskV5(input = {}) {
  const citizen = detectCitizenServiceIntent(input);
  const core = detectGovernmentWorkflows(input).map((workflow) => workflow.id);
  const workflowIds = citizen.matched
    ? ["gov.citizen-service", ...citizen.handoffs, ...core].filter((id, index, all) => all.indexOf(id) === index)
    : core;
  return {
    version: GOVERNMENT_TASK_ROUTER_VERSION,
    primaryWorkflowId: citizen.matched ? "gov.citizen-service" : workflowIds[0] || null,
    workflowIds,
    citizenService: citizen
  };
}

function buildEvidenceAssessment(input, detection, primary) {
  return buildAssessmentPack({
    ...input,
    workflowIds: detection.workflowIds,
    baseline: input.baseline ?? input.assessment?.baseline ?? null,
    action: input.action ?? input.assessment?.action ?? primary?.currentStage?.title ?? primary?.current?.currentStage?.title ?? null,
    output: input.output ?? input.assessment?.output ?? primary?.requiredDeliverables ?? primary?.current?.requiredDeliverables ?? null,
    outcome: input.outcome ?? input.assessment?.outcome ?? null,
    kpi: input.kpi ?? input.assessment?.kpi ?? null,
    owner: input.owner ?? input.assessment?.owner ?? null,
    deadline: input.deadline ?? input.assessment?.deadline ?? null,
    auditTrail: input.auditTrail ?? input.assessment?.auditTrail ?? primary?.state?.transitionLog ?? primary?.transitionLog ?? []
  });
}

export function runGovernmentTaskV5(input = {}) {
  const detection = detectGovernmentTaskV5(input);
  if (!detection.citizenService.matched) {
    const primary = runGovernmentWorkflow(input);
    return {
      version: GOVERNMENT_TASK_ROUTER_VERSION,
      detection,
      primary,
      citizenService: null,
      evidenceAssessment: buildEvidenceAssessment(input, detection, primary)
    };
  }

  const citizenInput = {
    ...input,
    state: input.citizenServiceState || input.state || undefined
  };
  const citizenService = runCitizenServiceWorkflow(citizenInput);
  const core = runGovernmentWorkflow(input);

  return {
    version: GOVERNMENT_TASK_ROUTER_VERSION,
    detection,
    primary: citizenService,
    citizenService,
    supportingGovernmentWorkflows: core,
    handoffs: detection.citizenService.handoffs,
    status: citizenService.status,
    evidenceAssessment: buildEvidenceAssessment(input, detection, citizenService),
    governance: {
      failClosed: Boolean(citizenService.governance?.failClosed),
      officialSourceFirst: true,
      noFabrication: true,
      piiMinimization: true,
      humanApprovalRequired: true,
      aiDecisionAllowed: false
    }
  };
}
