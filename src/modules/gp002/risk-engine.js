export function assessRisk({ authority, citations, conflicts, reasoning, timeline }) {
  const uncertaintyScore = Math.min(1, Math.max(0,
    (1 - reasoning.confidence) * 0.45 +
    conflicts.length * 0.15 +
    (citations.valid ? 0 : 0.25) +
    (authority.primaryAuthority ? 0 : 0.25) +
    timeline.filter(({ status }) => status !== "effective").length * 0.05,
  ));
  return {
    level: uncertaintyScore >= 0.66 ? "high" : uncertaintyScore >= 0.33 ? "medium" : "low",
    uncertaintyScore,
    factors: [
      ...(conflicts.length ? ["conflicting-authorities"] : []),
      ...(!citations.valid ? ["invalid-citation"] : []),
      ...(!authority.primaryAuthority ? ["authority-not-established"] : []),
      ...(timeline.some(({ status }) => status !== "effective") ? ["timeline-status"] : []),
    ],
  };
}
