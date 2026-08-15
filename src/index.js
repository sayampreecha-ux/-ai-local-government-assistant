import { ContextManager } from "./context-manager.js";
import { TransactionRouter } from "./transaction-router.js";
import { PromptRegistry } from "./prompt-registry.js";
import { KnowledgeRegistry } from "./knowledge-registry.js";
import { GovernanceLayer } from "./governance-layer.js";
import { Observability } from "./observability.js";

const contextManager = new ContextManager();
const transactionRouter = new TransactionRouter(contextManager);
const promptRegistry = new PromptRegistry(contextManager);
const knowledgeRegistry = new KnowledgeRegistry(contextManager);
const governanceLayer = new GovernanceLayer(contextManager);

export const runtime = Object.freeze({
  contextManager,
  transactionRouter,
  promptRegistry,
  knowledgeRegistry,
  governanceLayer
});

export const routeTransaction = (input, options) => transactionRouter.route(input, options);
export const resolvePrompt = (moduleId, transactionType, context) => promptRegistry.resolve(moduleId, transactionType, context);
export const resolveKnowledge = (moduleId, query, options) => knowledgeRegistry.resolve(moduleId, query, options);
export const authorizeTransaction = (definition, principal, payload) => governanceLayer.authorizeTransaction(definition, principal, payload);
export const authorizePrompt = (definition, principal, payload) => governanceLayer.authorizePrompt(definition, principal, payload);
export const authorizeKnowledge = (definition, principal, payload) => governanceLayer.authorizeKnowledge(definition, principal, payload);
export const observability = new Observability(contextManager);

export { ContextManager, MODULES } from "./context-manager.js";
export { TransactionRouter, DEFAULT_DEFINITIONS, DEFAULT_OPTIONS } from "./transaction-router.js";
export { PromptRegistry, DEFAULT_PROMPTS, validatePromptDefinition } from "./prompt-registry.js";
export { KnowledgeRegistry, KNOWLEDGE_TYPES, validateKnowledgeDefinition } from "./knowledge-registry.js";
export { GovernanceLayer, POLICY_EFFECTS, SAFETY_EFFECTS, validatePolicy, validateSafetyRule } from "./governance-layer.js";
export { Observability, LOG_LEVELS } from "./observability.js";
export { WORKFLOWS, DEEP_WORKFLOWS, detectGovernmentWorkflows, runGovernmentWorkflow, runGovernmentWorkflowById, runGovernmentWorkflowByIdV2, transitionGovernmentWorkflowByIdV2 } from "./government-workflow-suite.js";
export { evaluateWorkflowStage, executeDeepGovernmentWorkflow, buildCrossWorkflowCase, detectProcurementRisks } from "./government-workflow-engine.js";
export { WORKFLOW_STATE_SCHEMA_VERSION, CROSS_WORKFLOW_HANDOFFS_V2, validateCompletedStagePrefixV2, createWorkflowStateV2, evaluateWorkflowStageV2, executeGovernmentWorkflowV2, transitionGovernmentWorkflowV2, buildCrossWorkflowCaseV2 } from "./government-workflow-state-machine-v2.js";
export * from "./modules/gp001/index.js";
export default contextManager;