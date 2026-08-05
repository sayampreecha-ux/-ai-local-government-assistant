export function analyzePositionAllowance(input) {
  const requested = Number(input.allowances.requested) || 0; const cap = Number(input.position.allowanceCap) || 0;
  const eligible = input.position.allowanceEligible === true;
  return { eligible, requested, allowed: eligible ? Math.min(requested, cap) : 0, cap, reason: eligible ? "position-eligible" : "position-not-eligible" };
}
