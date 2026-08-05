export function assessProcurementRisk({ tor, competition, vendors, pricing, procurement, contractTerms }) {
  const factors = [
    ...(tor.specificationLockDetected ? [{ code: "specification-lock", weight: 0.35 }] : []),
    ...(competition.level !== "fair" ? [{ code: "competition", weight: 0.2 }] : []),
    ...(vendors.assessments.length > 0 && vendors.qualifiedCount < 2 ? [{ code: "vendor-concentration", weight: 0.15 }] : []),
    ...(pricing.status !== "reasonable" ? [{ code: "pricing", weight: 0.15 }] : []),
    ...(procurement.recommendedMethod === "revise-tor-before-selection" ? [{ code: "method-blocked", weight: 0.15 }] : []),
    ...(!contractTerms.includes("termination") ? [{ code: "missing-termination-clause", weight: 0.1 }] : []),
    ...(!contractTerms.includes("penalty") ? [{ code: "missing-penalty-clause", weight: 0.1 }] : []),
  ];
  const score = Math.min(1, factors.reduce((sum, factor) => sum + factor.weight, 0));
  return { level: score >= 0.66 ? "high" : score >= 0.33 ? "medium" : "low", score, factors };
}
