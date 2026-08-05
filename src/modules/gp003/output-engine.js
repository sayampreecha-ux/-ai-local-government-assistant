import { GP003_TEMPLATE_LABELS } from "./templates/index.js";

function toMarkdown(result) {
  return [
    `# ${GP003_TEMPLATE_LABELS[result.template]}`,
    `## TOR Review\nCompleteness: ${(result.tor.completenessScore * 100).toFixed(0)}%; specification lock: ${result.tor.specificationLockDetected}`,
    `## Competition\n${result.competition.level} (${result.competition.fairnessScore}/100)`,
    `## Vendor Qualification\n${result.vendors.qualifiedCount} qualified vendor(s)`,
    `## Pricing\n${result.pricing.status}`,
    `## Recommended Method\n${result.procurement.recommendedMethod}: ${result.procurement.rationale}`,
    `## Contract Risk\n${result.risk.level} (${result.risk.score.toFixed(2)})`,
    `## Audit Checklist\n${result.compliance.passed}/${result.compliance.total} passed`,
  ].join("\n\n");
}

export function formatGP003Output(result, format, audit = {}) {
  if (format === "json") return structuredClone(result);
  if (format === "markdown") return toMarkdown(result);
  if (format === "audit-log") return { event: "gp003.procurement-analysis", audit: structuredClone(audit), result: structuredClone(result) };
  if (format === "api-response") return { ok: true, moduleId: "GP003", data: structuredClone(result), meta: structuredClone(audit) };
  throw new RangeError(`Unknown GP003 output format: ${format}`);
}
