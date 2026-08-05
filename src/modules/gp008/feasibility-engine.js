export function analyzeFeasibility(project) {
  const costs = Number(project.estimatedCost) || Number(project.budget) || 0; const benefits = Number(project.estimatedBenefit) || 0;
  const dimensions = { technical: project.technicalFeasible === true, operational: project.operationalFeasible === true, legal: project.legalFeasible !== false, environmental: project.environmentalFeasible !== false, financial: benefits >= costs || project.nonFinancialBenefit === true };
  return { dimensions, feasible: Object.values(dimensions).every(Boolean), cost: costs, benefit: benefits, benefitCostRatio: costs === 0 ? null : benefits / costs, alternativesConsidered: (project.alternatives ?? []).length };
}
