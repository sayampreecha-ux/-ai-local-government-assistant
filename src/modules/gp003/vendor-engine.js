export function analyzeVendors(vendors, criteria) {
  const assessments = vendors.map((vendor) => {
    const evidence = new Set(vendor.qualifications ?? []);
    const missing = criteria.filter((criterion) => !evidence.has(criterion));
    return { vendorId: vendor.id, qualified: missing.length === 0, missing };
  }).sort((a, b) => a.vendorId.localeCompare(b.vendorId));
  return {
    assessments,
    qualifiedCount: assessments.filter(({ qualified }) => qualified).length,
    criteria: [...criteria].sort(),
  };
}
