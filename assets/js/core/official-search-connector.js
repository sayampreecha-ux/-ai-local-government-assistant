(() => {
  'use strict';

  const UNVERIFIED_LATEST_WARNING = 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง';
  const DEFAULT_OFFICIAL_SEARCH_ENDPOINT = 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
  const FRESHNESS_TERMS = Object.freeze(['ล่าสุด','ปัจจุบัน','ขณะนี้','ตอนนี้','ฉบับใหม่','ฉบับล่าสุด','อัปเดต','ยังใช้','ยังมีผล','มีผลใช้บังคับ','ถูกยกเลิก','ยกเลิกแล้ว','แก้ไขล่าสุด','latest','current','effective','repealed','superseded']);
  const DOMAIN_HINTS = Object.freeze({
    GP001: 'งานสารบรรณ หนังสือราชการ ระเบียบสำนักนายกรัฐมนตรี งานสารบรรณ',
    GP002: 'กฎหมาย ระเบียบ หนังสือสั่งการ ฐานอำนาจ องค์กรปกครองส่วนท้องถิ่น',
    GP003: 'จัดซื้อจัดจ้าง พัสดุภาครัฐ TOR ราคากลาง วิธีจัดซื้อจัดจ้าง กรมบัญชีกลาง',
    GP004: 'แผนพัฒนาท้องถิ่น โครงการ งบประมาณ ข้อบัญญัติงบประมาณ กระทรวงมหาดไทย',
    GP005: 'การเงิน การคลัง การเบิกจ่าย ค่าใช้จ่าย เดินทางไปราชการ องค์กรปกครองส่วนท้องถิ่น',
    GP006: 'บริหารงานบุคคลท้องถิ่น เลื่อนเงินเดือน แต่งตั้ง โอนย้าย วินัย สอบแข่งขัน',
    GP007: 'งานช่าง วิศวกรรม ก่อสร้าง ถนน มาตรฐานงานทาง ท้องถิ่น',
    GP008: 'สาธารณสุข รพ.สต. เงินบำรุง บริการสุขภาพ องค์กรปกครองส่วนท้องถิ่น',
    GP009: 'การศึกษาท้องถิ่น โรงเรียน ศูนย์พัฒนาเด็กเล็ก ครู นักเรียน',
    GP010: 'ตรวจสอบภายใน ควบคุมภายใน บริหารความเสี่ยง หน่วยงานรัฐ',
    GP011: 'การบริหารท้องถิ่น ผู้บริหาร นโยบาย ข้อสั่งการ',
    GP012: 'ประชาสัมพันธ์ภาครัฐ การสื่อสารราชการ ข่าวประชาสัมพันธ์',
    GP013: 'สภาท้องถิ่น ญัตติ มติสภา สมัยประชุม ข้อบัญญัติ'
  });

  function normalize(value) { return String(value ?? '').normalize('NFKC').trim(); }
  function quote(value) { const text = normalize(value).replace(/"/g, ''); return text ? `"${text}"` : ''; }
  function requiresFreshnessVerification(query, options = {}) {
    if (typeof options.requireFreshness === 'boolean') return options.requireFreshness;
    const q = normalize(query).toLocaleLowerCase();
    return FRESHNESS_TERMS.some(term => q.includes(term.toLocaleLowerCase()));
  }

  function rewriteQuery(query) {
    const original = normalize(query);
    const route = typeof window.GovPromptCore.routeRequest === 'function'
      ? window.GovPromptCore.routeRequest(original, { multiModule: true })
      : null;
    const moduleIds = route?.modules?.length ? route.modules.slice(0, 2) : [route?.primaryModule].filter(Boolean);
    const hints = moduleIds.map(id => DOMAIN_HINTS[id]).filter(Boolean);
    const rewritten = [original, ...hints].filter(Boolean).join(' ');
    return Object.freeze({ original, rewritten, moduleIds: Object.freeze(moduleIds), route });
  }

  function createSearchPlan(query, { limitSources = 6 } = {}) {
    const rewritten = rewriteQuery(query);
    if (!rewritten.original) throw new TypeError('query must be a non-empty string');
    const rank = window.GovPromptCore.rankOfficialSources;
    if (typeof rank !== 'function') throw new Error('Official source registry is unavailable');
    const sources = rank(rewritten.rewritten).slice(0, Math.max(1, limitSources));
    const plans = sources.map(source => Object.freeze({
      sourceId: source.id, sourceName: source.name, host: source.host, tier: source.tier, priority: source.priority,
      query: `site:${source.host} ${rewritten.rewritten}`,
      exactQuery: `site:${source.host} ${quote(rewritten.original)}`,
      sourceHome: `https://${source.host}/`
    }));
    return Object.freeze({
      query: rewritten.rewritten,
      originalQuery: rewritten.original,
      routedModules: rewritten.moduleIds,
      route: rewritten.route,
      sources: Object.freeze(sources), plans: Object.freeze(plans),
      policy: Object.freeze({ primaryFirst: true, verifyCurrentStatus: true, rejectUnsupportedSecondaryOnlyConclusion: true, intentAwareRewrite: true })
    });
  }

  function normalizeResult(item = {}) {
    const sourceUrl = normalize(item.sourceUrl || item.url);
    const matched = window.GovPromptCore.matchOfficialSource?.(sourceUrl);
    const sourceTier = matched?.tier || normalize(item.sourceTier) || 'unknown';
    const sourcePriority = matched?.priority ?? Number(item.sourcePriority || 0);
    const official = sourceTier === 'primary';
    return Object.freeze({
      id: normalize(item.id) || sourceUrl, title: normalize(item.title), documentTitle: normalize(item.documentTitle || item.title),
      snippet: normalize(item.snippet || item.summary), sourceUrl, sourceURL: sourceUrl,
      sourceName: matched?.name || normalize(item.sourceName), issuingAgency: matched?.name || normalize(item.issuingAgency || item.sourceName),
      sourceId: matched?.id || normalize(item.sourceId), sourceTier, sourceLevel: sourceTier, sourcePriority, official,
      documentNumber: normalize(item.documentNumber || item.reference), reference: normalize(item.documentNumber || item.reference) || sourceUrl,
      documentDate: normalize(item.documentDate || item.date), effectiveDate: normalize(item.effectiveDate), status: normalize(item.status) || 'unknown',
      lastVerifiedAt: normalize(item.lastVerifiedAt), supersedesDocumentId: normalize(item.supersedesDocumentId), supersededByDocumentId: normalize(item.supersededByDocumentId),
      amendedBy: Object.freeze(Array.isArray(item.amendedBy) ? item.amendedBy.map(normalize).filter(Boolean) : []),
      repealedBy: Object.freeze(Array.isArray(item.repealedBy) ? item.repealedBy.map(normalize).filter(Boolean) : [])
    });
  }

  function relevanceScore(result, plan) {
    const haystack = `${result.title} ${result.snippet} ${result.sourceName}`.toLocaleLowerCase();
    const tokens = normalize(plan.originalQuery).toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
    const matched = tokens.filter(token => token.length > 2 && haystack.includes(token)).length;
    return matched / Math.max(1, tokens.filter(token => token.length > 2).length);
  }

  function rankResults(results = [], plan = {}) {
    return Object.freeze(results.map(normalizeResult).map(result => Object.freeze({ ...result, queryRelevance: relevanceScore(result, plan) })).sort((a, b) =>
      Number(b.official) - Number(a.official)
      || b.queryRelevance - a.queryRelevance
      || b.sourcePriority - a.sourcePriority
      || String(b.documentDate || b.effectiveDate).localeCompare(String(a.documentDate || a.effectiveDate))
      || a.title.localeCompare(b.title, 'th')
    ));
  }

  function createSearchCitations(results = []) {
    const createCitation = window.GovPromptCore.createCitation;
    if (typeof createCitation !== 'function') return Object.freeze([]);
    return Object.freeze(results.filter(result => result.official).map(result => { try { return createCitation(result, { confidenceLevel: 'medium', verify: true }); } catch { return null; } }).filter(Boolean));
  }

  function createEvidence(results, freshness, { verificationRequired = true } = {}) {
    const primaryResults = Object.freeze(results.filter(result => result.official && result.queryRelevance >= 0.18));
    const secondaryResults = Object.freeze(results.filter(result => !result.official || result.queryRelevance < 0.18));
    const citations = createSearchCitations(primaryResults);
    const verifiedCurrent = Boolean(freshness?.verifiedCurrent && freshness?.best?.official);
    const hasPrimaryEvidence = primaryResults.length > 0;
    const conclusionEligible = hasPrimaryEvidence && (!verificationRequired || verifiedCurrent);
    return Object.freeze({ primaryResults, secondaryResults, citations, verificationRequired, verifiedCurrent, conclusionEligible, warning: verificationRequired && !verifiedCurrent ? UNVERIFIED_LATEST_WARNING : '' });
  }

  function planOnly(plan, warning, errorCode = '') {
    return Object.freeze({ mode: 'plan-only', plan, results: Object.freeze([]), freshness: null,
      evidence: Object.freeze({ primaryResults: Object.freeze([]), secondaryResults: Object.freeze([]), citations: Object.freeze([]), verificationRequired: false, verifiedCurrent: false, conclusionEligible: false, warning }), warning, errorCode });
  }

  function createOfficialSearchConnector({ endpoint = DEFAULT_OFFICIAL_SEARCH_ENDPOINT, fetcher } = {}) {
    const searchEndpoint = normalize(endpoint);
    const doFetch = fetcher || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
    async function search(query, options = {}) {
      const plan = createSearchPlan(query, options);
      const verificationRequired = requiresFreshnessVerification(query, options);
      if (!searchEndpoint || typeof doFetch !== 'function') return planOnly(plan, 'ยังไม่ได้เชื่อมบริการค้นเว็บราชการสด — ใช้แผนค้นจาก Primary Source ก่อน', 'SEARCH_UNAVAILABLE');
      let response;
      try {
        response = await doFetch(searchEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: plan.query, sites: plan.sources.map(source => source.host), count: Math.min(20, Math.max(5, Number(options.count) || 10)) }) });
      } catch { return planOnly(plan, 'ยังเชื่อมบริการค้นเว็บราชการสดไม่ได้ — ระบบจะใช้แผนค้นจาก Primary Source ก่อน', 'SEARCH_NETWORK_ERROR'); }
      if (!response.ok) {
        let errorCode = `HTTP_${response.status}`;
        try { const errorPayload = await response.json(); errorCode = normalize(errorPayload?.error) || errorCode; } catch {}
        return planOnly(plan, errorCode === 'SEARCH_PROVIDER_NOT_CONFIGURED' ? 'ยังไม่ได้ตั้งค่าผู้ให้บริการค้นเว็บบนเซิร์ฟเวอร์ — ระบบจะใช้แผนค้นจาก Primary Source ก่อน' : 'บริการค้นเว็บราชการสดยังไม่พร้อม — ระบบจะใช้แผนค้นจาก Primary Source ก่อน', errorCode);
      }
      const payload = await response.json();
      const results = rankResults(Array.isArray(payload.results) ? payload.results : [], plan);
      const freshness = typeof window.GovPromptCore.selectBestCurrent === 'function' ? window.GovPromptCore.selectBestCurrent(results, options) : null;
      const evidence = createEvidence(results, freshness, { verificationRequired });
      return Object.freeze({ mode: 'live', plan, results, freshness, evidence, verificationRequired, searchedAt: normalize(payload.searchedAt), provider: normalize(payload.provider), warning: evidence.warning });
    }
    return Object.freeze({ search, createSearchPlan, rewriteQuery, rankResults, createEvidence, requiresFreshnessVerification });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.UNVERIFIED_LATEST_WARNING = UNVERIFIED_LATEST_WARNING;
  window.GovPromptCore.requiresFreshnessVerification = requiresFreshnessVerification;
  window.GovPromptCore.rewriteOfficialSearchQuery = rewriteQuery;
  window.GovPromptCore.createOfficialSearchPlan = createSearchPlan;
  window.GovPromptCore.rankOfficialSearchResults = rankResults;
  window.GovPromptCore.createOfficialSearchEvidence = createEvidence;
  window.GovPromptCore.createOfficialSearchConnector = createOfficialSearchConnector;
  window.GovPromptCore.officialSearchConnector = createOfficialSearchConnector();
})();
