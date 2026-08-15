export const BUDGET_OFFICIAL_EVIDENCE_ADAPTER_VERSION = '1.0';

const SEARCH_EVIDENCE_KEYS = Object.freeze([
  'currentBudgetRule',
  'latestRevenueActuals',
  'targetYearPlan'
]);

const text = (value) => String(value ?? '').trim();
const firstUsablePrimary = (searchResult) => {
  const list = searchResult?.evidence?.primaryResults;
  if (!Array.isArray(list)) return null;
  return list.find((item) => item?.official === true && text(item.sourceUrl) && text(item.title || item.documentTitle)) || null;
};

function verifiedSearchEvidence(key, searchResult, searchedAt = null) {
  if (!SEARCH_EVIDENCE_KEYS.includes(key)) return null;
  if (searchResult?.mode !== 'live') return null;
  if (searchResult?.evidence?.conclusionEligible !== true) return null;
  if (searchResult?.evidence?.verifiedCurrent !== true) return null;
  const source = firstUsablePrimary(searchResult);
  if (!source) return null;

  return Object.freeze({
    key,
    value: Object.freeze({
      documentTitle: text(source.documentTitle || source.title),
      sourceUrl: text(source.sourceUrl),
      sourceName: text(source.sourceName || source.issuingAgency || source.sourceId),
      documentNumber: text(source.documentNumber || source.reference),
      documentDate: text(source.documentDate || source.effectiveDate),
      status: text(source.status || 'current')
    }),
    official: true,
    verified: true,
    fresh: true,
    current: true,
    provenance: Object.freeze({
      sourceType: 'official-search',
      searchedAt: text(searchResult.searchedAt || searchedAt),
      provider: text(searchResult.provider),
      sourceUrl: text(source.sourceUrl),
      query: text(searchResult?.plan?.originalQuery || searchResult?.plan?.query)
    })
  });
}

export function buildBudgetOfficialEvidenceFromSearchMap(searchMap = {}, options = {}) {
  const evidence = SEARCH_EVIDENCE_KEYS
    .map((key) => verifiedSearchEvidence(key, searchMap?.[key], options.searchedAt || null))
    .filter(Boolean);

  const acceptedKeys = evidence.map((item) => item.key);
  const missingKeys = SEARCH_EVIDENCE_KEYS.filter((key) => !acceptedKeys.includes(key));
  const sourceRegister = evidence.length
    ? Object.freeze({
        key: 'budgetSourceRegister',
        value: Object.freeze(evidence.map((item) => Object.freeze({
          evidenceKey: item.key,
          sourceUrl: item.value.sourceUrl,
          documentTitle: item.value.documentTitle,
          sourceName: item.value.sourceName,
          documentDate: item.value.documentDate
        }))),
        official: false,
        verified: true,
        fresh: true,
        current: true,
        provenance: Object.freeze({ sourceType: 'derived-register', sourceEvidenceKeys: Object.freeze([...acceptedKeys]) })
      })
    : null;

  return Object.freeze({
    adapterVersion: BUDGET_OFFICIAL_EVIDENCE_ADAPTER_VERSION,
    status: missingKeys.length ? (evidence.length ? 'partial' : 'blocked-no-verified-official-evidence') : 'ready',
    evidence: Object.freeze(sourceRegister ? [...evidence, sourceRegister] : evidence),
    acceptedKeys: Object.freeze(acceptedKeys),
    missingKeys: Object.freeze(missingKeys),
    failClosed: missingKeys.length > 0
  });
}

export function mergeEvidenceByKey(existing = [], incoming = []) {
  const merged = new Map();
  for (const item of Array.isArray(existing) ? existing : []) {
    if (item?.key) merged.set(String(item.key), item);
  }
  for (const item of Array.isArray(incoming) ? incoming : []) {
    if (item?.key) merged.set(String(item.key), item);
  }
  return Object.freeze([...merged.values()]);
}

export { SEARCH_EVIDENCE_KEYS as BUDGET_OFFICIAL_SEARCH_EVIDENCE_KEYS };
