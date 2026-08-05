export function analyzeReimbursement(claims, receipts, eligibility) {
  const receiptIds = new Set(receipts.map(({ id }) => id));
  const assessed = claims.map((claim) => {
    const documented = receiptIds.has(claim.receiptId);
    const allowedAmount = eligibility.eligible && documented
      ? Math.min(Number(claim.amount) || 0, Number(claim.cap) || Number(claim.amount) || 0)
      : 0;
    return { claimId: claim.id, requestedAmount: Number(claim.amount) || 0, documented, allowedAmount };
  }).sort((a, b) => a.claimId.localeCompare(b.claimId));
  return {
    claims: assessed,
    requestedTotal: assessed.reduce((sum, claim) => sum + claim.requestedAmount, 0),
    allowedTotal: assessed.reduce((sum, claim) => sum + claim.allowedAmount, 0),
  };
}
