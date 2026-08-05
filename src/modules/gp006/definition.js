export const GP006_PROMPT = Object.freeze({
  moduleId: "GP006", version: "2.0.0",
  template: "Analyze HR action {{action}} for position {{position}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "local-government-hr-copilot", owner: "government-hr-team",
    description: "Deterministic appointment, promotion, transfer, compensation, discipline, retirement, qualification, and workforce analysis",
    requiredInputs: ["action", "position", "knowledge", "template", "outputFormat"],
    outputSchema: { type: "object", required: ["template", "appointment", "promotion", "transfer", "discipline", "salary", "allowance", "workforce", "qualification", "retirement", "hr"] },
    permissions: ["gp006:execute"],
  },
});
export const GP006_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "gp002-legal-review", "gp004-finance-review", "gp005-budget-review",
  "qualification-validation", "appointment-analysis", "promotion-eligibility", "transfer-analysis",
  "salary-and-increment", "position-allowance", "disciplinary-analysis", "retirement-eligibility",
  "workforce-planning", "executive-hr-analysis", "prompt-authorization", "output-validation",
  "context-update", "audit-and-metrics",
]);
export const GP006_POLICIES = Object.freeze([
  { id: "gp006-hr-analysis", version: "1.0.0", description: "Authorized HR roles may execute GP006", effect: "allow", roles: ["hr-officer", "supervisor", "administrator"], actions: ["gp006:execute"], resources: ["prompt:GP006"] },
  { id: "gp006-knowledge-access", version: "1.0.0", description: "Authorized HR roles may read personnel knowledge", effect: "allow", roles: ["hr-officer", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:law", "knowledge:regulation", "knowledge:circular", "knowledge:manual"] },
]);
