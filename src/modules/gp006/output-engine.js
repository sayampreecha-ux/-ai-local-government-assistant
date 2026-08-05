import { GP006_TEMPLATE_LABELS } from "./templates/index.js";
function markdown(result) {
  return [`# ${GP006_TEMPLATE_LABELS[result.template]}`, `## Decision\n${result.hr.decision}`, `## Qualification\n${result.qualification.valid ? "Valid" : result.qualification.missing.join(", ")}`, `## Appointment\nEligible: ${result.appointment.eligible}`, `## Promotion\nEligible: ${result.promotion.eligible}`, `## Transfer\nEligible: ${result.transfer.eligible}`, `## Salary\nProposed: ${result.salary.proposed}`, `## Discipline\n${result.discipline.recommendedSanction}`, `## Retirement\n${result.retirement.reason}`, `## Workforce\nProjected gap: ${result.workforce.projectedGap}`, `## Recommendation\n${result.hr.recommendation}`].join("\n\n");
}
export function formatGP006Output(result, format, audit = {}) {
  if (format === "json") return structuredClone(result); if (format === "markdown") return markdown(result);
  if (format === "audit-log") return { event: "gp006.hr-analysis", audit: structuredClone(audit), result: structuredClone(result) };
  if (format === "api-response") return { ok: true, moduleId: "GP006", data: structuredClone(result), meta: structuredClone(audit) };
  throw new RangeError(`Unknown GP006 output format: ${format}`);
}
