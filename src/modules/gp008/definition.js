export const GP008_PROMPT = Object.freeze({
  moduleId: "GP008", version: "2.0.0",
  template: "Analyze project {{project}} for objective {{objective}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "local-government-project-copilot", owner: "government-project-team",
    description: "Deterministic proposal, feasibility, authority, budget, KPI, timeline, procurement, risk, monitoring, and decision analysis",
    requiredInputs: ["project", "objective", "knowledge", "template", "outputFormat"],
    outputSchema: { type: "object", required: ["template", "project", "feasibility", "authority", "budget", "kpi", "timeline", "procurement", "risk"] },
    permissions: ["gp008:execute"],
  },
});
export const GP008_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "gp002-legal-review", "gp003-procurement-review", "gp004-finance-review", "gp005-budget-review", "gp007-council-review",
  "proposal-analysis", "feasibility-study", "authority-validation", "budget-consistency",
  "kpi-evaluation", "timeline-review", "procurement-planning", "risk-assessment",
  "monitoring-checklist", "decision-recommendation", "prompt-authorization", "output-validation", "context-update", "audit-and-metrics",
]);
export const GP008_POLICIES = Object.freeze([
  { id: "gp008-project-analysis", version: "1.0.0", description: "Authorized project roles may execute GP008", effect: "allow", roles: ["project-officer", "supervisor", "administrator"], actions: ["gp008:execute"], resources: ["prompt:GP008"] },
  { id: "gp008-knowledge-access", version: "1.0.0", description: "Authorized project roles may read project knowledge", effect: "allow", roles: ["project-officer", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:regulation", "knowledge:circular", "knowledge:manual"] },
]);
