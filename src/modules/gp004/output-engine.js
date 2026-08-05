import { GP004_TEMPLATE_LABELS } from "./templates/index.js";

function markdown(result) {
  return [
    `# ${GP004_TEMPLATE_LABELS[result.template]}`,
    `## Eligibility\n${result.eligibility.eligible ? "Eligible" : result.eligibility.reasons.join(", ")}`,
    `## Budget\nAvailable ${result.budget.availableBeforeRequest}; requested ${result.budget.requested}; sufficient ${result.budget.sufficient}`,
    `## Payable Amount\n${result.finance.payableAmount}`,
    `## Financial Risk\n${result.risk.level} (${result.risk.score.toFixed(2)})`,
    `## Audit Checklist\n${result.audit.passed}/${result.audit.total} passed`,
    `## Compliance\n${result.compliance.compliant ? "Compliant" : result.compliance.findings.join(", ")}`,
  ].join("\n\n");
}

export function formatGP004Output(result, format, audit = {}) {
  if (format === "json") return structuredClone(result);
  if (format === "markdown") return markdown(result);
  if (format === "audit-log") return { event: "gp004.finance-analysis", audit: structuredClone(audit), result: structuredClone(result) };
  if (format === "api-response") return { ok: true, moduleId: "GP004", data: structuredClone(result), meta: structuredClone(audit) };
  throw new RangeError(`Unknown GP004 output format: ${format}`);
}
