import { GP011_OUTPUT_FORMATS, GP011_TEMPLATES } from "./templates/index.js";
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP011Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP011 input must be an object");
  required(input.processing?.id, "processing.id"); required(input.processing?.purpose, "processing.purpose"); required(input.asOfDate, "asOfDate"); required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  if (!GP011_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP011 template"); if (!GP011_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP011 output format");
  return { language: "th", records: [], consentRecords: [], disclosures: [], retentionRules: [], sharing: [], approvals: [], linkedReviews: {}, ...structuredClone(input) };
}
export function validateGP011Output(output) { const fields = ["template", "detection", "masking", "consent", "disclosure", "retention", "sharing", "risk", "checklist", "approval", "audit", "report"]; if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP011 workflow output"); return true; }
