import { GP010_OUTPUT_FORMATS, GP010_TEMPLATES } from "./templates/index.js";
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP010Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP010 input must be an object");
  required(input.meeting?.id, "meeting.id"); required(input.meeting?.title, "meeting.title"); required(input.meeting?.date, "meeting.date"); required(input.asOfDate, "asOfDate"); required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  if (!GP010_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP010 template"); if (!GP010_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP010 output format");
  return { language: "th", agendaItems: [], participants: [], discussions: [], decisions: [], actionItems: [], linkedReviews: {}, ...structuredClone(input) };
}
export function validateGP010Output(output) { const fields = ["template", "agenda", "attendance", "minutes", "resolutions", "actions", "followup", "decisions", "summary", "audit", "package"]; if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP010 workflow output"); return true; }
