export const GP003_PROMPT = Object.freeze({
  moduleId: "GP003",
  version: "2.0.0",
  template: "Analyze procurement objective {{objective}} with budget {{budget}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "government-procurement-copilot",
    owner: "government-procurement-team",
    description: "Deterministic TOR, competition, vendor, pricing, method, compliance, and contract-risk analysis",
    requiredInputs: ["objective", "budget", "knowledge", "template", "outputFormat"],
    outputSchema: {
      type: "object",
      required: ["template", "tor", "competition", "vendors", "pricing", "procurement", "risk", "compliance"],
    },
    permissions: ["gp003:execute"],
  },
});

export const GP003_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization",
  "tor-review", "specification-lock-detection", "competition-analysis",
  "vendor-qualification", "pricing-analysis", "method-recommendation", "egp-workflow",
  "contract-risk", "compliance-checklist", "prompt-authorization", "output-validation",
  "context-update", "audit-and-metrics",
]);

export const GP003_POLICIES = Object.freeze([
  {
    id: "gp003-procurement-analysis", version: "1.0.0",
    description: "Authorized procurement roles may execute GP003", effect: "allow",
    roles: ["procurement-officer", "supervisor", "administrator"],
    actions: ["gp003:execute"], resources: ["prompt:GP003"],
  },
  {
    id: "gp003-knowledge-access", version: "1.0.0",
    description: "Authorized procurement roles may read procurement knowledge", effect: "allow",
    roles: ["procurement-officer", "supervisor", "administrator"],
    actions: ["knowledge:read"], resources: ["knowledge:law", "knowledge:regulation", "knowledge:circular", "knowledge:manual"],
  },
]);
