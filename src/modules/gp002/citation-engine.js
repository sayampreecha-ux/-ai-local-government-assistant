export function buildCitations(entries) {
  const citations = entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    authority: entry.metadata.authority,
    version: entry.metadata.version,
    effectiveDate: entry.metadata.effectiveDate,
    reference: entry.reference ?? null,
    confidence: entry.metadata.confidence,
    hierarchy: entry.metadata.hierarchy ?? 0,
    valid: Boolean(entry.reference && entry.metadata.authority && entry.metadata.effectiveDate),
    crossReferences: entries
      .filter((candidate) => candidate.id !== entry.id && candidate.metadata.tags.some((tag) => entry.metadata.tags.includes(tag)))
      .map(({ id }) => id),
  })).sort((a, b) => b.hierarchy - a.hierarchy || b.confidence - a.confidence || a.id.localeCompare(b.id));
  return { citations, valid: citations.length > 0 && citations.every(({ valid }) => valid) };
}
