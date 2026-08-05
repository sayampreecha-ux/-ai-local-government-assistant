export function analyzeFinance(input, budget, eligibility, reimbursement, crossModule) {
  const training = {
    participants: Number(input.training.participants) || 0,
    costPerParticipant: input.training.participants
      ? (Number(input.training.totalCost) || 0) / input.training.participants
      : 0,
    approved: input.financeType !== "training" || input.approvals.includes("training-plan"),
  };
  const factors = [
    ...(!budget.sufficient ? ["insufficient-budget"] : []),
    ...(!eligibility.eligible ? ["eligibility-gap"] : []),
    ...(budget.utilizationAfterRequest > 0.9 ? ["high-budget-utilization"] : []),
    ...(input.financeType === "training" && !training.approved ? ["training-plan-not-approved"] : []),
    ...(crossModule.legal?.status && crossModule.legal.status !== "completed" ? ["legal-review-incomplete"] : []),
    ...(crossModule.procurement?.status && crossModule.procurement.status !== "completed" ? ["procurement-review-incomplete"] : []),
  ];
  const score = Math.min(1, factors.length * 0.2);
  return {
    financeType: input.financeType,
    training,
    payableAmount: input.financeType === "reimbursement" ? reimbursement.allowedTotal : Math.min(input.requestedAmount, budget.availableBeforeRequest),
    crossModule,
    risk: { level: score >= 0.6 ? "high" : score >= 0.3 ? "medium" : "low", score, factors },
  };
}
