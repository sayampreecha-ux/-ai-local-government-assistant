export function applicableEvidence() {
  return {
    sources: [{ id: 'rule', primary: true, opened: true, locator: 'fixture://primary-rule#section-1' }],
    reviews: Object.fromEntries(['AUTHORITY', 'TIME', 'VERSION', 'FACT_MATCH', 'LATER_CHANGE', 'CONFLICT_TRANSITION'].map(key => [key, {
      status: 'VERIFIED', reason: `Synthetic reviewer assessment: ${key}`, sourceIds: ['rule']
    }]))
  };
}
