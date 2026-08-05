export function analyzeDiscipline(input) {
  const evidenceCount = (input.discipline.evidence ?? []).length;
  const dueProcess = Boolean(input.discipline.noticeGiven && input.discipline.responseOpportunity && input.discipline.impartialCommittee);
  const severity = input.discipline.severity ?? "none";
  const sanction = severity === "gross" ? "dismissal-review" : severity === "serious" ? "major-disciplinary-review" : severity === "minor" ? "minor-disciplinary-review" : "none";
  return { substantiated: evidenceCount > 0, evidenceCount, dueProcess, severity, recommendedSanction: evidenceCount && dueProcess ? sanction : "further-investigation", procedurallyValid: dueProcess };
}
