import { GP004_OUTPUT_FORMATS, GP004_TEMPLATES } from "./templates/index.js";

const FINANCE_TYPES = Object.freeze([
  "travel", "reimbursement", "training", "house-rental", "subsistence-meal",
  "medical-welfare", "maintenance-fund",
]);

function requiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new TypeError(`${field} is required`);
}

export function validateGP004Input(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("GP004 input must be an object");
  requiredString(input.purpose, "purpose");
  requiredString(input.principal?.id, "principal.id");
  requiredString(input.principal?.role, "principal.role");
  if (!FINANCE_TYPES.includes(input.financeType)) throw new RangeError("Invalid financeType");
  for (const field of ["requestedAmount", "budgetAllocated", "budgetCommitted"]) {
    if (!Number.isFinite(input[field]) || input[field] < 0) throw new RangeError(`${field} must be non-negative`);
  }
  if (!GP004_TEMPLATES.includes(input.template)) throw new RangeError("Invalid GP004 template");
  if (!GP004_OUTPUT_FORMATS.includes(input.outputFormat)) throw new RangeError("Invalid GP004 output format");
  return {
    language: "th", claims: [], receipts: [], approvals: [], employee: {}, travel: {},
    training: {}, allowances: {}, documents: {}, contract: {}, ...structuredClone(input),
  };
}

export function validateGP004Output(output) {
  const required = ["template", "eligibility", "budget", "finance", "travel", "allowances", "reimbursement", "risk", "audit", "compliance"];
  if (!output || typeof output !== "object" || required.some((field) => !(field in output))) {
    throw new TypeError("Invalid GP004 workflow output");
  }
  return true;
}

export { FINANCE_TYPES };
