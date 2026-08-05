export const GP004_PROMPT = Object.freeze({
  moduleId: "GP004",
  version: "2.0.0",
  template: "Analyze {{financeType}} for amount {{amount}} against budget {{budget}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "government-finance-copilot",
    owner: "government-finance-team",
    description: "Deterministic public finance, allowance, reimbursement, budget, compliance, and audit analysis",
    requiredInputs: ["financeType", "amount", "budget", "knowledge", "template", "outputFormat"],
    outputSchema: {
      type: "object",
      required: ["template", "eligibility", "budget", "finance", "travel", "allowances", "reimbursement", "risk", "audit", "compliance"],
    },
    permissions: ["gp004:execute"],
  },
});

export const GP004_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "gp002-legal-review", "gp003-procurement-review", "eligibility-analysis",
  "budget-availability", "travel-analysis", "allowance-analysis", "reimbursement-analysis",
  "finance-and-risk-analysis", "audit-checklist", "compliance-analysis",
  "prompt-authorization", "output-validation", "context-update", "audit-and-metrics",
]);

export const GP004_POLICIES = Object.freeze([
  {
    id: "gp004-finance-analysis", version: "1.0.0",
    description: "Authorized finance roles may execute GP004", effect: "allow",
    roles: ["finance-officer", "supervisor", "administrator"],
    actions: ["gp004:execute"], resources: ["prompt:GP004"],
  },
  {
    id: "gp004-knowledge-access", version: "1.0.0",
    description: "Authorized finance roles may read public finance knowledge", effect: "allow",
    roles: ["finance-officer", "supervisor", "administrator"],
    actions: ["knowledge:read"], resources: ["knowledge:regulation", "knowledge:circular", "knowledge:manual"],
  },
]);
