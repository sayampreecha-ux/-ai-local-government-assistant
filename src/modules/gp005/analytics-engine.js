export function analyzeBudgetMetrics(input, budget, commitment) {
  const utilization = input.allocated === 0 ? 0 : (input.spent + input.committed) / input.allocated;
  const executionRate = input.allocated === 0 ? 0 : input.spent / input.allocated;
  return { utilization, executionRate, uncommittedBalance: budget.available, requestShare: input.allocated === 0 ? 1 : input.requestedAmount / input.allocated, multiYearAnnualShare: input.allocated === 0 ? 1 : commitment.annualCommitment / input.allocated, centralBudgetShare: input.allocated === 0 ? 0 : (Number(input.centralBudget.requestedAmount) || 0) / input.allocated };
}
