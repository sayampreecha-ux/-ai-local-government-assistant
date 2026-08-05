export function analyzeProjectBudget(input) {
  const projectBudget = input.project.budget; const planBudget = Number(input.budget.planAmount) || 0; const available = Number(input.budget.available) || 0;
  return { projectBudget, planBudget, available, planAligned: planBudget >= projectBudget, sufficient: available >= projectBudget, consistent: planBudget >= projectBudget && available >= projectBudget, variance: planBudget - projectBudget, multiYearCovered: !input.budget.multiYear || input.budget.futureYearsCovered === true };
}
