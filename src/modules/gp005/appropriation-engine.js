export function analyzeAppropriation(input, budget) {
  const ordinanceAmount = Number(input.ordinance.appropriatedAmount) || 0;
  const ordinanceValid = input.ordinance.approved === true && ordinanceAmount >= input.allocated;
  const amendmentRequired = input.amendment.requested === true || input.requestedAmount > budget.available;
  return { ordinanceValid, ordinanceAmount, annualBudgetYear: input.ordinance.fiscalYear ?? null, amendmentRequired, amendmentAuthorized: !amendmentRequired || input.amendment.approved === true, centralBudgetRequested: Number(input.centralBudget.requestedAmount) || 0, centralBudgetAuthorized: input.centralBudget.approved === true };
}
