export function analyzePromotion(input, qualification) {
  const tenure = Number(input.promotion.tenureYears) || 0; const minimum = Number(input.promotion.minimumTenureYears) || 0;
  const reasons = [...(tenure < minimum ? ["minimum-tenure-not-met"] : []), ...(!qualification.valid ? ["qualification-gap"] : []), ...((Number(input.promotion.performanceScore) || 0) < (Number(input.promotion.minimumPerformanceScore) || 0) ? ["performance-below-threshold"] : []), ...(input.discipline.activeCase ? ["active-disciplinary-case"] : [])];
  return { eligible: reasons.length === 0, reasons, tenureYears: tenure, requiredTenureYears: minimum };
}
