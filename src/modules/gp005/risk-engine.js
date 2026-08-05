export function assessFiscalRisk({ budget, appropriation, transfer, reserve, commitment, developmentPlan, analytics, crossModule }) {
  const factors = [
    ...(!budget.sufficient ? [{ code: "budget-shortfall", weight: 0.3 }] : []),
    ...(!budget.classificationValid ? [{ code: "invalid-classification", weight: 0.2 }] : []),
    ...(!appropriation.ordinanceValid ? [{ code: "ordinance-invalid", weight: 0.25 }] : []),
    ...(transfer.requested && !transfer.authorized ? [{ code: "transfer-unauthorized", weight: 0.2 }] : []),
    ...(!reserve.reserveFund.sufficient ? [{ code: "reserve-insufficient", weight: 0.2 }] : []),
    ...(commitment.futureBudgetRisk ? [{ code: "future-budget-evidence", weight: 0.15 }] : []),
    ...(!developmentPlan.consistent ? [{ code: "development-plan-mismatch", weight: 0.15 }] : []),
    ...(analytics.utilization > 0.9 ? [{ code: "high-utilization", weight: 0.1 }] : []),
    ...Object.entries(crossModule).filter(([, result]) => result?.status !== "completed").map(([module]) => ({ code: `${module}-incomplete`, weight: 0.15 })),
  ];
  const score = Math.min(1, factors.reduce((sum, factor) => sum + factor.weight, 0));
  return { level: score >= 0.66 ? "high" : score >= 0.33 ? "medium" : "low", score, factors };
}
