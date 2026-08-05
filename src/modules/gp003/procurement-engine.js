export function recommendProcurementMethod({ estimatedBudget, competition, requestedMethod }) {
  const recommendedMethod = estimatedBudget <= 500000
    ? "specific-method"
    : estimatedBudget <= 5000000
      ? "e-bidding"
      : "e-bidding-enhanced-review";
  const method = competition.level === "restricted" ? "revise-tor-before-selection" : recommendedMethod;
  return {
    requestedMethod: requestedMethod ?? null,
    recommendedMethod: method,
    aligned: requestedMethod ? requestedMethod === method : null,
    rationale: competition.level === "restricted"
      ? "Competition restrictions must be corrected before method selection."
      : `Budget band and competition conditions indicate ${method}.`,
    egpWorkflow: [
      "procurement-plan", "tor-and-reference-price", "approval", "publish-egp",
      "vendor-submission", "evaluation", "award-announcement", "contract", "contract-administration",
    ],
  };
}
