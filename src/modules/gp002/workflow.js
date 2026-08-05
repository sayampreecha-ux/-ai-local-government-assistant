import { analyzeAuthority } from "./authority-engine.js";
import { buildCitations } from "./citation-engine.js";
import { detectConflicts } from "./conflict-engine.js";
import { reasonLegally } from "./reasoning-engine.js";
import { assessRisk } from "./risk-engine.js";
import { buildTimeline } from "./timeline-engine.js";

export function runLegalWorkflow(input, entries) {
  const authority = analyzeAuthority(entries);
  const citations = buildCitations(entries);
  if (!citations.valid) throw new Error("Citation validation failed");
  const conflicts = detectConflicts(entries);
  const timeline = buildTimeline(entries, input.asOfDate);
  const reasoning = reasonLegally({
    facts: input.facts,
    question: input.question,
    authorities: authority,
    citations,
    conflicts,
  });
  const risk = assessRisk({ authority, citations, conflicts, reasoning, timeline });
  return { template: input.template, reasoning, authority, citations, conflicts, timeline, risk };
}
