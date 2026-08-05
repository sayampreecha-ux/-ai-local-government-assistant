export const GP011_PROMPT = Object.freeze({
  moduleId: "GP011", version: "2.0.0",
  template: "Assess PDPA processing {{processing}} as of {{date}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: { category: "government-pdpa-copilot", owner: "government-privacy-team", description: "Deterministic personal-data detection, masking, consent, disclosure, retention, sharing, risk, approval, and audit assessment", requiredInputs: ["processing", "date", "knowledge", "template", "outputFormat"], outputSchema: { type: "object", required: ["template", "detection", "masking", "consent", "disclosure", "retention", "sharing", "risk", "checklist", "approval", "audit", "report"] }, permissions: ["gp011:execute"] },
});
export const GP011_WORKFLOW = Object.freeze(["input-validation", "routing", "knowledge-retrieval", "knowledge-authorization", "gp001-gp010-linked-reviews", "pdpa-detection", "sensitive-data-classification", "auto-masking", "consent-validation", "disclosure-review", "retention-policy", "data-sharing-assessment", "risk-scoring", "compliance-checklist", "approval-workflow", "audit-evidence", "compliance-report", "prompt-authorization", "output-validation", "context-update", "audit-and-metrics"]);
export const GP011_POLICIES = Object.freeze([
  { id: "gp011-privacy-analysis", version: "1.0.0", description: "Authorized privacy roles may execute GP011", effect: "allow", roles: ["data-protection-officer", "privacy-officer", "supervisor", "administrator"], actions: ["gp011:execute"], resources: ["prompt:GP011"] },
  { id: "gp011-knowledge-access", version: "1.0.0", description: "Authorized privacy roles may read GP011 knowledge", effect: "allow", roles: ["data-protection-officer", "privacy-officer", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:law", "knowledge:regulation", "knowledge:manual", "knowledge:circular"] },
]);
