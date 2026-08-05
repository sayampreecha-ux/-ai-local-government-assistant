import { GP005_TEMPLATE_LABELS } from "./templates/index.js";
function markdown(result, executive = false) {
  const sections = [
    `# ${GP005_TEMPLATE_LABELS[result.template]}`, `## Availability\nAvailable ${result.budget.available}; requested ${result.budget.requested}; sufficient ${result.budget.sufficient}`,
    `## Appropriation\nOrdinance valid: ${result.appropriation.ordinanceValid}; amendment required: ${result.appropriation.amendmentRequired}`,
    `## Transfer and Reserve\nTransfer authorized: ${result.transfer.authorized}; reserve sufficient: ${result.reserve.reserveFund.sufficient}`,
    `## Multi-year Commitment\n${result.commitment.years} year(s); annual commitment ${result.commitment.annualCommitment}`,
    `## Development Plan\nConsistent: ${result.developmentPlan.consistent}`, `## Fiscal Risk\n${result.risk.level} (${result.risk.score.toFixed(2)})`,
    `## Compliance\n${result.compliance.passed}/${result.compliance.total} passed`,
  ];
  return executive ? sections.filter((_, index) => [0, 1, 6, 7].includes(index)).join("\n\n") : sections.join("\n\n");
}
export function formatGP005Output(result, format, audit = {}) {
  if (format === "json") return structuredClone(result);
  if (format === "markdown") return markdown(result);
  if (format === "executive-report") return markdown(result, true);
  if (format === "audit-log") return { event: "gp005.budget-analysis", audit: structuredClone(audit), result: structuredClone(result) };
  if (format === "api-response") return { ok: true, moduleId: "GP005", data: structuredClone(result), meta: structuredClone(audit) };
  throw new RangeError(`Unknown GP005 output format: ${format}`);
}
