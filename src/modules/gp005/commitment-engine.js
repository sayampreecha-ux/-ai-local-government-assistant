export function analyzeCommitment(input) {
  const years = Number(input.multiYear.years) || 1;
  const total = Number(input.multiYear.totalAmount) || input.requestedAmount;
  const annual = years > 0 ? total / years : total;
  return { multiYear: years > 1, years, totalAmount: total, annualCommitment: annual, approved: years === 1 || input.multiYear.approved === true, futureBudgetRisk: years > 1 && !input.multiYear.futureBudgetEvidence };
}
