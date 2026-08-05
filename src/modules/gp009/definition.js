export const GP009_PROMPT = Object.freeze({
  moduleId: "GP009", version: "2.0.0",
  template: "Create public communication {{template}} for {{subject}} and audience {{audience}} using {{knowledge}}. Return {{outputFormat}}.",
  metadata: {
    category: "government-public-relations-copilot", owner: "government-communications-team",
    description: "Deterministic government news, social, infographic, accessibility, approval, and publication packaging",
    requiredInputs: ["template", "subject", "audience", "knowledge", "outputFormat"],
    outputSchema: { type: "object", required: ["template", "news", "caption", "social", "infographic", "poster", "media", "accessibility", "approval", "checklist", "package"] },
    permissions: ["gp009:execute"],
  },
});
export const GP009_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "gp002-legal-review", "gp003-procurement-review", "gp004-finance-review", "gp005-budget-review", "gp007-council-review", "gp008-project-review",
  "news-generation", "caption-generation", "social-planning", "infographic-structure", "poster-layout",
  "image-metadata", "accessibility-review", "communication-checklist", "approval-workflow",
  "publication-package", "prompt-authorization", "output-validation", "context-update", "audit-and-metrics",
]);
export const GP009_POLICIES = Object.freeze([
  { id: "gp009-communications", version: "1.0.0", description: "Authorized communications roles may execute GP009", effect: "allow", roles: ["communications-officer", "supervisor", "administrator"], actions: ["gp009:execute"], resources: ["prompt:GP009"] },
  { id: "gp009-knowledge-access", version: "1.0.0", description: "Authorized communications roles may read PR knowledge", effect: "allow", roles: ["communications-officer", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:regulation", "knowledge:circular", "knowledge:manual", "knowledge:law"] },
]);
