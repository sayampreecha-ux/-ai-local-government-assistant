import { GP002_OUTPUT_FORMATS, GP002_TEMPLATES } from "./templates/index.js";

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`);
}

export function validateGP002Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP002 input must be an object");
  requiredString(input.facts, "facts");
  requiredString(input.question, "question");
  requiredString(input.principal?.id, "principal.id");
  requiredString(input.principal?.role, "principal.role");
  if (!GP002_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP002 template");
  if (!GP002_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP002 output format");
  return { language: "th", asOfDate: new Date().toISOString().slice(0, 10), ...structuredClone(input) };
}

export function validateGP002Output(output) {
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new TypeError("Invalid GP002 output");
  const required = ["template", "reasoning", "authority", "citations", "conflicts", "timeline", "risk"];
  const missing = required.filter((field) => !(field in output));
  if (missing.length) throw new TypeError(`GP002 output missing: ${missing.join(", ")}`);
  return true;
}
