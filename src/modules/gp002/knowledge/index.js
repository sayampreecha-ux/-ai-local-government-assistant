const sources = [
  ["acts", "law", "Acts", "Parliament", 100],
  ["royal-decrees", "law", "Royal Decrees", "The Crown and Cabinet", 90],
  ["ministerial-regulations", "regulation", "Ministerial Regulations", "Responsible Ministry", 80],
  ["moi-regulations", "regulation", "MoI Regulations", "Ministry of Interior", 75],
  ["treasury-regulations", "regulation", "Treasury Regulations", "Ministry of Finance", 75],
  ["local-government-regulations", "regulation", "Local Government Regulations", "Local Government Authority", 60],
  ["dla-circulars", "circular", "DLA Circulars", "Department of Local Administration", 50],
  ["council-resolutions", "manual", "Council Resolutions", "Competent Council", 45],
  ["legal-opinions", "manual", "Legal Opinions", "Government Legal Counsel", 40],
  ["court-decisions", "law", "Court Decisions", "Court of competent jurisdiction", 85],
  ["audit-findings", "manual", "Audit Findings", "State Audit Office", 35],
];

export const GP002_KNOWLEDGE = Object.freeze(sources.map(
  ([slug, type, title, authority, hierarchy]) => ({
    id: `gp002-${slug}`,
    type,
    title,
    reference: `govprompt://knowledge/gp002/${slug}`,
    metadata: {
      source: `${title} Controlled Corpus`,
      authority,
      version: "1.0",
      effectiveDate: "2026-01-01",
      category: slug,
      tags: ["government-law", slug],
      language: "th",
      confidence: Math.min(0.99, 0.75 + hierarchy / 500),
      hierarchy,
      status: "effective",
    },
  }),
));
