const sources = [
  ["local-budget-regulations", "regulation", "Local Government Budget Regulations", "Ministry of Interior", 95],
  ["moi-regulations", "regulation", "Ministry of Interior Regulations", "Ministry of Interior", 90],
  ["dla-circulars", "circular", "DLA Circulars", "Department of Local Administration", 75],
  ["cgd-guidance", "manual", "Comptroller General Guidance", "Comptroller General's Department", 80],
  ["annual-budget-ordinance", "regulation", "Annual Budget Ordinance", "Local Council", 90],
  ["local-development-plan", "manual", "Local Development Plan", "Local Government Authority", 80],
  ["strategic-plan", "manual", "Strategic Plan", "Local Government Authority", 75],
  ["financial-regulations", "regulation", "Financial Regulations", "Ministry of Finance", 90],
  ["budget-transfer-rules", "regulation", "Budget Transfer Rules", "Ministry of Interior", 85],
  ["reserve-fund-rules", "regulation", "Reserve Fund Rules", "Ministry of Interior", 85],
  ["audit-guidelines", "manual", "Audit Guidelines", "State Audit Office", 80],
  ["audit-findings", "manual", "Audit Findings", "State Audit Office", 70],
];
export const GP005_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp005-${slug}`, type, title, reference: `govprompt://knowledge/gp005/${slug}`,
  metadata: { source: `${title} GP005 Budget Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["public-budget", slug], language: "th", confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective" },
})));
