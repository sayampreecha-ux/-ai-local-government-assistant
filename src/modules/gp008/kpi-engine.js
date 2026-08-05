export function evaluateKPIs(kpis) {
  const assessments = kpis.map((kpi) => ({ id: kpi.id, specific: Boolean(kpi.name), measurable: Number.isFinite(kpi.target), baselineSet: Number.isFinite(kpi.baseline), timeBound: Boolean(kpi.dueDate), ownerAssigned: Boolean(kpi.owner) })).sort((a, b) => a.id.localeCompare(b.id));
  const validCount = assessments.filter((item) => item.specific && item.measurable && item.baselineSet && item.timeBound && item.ownerAssigned).length;
  return { assessments, validCount, total: assessments.length, valid: assessments.length > 0 && validCount === assessments.length, qualityScore: assessments.length ? validCount / assessments.length : 0 };
}
