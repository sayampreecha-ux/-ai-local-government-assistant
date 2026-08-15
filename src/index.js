import { ContextManager } from "./context-manager.js";
import { TransactionRouter } from "./transaction-router.js";
import { PromptRegistry } from "./prompt-registry.js";
import { KnowledgeRegistry } from "./knowledge-registry.js";
import { GovernanceLayer } from "./governance-layer.js";
import { Observability } from "./observability.js";

// Process-wide singleton keeps existing modules on a stable import surface.
export const contextManager = new ContextManager();

export const getContext = () => contextManager.getContext();
export const updateContext = (patchOrUpdater) => contextManager.updateContext(patchOrUpdater);
export const clearContext = () => contextManager.clearContext();
export const switchModule = (moduleId, workflowState) =>
  contextManager.switchModule(moduleId, workflowState);

export const transactionRouter = new TransactionRouter(contextManager);
export const routeRequest = (request, options) =>
  transactionRouter.routeRequest(request, options);
export const promptRegistry = new PromptRegistry(contextManager);
export const registerPrompt = (definition) => promptRegistry.registerPrompt(definition);
export const getPrompt = (moduleId, version) => promptRegistry.getPrompt(moduleId, version);
export const resolvePrompt = (moduleId, inputs, options) =>
  promptRegistry.resolvePrompt(moduleId, inputs, options);
export const knowledgeRegistry = new KnowledgeRegistry(contextManager);
export const registerKnowledge = (definition) =>
  knowledgeRegistry.registerKnowledge(definition);
export const getKnowledge = (id, version) => knowledgeRegistry.getKnowledge(id, version);
export const searchKnowledge = (query, filters) => knowledgeRegistry.search(query, filters);
export const governanceLayer = new GovernanceLayer(contextManager);
export const evaluateGovernance = (request) => governanceLayer.evaluate(request);
export const authorizePrompt = (definition, principal, payload) =>
  governanceLayer.authorizePrompt(definition, principal, payload);
export const authorizeKnowledge = (definition, principal, payload) =>
  governanceLayer.authorizeKnowledge(definition, principal, payload);
export const observability = new Observability(contextManager);

export { ContextManager, MODULES } from "./context-manager.js";
export { TransactionRouter, DEFAULT_DEFINITIONS, DEFAULT_OPTIONS } from "./transaction-router.js";
export { PromptRegistry, DEFAULT_PROMPTS, validatePromptDefinition } from "./prompt-registry.js";
export { KnowledgeRegistry, KNOWLEDGE_TYPES, validateKnowledgeDefinition } from "./knowledge-registry.js";
export { GovernanceLayer, POLICY_EFFECTS, SAFETY_EFFECTS, validatePolicy, validateSafetyRule } from "./governance-layer.js";
export { Observability, LOG_LEVELS } from "./observability.js";
export { WORKFLOWS, DEEP_WORKFLOWS, detectGovernmentWorkflows, runGovernmentWorkflow, runGovernmentWorkflowById } from "./government-workflow-suite.js";
export { evaluateWorkflowStage, executeDeepGovernmentWorkflow, buildCrossWorkflowCase, detectProcurementRisks } from "./government-workflow-engine.js";
export * from "./modules/gp001/index.js";
export default contextManager;
