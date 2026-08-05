export function buildTimeline(entries, asOfDate) {
  return entries.map((entry) => {
    const metadata = entry.metadata;
    const status = metadata.pending || metadata.effectiveDate > asOfDate
      ? "pending"
      : metadata.repealedDate && metadata.repealedDate <= asOfDate
        ? "repealed"
        : metadata.supersededBy
          ? "superseded"
          : metadata.status ?? "effective";
    return {
      knowledgeId: entry.id,
      version: metadata.version,
      effectiveDate: metadata.effectiveDate,
      repealedDate: metadata.repealedDate ?? null,
      supersededBy: metadata.supersededBy ?? null,
      status,
    };
  }).sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate) || a.knowledgeId.localeCompare(b.knowledgeId));
}
