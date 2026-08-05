export const GP010_PROMPT = Object.freeze({
  moduleId: "GP010", version: "2.0.0",
  template: "Process meeting {{meeting}} on {{date}} using {{knowledge}}. Produce {{template}} as {{outputFormat}}.",
  metadata: {
    category: "government-meeting-copilot", owner: "government-meeting-team",
    description: "Deterministic agenda, minutes, resolution, attendance, action, follow-up, decision, reminder, audit, and export packaging",
    requiredInputs: ["meeting", "date", "knowledge", "template", "outputFormat"],
    outputSchema: { type: "object", required: ["template", "agenda", "attendance", "minutes", "resolutions", "actions", "followup", "decisions", "summary", "audit", "package"] },
    permissions: ["gp010:execute"],
  },
});
export const GP010_WORKFLOW = Object.freeze([
  "input-validation", "routing", "knowledge-retrieval", "knowledge-authorization", "gp001-gp009-linked-reviews",
  "agenda-builder", "attendance-validation", "minutes-generation", "resolution-drafting",
  "action-item-extraction", "follow-up-tracking", "decision-register", "meeting-summary",
  "executive-summary", "reminder-package", "audit-trail", "export-package",
  "prompt-authorization", "output-validation", "context-update", "audit-and-metrics",
]);
export const GP010_POLICIES = Object.freeze([
  { id: "gp010-meeting-analysis", version: "1.0.0", description: "Authorized meeting roles may execute GP010", effect: "allow", roles: ["meeting-secretary", "supervisor", "administrator"], actions: ["gp010:execute"], resources: ["prompt:GP010"] },
  { id: "gp010-knowledge-access", version: "1.0.0", description: "Authorized meeting roles may read meeting knowledge", effect: "allow", roles: ["meeting-secretary", "supervisor", "administrator"], actions: ["knowledge:read"], resources: ["knowledge:law", "knowledge:regulation", "knowledge:circular", "knowledge:manual"] },
]);
