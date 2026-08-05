const CLASSIFICATIONS = Object.freeze(["personnel", "operating", "investment", "subsidy", "other"]);
export function analyzeBudget(input) {
  const available = Math.max(0, input.allocated - input.spent - input.committed);
  return { allocated: input.allocated, spent: input.spent, committed: input.committed, available, requested: input.requestedAmount, sufficient: available >= input.requestedAmount, shortfall: Math.max(0, input.requestedAmount - available), classification: input.classification, classificationValid: CLASSIFICATIONS.includes(input.classification) };
}
export { CLASSIFICATIONS };
