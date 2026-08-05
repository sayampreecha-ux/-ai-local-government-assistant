import { GP005_OUTPUT_FORMATS, GP005_TEMPLATES } from "./templates/index.js";
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP005Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP005 input must be an object");
  required(input.purpose, "purpose"); required(input.classification, "classification");
  required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  for (const field of ["allocated", "spent", "committed", "requestedAmount"]) if (!Number.isFinite(input[field]) || input[field] < 0) throw new RangeError(`${field} must be non-negative`);
  if (!GP005_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP005 template");
  if (!GP005_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP005 output format");
  return { language: "th", transfer: {}, amendment: {}, reservation: {}, multiYear: {}, developmentPlan: {}, ordinance: {}, centralBudget: {}, reserveFund: {}, documents: {}, ...structuredClone(input) };
}
export function validateGP005Output(output) {
  const fields = ["template", "budget", "appropriation", "transfer", "reserve", "commitment", "developmentPlan", "timeline", "analytics", "risk", "compliance"];
  if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP005 workflow output");
  return true;
}
