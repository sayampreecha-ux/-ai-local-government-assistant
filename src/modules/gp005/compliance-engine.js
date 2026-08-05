export function analyzeBudgetCompliance({ input, budget, appropriation, transfer, reserve, commitment, developmentPlan, risk, knowledgeCount, crossModule }) {
  const checklist = [
    ["budget-available", budget.sufficient], ["classification-valid", budget.classificationValid],
    ["ordinance-valid", appropriation.ordinanceValid], ["amendment-authorized", appropriation.amendmentAuthorized],
    ["transfer-authorized", transfer.authorized], ["reservation-supported", reserve.reservation.amount === 0 || reserve.reservation.supported],
    ["reserve-authorized", reserve.reserveFund.requested === 0 || reserve.reserveFund.authorized],
    ["commitment-approved", commitment.approved], ["development-plan-consistent", developmentPlan.consistent],
    ["authoritative-knowledge", knowledgeCount >= 12], ["supporting-documents", input.documents.budgetCertification === true],
    ["linked-reviews-complete", Object.values(crossModule).every(({ status }) => status === "completed")],
    ["fiscal-risk-acceptable", risk.level !== "high"],
  ].map(([item, passed]) => ({ item, passed }));
  return { checklist, passed: checklist.filter(({ passed }) => passed).length, total: checklist.length, compliant: checklist.every(({ passed }) => passed) };
}
