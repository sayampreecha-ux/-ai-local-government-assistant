import { TEMPLATE_LABELS } from "./templates/index.js";
import { maskPersonalData } from "./PDPA-engine.js";

function markdown(analysis) {
  const sections = [
    ["Facts", analysis.reasoning.facts],
    ["Issues", analysis.reasoning.issues.join("; ")],
    ["Applicable Law", analysis.citations.citations.map((item) => `- ${item.title} (${item.authority}, ${item.version})`).join("\n")],
    ["Analysis", analysis.reasoning.analysis],
    ["Conclusion", analysis.reasoning.conclusion],
    ["Recommendation", analysis.reasoning.recommendation],
    ["Risk", `${analysis.risk.level} (uncertainty ${analysis.risk.uncertaintyScore.toFixed(2)})`],
  ];
  return `# ${TEMPLATE_LABELS[analysis.template]}\n\n${sections.map(([heading, body]) => `## ${heading}\n\n${body}`).join("\n\n")}`;
}

export function formatGP002Output(analysis, format, audit = {}) {
  const safe = maskPersonalData(analysis);
  if (format === "json") return safe;
  if (format === "markdown") return markdown(safe);
  if (format === "audit-log") return { event: "gp002.analysis", audit: maskPersonalData(audit), result: safe };
  if (format === "api-response") return { ok: true, moduleId: "GP002", data: safe, meta: maskPersonalData(audit) };
  throw new RangeError(`Unknown GP002 output format: ${format}`);
}
