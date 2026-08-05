export const GP002_PROMPT = Object.freeze({
  moduleId: "GP002",
  version: "2.0.0",
  template: "Perform {{analysisType}} using these facts: {{facts}}. Apply: {{authorities}}. Return {{outputFormat}}.",
  metadata: {
    category: "government-law-copilot",
    owner: "government-legal-team",
    description: "Deterministic government legal analysis with authority, citation, conflict, timeline, and risk controls",
    requiredInputs: ["analysisType", "facts", "authorities", "outputFormat"],
    outputSchema: {
      type: "object",
      required: ["template", "reasoning", "authority", "citations", "conflicts", "timeline", "risk"],
    },
    permissions: ["gp002:execute"],
  },
});

export const GP002_WORKFLOW = Object.freeze([
  "input-validation",
  "routing",
  "pdpa-detection",
  "knowledge-retrieval",
  "knowledge-authorization",
  "authority-analysis",
  "citation-analysis",
  "conflict-detection",
  "timeline-analysis",
  "legal-reasoning",
  "risk-analysis",
  "prompt-authorization",
  "approval-gate",
  "output-validation",
  "audit-and-metrics",
]);

export const GP002_POLICIES = Object.freeze([
  {
    id: "gp002-legal-analysis",
    version: "1.0.0",
    description: "Authorized legal roles may execute GP002",
    effect: "allow",
    roles: ["legal-officer", "supervisor", "administrator"],
    actions: ["gp002:execute"],
    resources: ["prompt:GP002"],
  },
  {
    id: "gp002-knowledge-access",
    version: "1.0.0",
    description: "Authorized legal roles may read government legal knowledge",
    effect: "allow",
    roles: ["legal-officer", "supervisor", "administrator"],
    actions: ["knowledge:read"],
    resources: ["knowledge:law", "knowledge:regulation", "knowledge:circular", "knowledge:manual"],
  },
]);

export const GP002_PDPA_RULE = Object.freeze({
  id: "gp002-pdpa-approval",
  field: "payload.pdpaDetected",
  operator: "equals",
  value: true,
  effect: "require_approval",
  message: "Legal analysis containing personal data requires approval",
});
