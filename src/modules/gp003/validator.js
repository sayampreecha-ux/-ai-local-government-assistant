import { GP003_OUTPUT_FORMATS, GP003_TEMPLATES } from "./templates/index.js";

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`);
}

export function validateGP003Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP003 input must be an object");
  requiredString(input.objective, "objective");
  requiredString(input.principal?.id, "principal.id");
  requiredString(input.principal?.role, "principal.role");
  if (!Number.isFinite(input.estimatedBudget) || input.estimatedBudget <= 0) throw new RangeError("estimatedBudget must be positive");
  if (!Array.isArray(input.specifications) || !input.specifications.length) throw new TypeError("specifications must be non-empty");
  if (input.specifications.some((item) => !item || typeof item.requirement !== "string" || !item.requirement.trim())) {
    throw new TypeError("Each specification requires requirement text");
  }
  if (!GP003_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP003 template");
  if (!GP003_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP003 output format");
  return {
    language: "th", submissionDays: 15, vendors: [], qualificationCriteria: [],
    marketPrices: [], contractTerms: [], documents: {}, ...structuredClone(input),
  };
}

export function validateGP003Output(output) {
  const required = ["template", "tor", "competition", "vendors", "pricing", "procurement", "risk", "compliance"];
  if (!output || typeof output !== "object" || required.some((field) => !(field in output))) {
    throw new TypeError("Invalid GP003 workflow output");
  }
  return true;
}
