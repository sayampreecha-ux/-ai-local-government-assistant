export function analyzeProjectProcurement(input) {
  const required = input.project.procurementRequired === true;
  const plan = input.procurementPlan;
  const reasons = [...(required && !plan.method ? ["method-missing"] : []), ...(required && !plan.torReady ? ["tor-not-ready"] : []), ...(required && !plan.referencePriceReady ? ["reference-price-not-ready"] : []), ...(required && !plan.egpScheduled ? ["egp-not-scheduled"] : [])];
  return { required, ready: !required || reasons.length === 0, reasons, method: plan.method ?? null, packageCount: Number(plan.packageCount) || 0, competitionSafeguards: plan.competitionSafeguards === true };
}
