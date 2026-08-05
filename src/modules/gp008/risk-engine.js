export function assessProjectRisk({ input, feasibility, authority, budget, kpi, timeline, procurement, crossModule }) {
  const factors = [
    ...(!feasibility.feasible ? [{ code: "feasibility", weight: 0.25 }] : []), ...(!authority.authorized ? [{ code: "authority", weight: 0.25 }] : []),
    ...(!budget.consistent ? [{ code: "budget", weight: 0.2 }] : []), ...(!kpi.valid ? [{ code: "kpi", weight: 0.1 }] : []),
    ...(!timeline.valid ? [{ code: "timeline", weight: 0.1 }] : []), ...(!procurement.ready ? [{ code: "procurement", weight: 0.15 }] : []),
    ...input.risks.filter((risk) => risk.probability * risk.impact >= 0.5).map((risk) => ({ code: risk.id, weight: Math.min(0.2, risk.probability * risk.impact * 0.2) })),
    ...Object.entries(crossModule).filter(([, value]) => value?.status !== "completed").map(([key]) => ({ code: `${key}-review-incomplete`, weight: 0.15 })),
  ];
  const score = Math.min(1, factors.reduce((sum, item) => sum + item.weight, 0));
  return { level: score >= 0.66 ? "high" : score >= 0.33 ? "medium" : "low", score, factors, matrix: input.risks.map((risk) => ({ id: risk.id, probability: risk.probability, impact: risk.impact, exposure: risk.probability * risk.impact, owner: risk.owner ?? null })).sort((a, b) => b.exposure - a.exposure || a.id.localeCompare(b.id)) };
}
