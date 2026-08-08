(() => {
  'use strict';

  const UNVERIFIED_LATEST_WARNING = 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง';
  const DEFAULT_OFFICIAL_SEARCH_ENDPOINT = 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
  const FRESHNESS_TERMS = Object.freeze([
    'ล่าสุด', 'ปัจจุบัน', 'ขณะนี้', 'ตอนนี้', 'ฉบับใหม่', 'ฉบับล่าสุด', 'อัปเดต',
    'ยังใช้', 'ยังมีผล', 'มีผลใช้บังคับ', 'ถูกยกเลิก', 'ยกเลิกแล้ว', 'แก้ไขล่าสุด',
    'latest', 'current', 'currently', 'effective', 'repealed', 'superseded'
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFKC').trim();
  }

  function quote(value) {
    const text = normalize(value).replace(/"/g, '');
    return text ? `"${text}"` : '';
  }

  function requiresFreshnessVerification(query, options = {}) {
    if (typeof options.requireFreshness === 'boolean') return options.requireFreshness;
    const q = normalize(query).toLocaleLowerCase();
    return FRESHNESS_TERMS.some(term => q.includes(term.toLocaleLowerCase()));
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
      id: normalize(item.id) || sourceUrl,
      title: normalize(item.title),
      documentTitle: normalize(item.documentTitle || item.title),
      snippet: normalize(item.snippet || item.summary),
      sourceUrl,
      sourceURL: sourceUrl,
      sourceName: matched?.name || normalize(item.sourceName),
      issuingAgency: matched?.name || normalize(item.issuingAgency || item.sourceName),
      sourceId: matched?.id || normalize(item.sourceId),
      sourceTier,
      sourceLevel: sourceTier,
      sourcePriority,
      official,
      documentNumber: normalize(item.documentNumber || item.reference),
      reference: normalize(item.documentNumber || item.reference) || sourceUrl,
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

  function createSearchCitations(results = []) {
    const createCitation = window.GovPromptCore.createCitation;
    if (typeof createCitation !== 'function') return Object.freeze([]);
    return Object.freeze(results.filter(result => result.official).map(result => {
      try {
        return createCitation(result, { confidenceLevel: 'medium', verify: true });
      } catch {
        return null;
      }
    }).filter(Boolean));
  }

  function createEvidence(results, freshness, { verificationRequired = true } = {}) {
    const primaryResults = Object.freeze(results.filter(result => result.official));
    const secondaryResults = Object.freeze(results.filter(result => !result.official));
    const citations = createSearchCitations(primaryResults);
    const verifiedCurrent = Boolean(freshness?.verifiedCurrent && freshness?.best?.official);
    const hasPrimaryEvidence = primaryResults.length > 0;
    const conclusionEligible = hasPrimaryEvidence && (!verificationRequired || verifiedCurrent);
    return Object.freeze({
      primaryResults,
      secondaryResults,
      citations,
      verificationRequired,
      verifiedCurrent,
      conclusionEligible,
      warning: verificationRequired && !verifiedCurrent ? UNVERIFIED_LATEST_WARNING : ''
    });
  }

  function planOnly(plan, warning, errorCode = '') {
    return Object.freeze({
      mode: 'plan-only',
      plan,
      results: Object.freeze([]),
      freshness: null,
      evidence: Object.freeze({
        primaryResults: Object.freeze([]),
        secondaryResults: Object.freeze([]),
        citations: Object.freeze([]),
        verificationRequired: false,
        verifiedCurrent: false,
        conclusionEligible: false,
        warning
      }),
      warning,
      errorCode
    });
  }

  function createOfficialSearchConnector({ endpoint = DEFAULT_OFFICIAL_SEARCH_ENDPOINT, fetcher } = {}) {
    const searchEndpoint = normalize(endpoint);
    const doFetch = fetcher || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);

    async function search(query, options = {}) {
      const plan = createSearchPlan(query, options);
      const verificationRequired = requiresFreshnessVerification(query, options);
      if (!searchEndpoint || typeof doFetch !== 'function') {
        return planOnly(plan, 'ยังไม่ได้เชื่อมบริการค้นเว็บราชการสด — ใช้แผนค้นจาก Primary Source ก่อน', 'SEARCH_UNAVAILABLE');
      }

      let response;
      try {
        response = await doFetch(searchEndpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            query: plan.query,
            sites: plan.sources.map(source => source.host),
            count: Math.min(20, Math.max(5, Number(options.count) || 10))
          })
        });
      } catch {
        return planOnly(plan, 'ยังเชื่อมบริการค้นเว็บราชการสดไม่ได้ — ระบบจะใช้แผนค้นจาก Primary Source ก่อน', 'SEARCH_NETWORK_ERROR');
      }

      if (!response.ok) {
        let errorCode = `HTTP_${response.status}`;
        try {
          const errorPayload = await response.json();
          errorCode = normalize(errorPayload?.error) || errorCode;
        } catch {}
        return planOnly(
          plan,
          errorCode === 'SEARCH_PROVIDER_NOT_CONFIGURED'
            ? 'ยังไม่ได้ตั้งค่าผู้ให้บริการค้นเว็บบนเซิร์ฟเวอร์ — ระบบจะใช้แผนค้นจาก Primary Source ก่อน'
            : 'บริการค้นเว็บราชการสดยังไม่พร้อม — ระบบจะใช้แผนค้นจาก Primary Source ก่อน',
          errorCode
        );
      }

      const payload = await response.json();
      const results = rankResults(Array.isArray(payload.results) ? payload.results : []);
      const freshness = typeof window.GovPromptCore.selectBestCurrent === 'function'
        ? window.GovPromptCore.selectBestCurrent(results, options)
        : null;
      const evidence = createEvidence(results, freshness, { verificationRequired });

      return Object.freeze({
        mode: 'live',
        plan,
        results,
        freshness,
        evidence,
        verificationRequired,
        searchedAt: normalize(payload.searchedAt),
        provider: normalize(payload.provider),
        warning: evidence.warning
      });
    }

    return Object.freeze({ search, createSearchPlan, rankResults, createEvidence, requiresFreshnessVerification });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.UNVERIFIED_LATEST_WARNING = UNVERIFIED_LATEST_WARNING;
  window.GovPromptCore.requiresFreshnessVerification = requiresFreshnessVerification;
  window.GovPromptCore.createOfficialSearchPlan = createSearchPlan;
  window.GovPromptCore.rankOfficialSearchResults = rankResults;
  window.GovPromptCore.createOfficialSearchEvidence = createEvidence;
  window.GovPromptCore.createOfficialSearchConnector = createOfficialSearchConnector;
  window.GovPromptCore.officialSearchConnector = createOfficialSearchConnector();
})();
