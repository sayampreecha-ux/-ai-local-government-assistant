export function reasonLegally({ facts, question, authorities, citations, conflicts }) {
  const applicableLaw = citations.citations.map(({ id, title, version }) => ({ id, title, version }));
  const confidence = applicableLaw.length === 0
    ? 0
    : Math.max(0, Math.min(1,
        applicableLaw.length / (applicableLaw.length + 1) - conflicts.length * 0.08,
      ));
  return {
    facts,
    issues: [question],
    applicableLaw,
    analysis: authorities.primaryAuthority
      ? `The highest ranked authority is ${authorities.primaryAuthority.authority}. ${conflicts.length} potential conflict(s) require hierarchy and temporal review.`
      : "No competent legal authority was established.",
    conclusion: conflicts.some(({ resolution }) => resolution === "legal-review-required")
      ? "Further authoritative legal review is required."
      : "The available authorities support a provisional legal position.",
    recommendation: "Verify cited text against the controlled official source before taking administrative action.",
    confidence,
  };
}
