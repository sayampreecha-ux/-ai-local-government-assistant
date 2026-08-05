export function analyzeFinanceCompliance({ eligibility, budget, audit, legalReview, procurementReview }) {
  const findings = [
    ...eligibility.reasons,
    ...(!budget.sufficient ? ["budget-control-failed"] : []),
    ...(!audit.readyForPayment ? ["audit-checklist-incomplete"] : []),
    ...(legalReview?.status && legalReview.status !== "completed" ? ["gp002-review-not-complete"] : []),
    ...(procurementReview?.status && procurementReview.status !== "completed" ? ["gp003-review-not-complete"] : []),
  ];
  return { compliant: findings.length === 0, findings: [...new Set(findings)].sort(), linkedReviews: { legal: legalReview?.status ?? "not-requested", procurement: procurementReview?.status ?? "not-requested" } };
}
