import { ContextManager } from "./context-manager.js";

// Process-wide singleton keeps existing modules on a stable import surface.
export const contextManager = new ContextManager();

export const getContext = () => contextManager.getContext();
export const updateContext = (patchOrUpdater) => contextManager.updateContext(patchOrUpdater);
export const clearContext = () => contextManager.clearContext();
export const switchModule = (moduleId, workflowState) =>
  contextManager.switchModule(moduleId, workflowState);

export { ContextManager, MODULES } from "./context-manager.js";
export default contextManager;
