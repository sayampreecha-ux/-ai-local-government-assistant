export const GP005_PROMPT = Object.freeze({
  moduleId: "GP005",
  version: "2.0.0",
  template: "Analyze budget request {{request}} under classification {{classification}} against appropriation {{appropriation}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "government-budget-copilot",
    owner: "government-budget-team",
    description: "Deterministic appropriation, transfer, reserve, commitment, plan, compliance, risk, and budget analytics",
    requiredInputs: ["request", "classification", "appropriation", "knowledge", "template", "outputFormat"],
    outputSchema: { type: "object", required: ["template", "budget", "appropriation", "transfer", "reserve", "commitment", "developmentPlan", "timeline", "analytics", "risk", "compliance"] },
    permissions: ["gp005:execute"],
  },
});

export const GP005_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "gp002-legal-compliance", "gp003-procurement-budget-validation", "gp004-financial-eligibility",
  "availability-and-sufficiency", "classification", "appropriation-and-ordinance",
  "transfer-and-amendment", "reservation", "multi-year-commitment", "development-plan-consistency",
  "central-and-reserve-analysis", "timeline", "analytics", "fiscal-risk", "compliance",
  "prompt-authorization", "output-validation", "context-update", "audit-and-metrics",
]);

export const GP005_POLICIES = Object.freeze([
  { id: "gp005-budget-analysis", version: "1.0.0", description: "Authorized budget roles may execute GP005", effect: "allow", roles: ["budget-officer", "supervisor", "administrator"], actions: ["gp005:execute"], resources: ["prompt:GP005"] },
  { id: "gp005-knowledge-access", version: "1.0.0", description: "Authorized budget roles may read budget knowledge", effect: "allow", roles: ["budget-officer", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:regulation", "knowledge:circular", "knowledge:manual"] },
]);
