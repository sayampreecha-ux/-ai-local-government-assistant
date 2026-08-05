import { GP007_OUTPUT_FORMATS, GP007_TEMPLATES } from "./templates/index.js";
export const COUNCIL_TYPES = Object.freeze(["provincial", "municipal", "subdistrict"]);
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP007Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP007 input must be an object");
  required(input.subject, "subject"); required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  if (!COUNCIL_TYPES.includes(input.councilType)) throw new RangeError("Invalid councilType");
  if (!Number.isInteger(input.totalMembers) || input.totalMembers <= 0) throw new RangeError("totalMembers must be positive integer");
  if (!GP007_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP007 template");
  if (!GP007_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP007 output format");
  return { language: "th", agendaItems: [], motion: {}, attendance: [], voting: {}, meeting: {}, bylaw: {}, ...structuredClone(input) };
}
export function validateGP007Output(output) { const fields = ["template", "agenda", "motion", "quorum", "voting", "meeting", "bylaw", "authority", "council", "compliance"]; if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP007 workflow output"); return true; }
