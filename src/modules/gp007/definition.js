export const GP007_PROMPT = Object.freeze({
  moduleId: "GP007", version: "2.0.0",
  template: "Analyze {{councilType}} council matter {{subject}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "local-government-council-copilot", owner: "government-council-team",
    description: "Deterministic agenda, motion, quorum, voting, resolution, ordinance, authority, procedure, and council-risk analysis",
    requiredInputs: ["councilType", "subject", "knowledge", "template", "outputFormat"],
    outputSchema: { type: "object", required: ["template", "agenda", "motion", "quorum", "voting", "meeting", "bylaw", "authority", "council", "compliance"] },
    permissions: ["gp007:execute"],
  },
});
export const GP007_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "gp002-legal-review", "gp005-budget-review", "gp006-personnel-review",
  "agenda-validation", "motion-analysis", "quorum-verification", "voting-rules",
  "resolution-validation", "ordinance-review", "authority-determination", "meeting-workflow",
  "procedure-compliance", "council-risk", "prompt-authorization", "output-validation",
  "context-update", "audit-and-metrics",
]);
export const GP007_POLICIES = Object.freeze([
  { id: "gp007-council-analysis", version: "1.0.0", description: "Authorized council roles may execute GP007", effect: "allow", roles: ["council-secretary", "supervisor", "administrator"], actions: ["gp007:execute"], resources: ["prompt:GP007"] },
  { id: "gp007-knowledge-access", version: "1.0.0", description: "Authorized council roles may read council knowledge", effect: "allow", roles: ["council-secretary", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:law", "knowledge:regulation", "knowledge:circular", "knowledge:manual"] },
]);
