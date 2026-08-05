export function checkBudget({ budgetAllocated, budgetCommitted, requestedAmount }) {
  const availableBeforeRequest = Math.max(0, budgetAllocated - budgetCommitted);
  const sufficient = availableBeforeRequest >= requestedAmount;
  return {
    allocated: budgetAllocated,
    committed: budgetCommitted,
    availableBeforeRequest,
    requested: requestedAmount,
    sufficient,
    remainingAfterRequest: sufficient ? availableBeforeRequest - requestedAmount : availableBeforeRequest,
    utilizationAfterRequest: budgetAllocated === 0 ? 1 : Math.min(1, (budgetCommitted + requestedAmount) / budgetAllocated),
  };
}
