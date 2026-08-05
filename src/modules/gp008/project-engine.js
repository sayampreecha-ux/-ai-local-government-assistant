export function analyzeProject(input, analyses, crossModule) {
  const monitoringChecklist = [
    ["baseline-established", analyses.kpi.valid], ["budget-controlled", analyses.budget.consistent],
    ["timeline-baselined", analyses.timeline.valid], ["procurement-planned", analyses.procurement.ready],
    ["authority-confirmed", analyses.authority.authorized], ["risk-owner-assigned", input.risks.every((risk) => risk.owner)],
  ].map(([item, passed]) => ({ item, passed }));
  const gaps = [...monitoringChecklist.filter(({ passed }) => !passed).map(({ item }) => item), ...Object.entries(crossModule).filter(([, value]) => value?.status !== "completed").map(([key]) => `${key}-review-incomplete`)];
  return { name: input.project.name, objective: input.project.objective, beneficiaries: Number(input.project.beneficiaries) || 0, monitoringChecklist, decision: gaps.length || analyses.risk.level === "high" ? "revise" : "recommend", gaps, recommendation: gaps.length ? "Revise project controls before approval." : "Recommend project for competent approval.", crossModule };
}
