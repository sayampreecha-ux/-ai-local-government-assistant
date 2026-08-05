import { GP006_OUTPUT_FORMATS, GP006_TEMPLATES } from "./templates/index.js";
export const HR_ACTIONS = Object.freeze(["appointment", "promotion", "transfer", "salary", "allowance", "discipline", "retirement", "workforce", "qualification"]);
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP006Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP006 input must be an object");
  required(input.position?.id, "position.id"); required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  if (!HR_ACTIONS.includes(input.action)) throw new RangeError("Invalid HR action");
  if (!GP006_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP006 template");
  if (!GP006_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP006 output format");
  return { language: "th", asOfDate: null, employee: {}, candidate: {}, promotion: {}, transfer: {}, discipline: {}, salary: {}, allowances: {}, workforce: {}, ...structuredClone(input) };
}
export function validateGP006Output(output) {
  const fields = ["template", "appointment", "promotion", "transfer", "discipline", "salary", "allowance", "workforce", "qualification", "retirement", "hr"];
  if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP006 workflow output"); return true;
}
