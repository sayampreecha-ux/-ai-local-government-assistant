import { runGovernmentWorkflow, detectGovernmentWorkflows } from "./government-workflow-suite.js";
import { detectCitizenServiceIntent, runCitizenServiceWorkflow } from "./citizen-service-workflow.js";

export const GOVERNMENT_TASK_ROUTER_VERSION = "5.0";

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

export function runGovernmentTaskV5(input = {}) {
  const detection = detectGovernmentTaskV5(input);
  if (!detection.citizenService.matched) {
    return {
      version: GOVERNMENT_TASK_ROUTER_VERSION,
      detection,
      primary: runGovernmentWorkflow(input),
      citizenService: null
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
