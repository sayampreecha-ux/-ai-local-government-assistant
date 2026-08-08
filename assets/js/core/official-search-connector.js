(() => {
  'use strict';

  function normalize(value) {
    return String(value ?? '').normalize('NFKC').trim();
  }

  function quote(value) {
    const text = normalize(value).replace(/"/g, '');
    return text ? `"${text}"` : '';
  }

  function createSearchPlan(query, { limitSources = 6 } = {}) {
    const q = normalize(query);
    if (!q) throw new TypeError('query must be a non-empty string');
    const rank = window.GovPromptCore.rankOfficialSources;
    if (typeof rank !== 'function') throw new Error('Official source registry is unavailable');

    const sources = rank(q).slice(0, Math.max(1, limitSources));
    const plans = sources.map(source => Object.freeze({
      sourceId: source.id,
      sourceName: source.name,
      host: source.host,
      tier: source.tier,
      priority: source.priority,
      query: `site:${source.host} ${q}`,
      exactQuery: `site:${source.host} ${quote(q)}`,
      sourceHome: `https://${source.host}/`
    }));

    return Object.freeze({
      query: q,
      sources: Object.freeze(sources),
      plans: Object.freeze(plans),
      policy: Object.freeze({
        primaryFirst: true,
        verifyCurrentStatus: true,
        rejectUnsupportedSecondaryOnlyConclusion: true
      })
    });
  }

  function normalizeResult(item = {}) {
    const sourceUrl = normalize(item.sourceUrl || item.url);
    const matched = window.GovPromptCore.matchOfficialSource?.(sourceUrl);
    const sourceTier = matched?.tier || normalize(item.sourceTier) || 'unknown';
    const sourcePriority = matched?.priority ?? Number(item.sourcePriority || 0);
    const official = sourceTier === 'primary';

    return Object.freeze({
      id: normalize(item.id),
      title: normalize(item.title),
      snippet: normalize(item.snippet || item.summary),
      sourceUrl,
      sourceName: matched?.name || normalize(item.sourceName),
      sourceId: matched?.id || normalize(item.sourceId),
      sourceTier,
      sourcePriority,
      official,
      documentNumber: normalize(item.documentNumber || item.reference),
      documentDate: normalize(item.documentDate || item.date),
      effectiveDate: normalize(item.effectiveDate),
      status: normalize(item.status) || 'unknown',
      lastVerifiedAt: normalize(item.lastVerifiedAt),
      supersedesDocumentId: normalize(item.supersedesDocumentId),
      supersededByDocumentId: normalize(item.supersededByDocumentId),
      amendedBy: Object.freeze(Array.isArray(item.amendedBy) ? item.amendedBy.map(normalize).filter(Boolean) : []),
      repealedBy: Object.freeze(Array.isArray(item.repealedBy) ? item.repealedBy.map(normalize).filter(Boolean) : [])
    });
  }

  function rankResults(results = []) {
    return Object.freeze(results.map(normalizeResult).sort((a, b) =>
      Number(b.official) - Number(a.official)
      || b.sourcePriority - a.sourcePriority
      || String(b.documentDate || b.effectiveDate).localeCompare(String(a.documentDate || a.effectiveDate))
      || a.title.localeCompare(b.title, 'th')
    ));
  }

  function createOfficialSearchConnector({ endpoint = '', fetcher } = {}) {
    const searchEndpoint = normalize(endpoint);
    const doFetch = fetcher || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);

    async function search(query, options = {}) {
      const plan = createSearchPlan(query, options);
      if (!searchEndpoint || typeof doFetch !== 'function') {
        return Object.freeze({
          mode: 'plan-only',
          plan,
          results: Object.freeze([]),
          freshness: null,
          warning: 'ยังไม่ได้เชื่อมบริการค้นเว็บราชการสด — ใช้แผนค้นจาก Primary Source ก่อน'
        });
      }

      const response = await doFetch(searchEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: plan.query, plans: plan.plans })
      });
      if (!response.ok) throw new Error(`Official search request failed: ${response.status}`);
      const payload = await response.json();
      const results = rankResults(Array.isArray(payload.results) ? payload.results : []);
      const freshness = typeof window.GovPromptCore.selectBestCurrent === 'function'
        ? window.GovPromptCore.selectBestCurrent(results, options)
        : null;

      return Object.freeze({
        mode: 'live',
        plan,
        results,
        freshness,
        warning: freshness?.warning || ''
      });
    }

    return Object.freeze({ search, createSearchPlan, rankResults });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.createOfficialSearchPlan = createSearchPlan;
  window.GovPromptCore.rankOfficialSearchResults = rankResults;
  window.GovPromptCore.createOfficialSearchConnector = createOfficialSearchConnector;
  window.GovPromptCore.officialSearchConnector = createOfficialSearchConnector();
})();
