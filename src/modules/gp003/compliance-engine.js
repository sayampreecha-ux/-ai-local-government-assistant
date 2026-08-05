export function buildComplianceChecklist({ input, tor, competition, vendors, pricing, procurement, knowledgeCount }) {
  const checklist = [
    ["budget-approved", input.documents.budgetApproved === true],
    ["procurement-plan", input.documents.procurementPlan === true],
    ["tor-complete", tor.completenessScore === 1],
    ["no-specification-lock", !tor.specificationLockDetected],
    ["competition-fair", competition.level === "fair"],
    ["vendor-qualification", vendors.assessments.length === 0 || vendors.qualifiedCount > 0],
    ["reference-price", pricing.sampleSize >= 3],
    ["method-selected", procurement.recommendedMethod !== "revise-tor-before-selection"],
    ["authoritative-knowledge", knowledgeCount >= 7],
  ].map(([item, passed]) => ({ item, passed }));
  return {
    checklist,
    passed: checklist.filter(({ passed }) => passed).length,
    total: checklist.length,
    compliant: checklist.every(({ passed }) => passed),
  };
}
