export function analyzeAuthority(entries) {
  const ranked = entries.map((entry) => ({
    knowledgeId: entry.id,
    authority: entry.metadata.authority,
    hierarchy: entry.metadata.hierarchy ?? 0,
    competentAgency: entry.metadata.authority,
    delegation: entry.metadata.delegation ?? "not-established",
    jurisdiction: entry.metadata.jurisdiction ?? "government-administration",
  })).sort((a, b) => b.hierarchy - a.hierarchy || a.knowledgeId.localeCompare(b.knowledgeId));
  return {
    primaryAuthority: ranked[0] ?? null,
    competentAgencies: [...new Set(ranked.map(({ competentAgency }) => competentAgency))],
    delegationStatus: ranked.some(({ delegation }) => delegation !== "not-established") ? "identified" : "requires-verification",
    jurisdiction: ranked.map(({ jurisdiction }) => jurisdiction),
    ranked,
  };
}
