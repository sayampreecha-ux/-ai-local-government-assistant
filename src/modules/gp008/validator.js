import { GP008_OUTPUT_FORMATS, GP008_TEMPLATES } from "./templates/index.js";
function required(value, field) { if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`); }
export function validateGP008Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP008 input must be an object");
  required(input.project?.name, "project.name"); required(input.project?.objective, "project.objective"); required(input.principal?.id, "principal.id"); required(input.principal?.role, "principal.role");
  if (!Number.isFinite(input.project.budget) || input.project.budget < 0) throw new RangeError("project.budget must be non-negative");
  if (!GP008_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP008 template"); if (!GP008_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP008 output format");
  return { language: "th", project: {}, authority: {}, budget: {}, kpis: [], milestones: [], procurementPlan: {}, risks: [], monitoring: {}, ...structuredClone(input) };
}
export function validateGP008Output(output) { const fields = ["template", "project", "feasibility", "authority", "budget", "kpi", "timeline", "procurement", "risk"]; if (!output || fields.some((field) => !(field in output))) throw new TypeError("Invalid GP008 workflow output"); return true; }
