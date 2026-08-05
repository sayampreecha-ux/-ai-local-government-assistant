const TYPE_WEIGHT = Object.freeze({ law: 100, regulation: 85, circular: 65, manual: 45, faq: 25, dataset: 30, template: 20, prompt: 35 });
export function authorityScore(document) { return Math.min(100, Math.max(TYPE_WEIGHT[document.type] ?? 0, Number(document.hierarchy ?? 0))); }
export function rankAuthority(documents) { return documents.map((document) => ({ ...document, authorityScore: authorityScore(document) })).sort((a, b) => b.authorityScore - a.authorityScore || b.effectiveDate.localeCompare(a.effectiveDate) || a.id.localeCompare(b.id)); }
