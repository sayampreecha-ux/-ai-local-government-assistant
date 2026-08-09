(() => {
  'use strict';

  const UNVERIFIED_LATEST_WARNING = 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง';
  const DEFAULT_OFFICIAL_SEARCH_ENDPOINT = 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
  const FRESHNESS_TERMS = Object.freeze(['ล่าสุด','ปัจจุบัน','ขณะนี้','ตอนนี้','ฉบับใหม่','ฉบับล่าสุด','อัปเดต','ยังใช้','ยังมีผล','มีผลใช้บังคับ','ถูกยกเลิก','ยกเลิกแล้ว','แก้ไขล่าสุด','latest','current','effective','repealed','superseded']);
  const STOP_TERMS = new Set(['ช่วย','หน่อย','เรื่อง','เกี่ยวกับ','อย่างไร','ยังไง','ไหม','หรือไม่','ได้','ได้ไหม','ทำ','ต้อง','ดู','อะไร','บ้าง','หรือ','ว่า','ถือว่า','ขอ','ไม่','การ','และ','ของ','ให้','ใน','ที่','จาก','เป็น']);
  const PRIMARY_DOCUMENT_TERMS = Object.freeze(['พระราชบัญญัติ','กฎกระทรวง','ระเบียบ','ประกาศ','ข้อบังคับ','หนังสือสั่งการ','หนังสือเวียน','หลักเกณฑ์','ด่วนที่สุด']);
  const SECONDARY_DOCUMENT_TERMS = Object.freeze(['คำถาม','คำตอบ','ถาม-ตอบ','faq','ข้อเสนอแนะ','ข่าว','ประชาสัมพันธ์','เว็บไซด์อินเตอร์เน็ต']);
  const NAVIGATION_TITLE_PATTERNS = Object.freeze([
    /^เว็บไซด์อินเตอร์เน็ต/, /^ค้นหา(?:\s|$)/, /^หน้าหลัก(?:\s|$)/, /^ข่าว(?:จัดซื้อจัดจ้าง|ประกวดราคา)?(?:\s*-|$)/,
    /^ประกาศร่าง\s*tor(?:\s*-|$)/i, /^ระเบียบ ข้อบังคับหลักเกณฑ์และขั้นตอนการปฏิบัติงาน$/
  ]);
  const DOMAIN_HINTS = Object.freeze({
    GP001: 'งานสารบรรณ หนังสือราชการ ระเบียบสำนักนายกรัฐมนตรี งานสารบรรณ',
    GP002: 'กฎหมาย ระเบียบ หนังสือสั่งการ ฐานอำนาจ องค์กรปกครองส่วนท้องถิ่น',
    GP003: 'จัดซื้อจัดจ้าง พัสดุภาครัฐ TOR ราคากลาง วิธีจัดซื้อจัดจ้าง กรมบัญชีกลาง',
    GP004: 'แผนพัฒนาท้องถิ่น โครงการ งบประมาณ ข้อบัญญัติงบประมาณ กระทรวงมหาดไทย',
    GP005: 'การเงิน การคลัง การเบิกจ่าย ค่าใช้จ่าย ระเบียบ หลักเกณฑ์ องค์กรปกครองส่วนท้องถิ่น',
    GP006: 'บริหารงานบุคคลท้องถิ่น เลื่อนเงินเดือน แต่งตั้ง โอนย้าย วินัย สอบแข่งขัน',
    GP007: 'งานช่าง วิศวกรรม ก่อสร้าง ถนน มาตรฐานงานทาง ท้องถิ่น',
    GP008: 'สาธารณสุข รพ.สต. เงินบำรุง บริการสุขภาพ องค์กรปกครองส่วนท้องถิ่น',
    GP009: 'การศึกษาท้องถิ่น โรงเรียน ศูนย์พัฒนาเด็กเล็ก ครู นักเรียน',
    GP010: 'ตรวจสอบภายใน ควบคุมภายใน บริหารความเสี่ยง หน่วยงานรัฐ',
    GP011: 'การบริหารท้องถิ่น ผู้บริหาร นโยบาย ข้อสั่งการ',
    GP012: 'ประชาสัมพันธ์ภาครัฐ การสื่อสารราชการ ข่าวประชาสัมพันธ์',
    GP013: 'สภาท้องถิ่น ญัตติ มติสภา สมัยประชุม ข้อบัญญัติ'
  });
  const INTENT_PROFILES = Object.freeze([
    Object.freeze({
      id: 'vehicle-maintenance',
      when: Object.freeze([Object.freeze(['รถ','ยานพาหนะ']), Object.freeze(['ซ่อม','บำรุง','บำรุงรักษา','ชำรุด','เสีย'])]),
      expansion: 'ซ่อม บำรุงรักษา รถราชการ รถส่วนกลาง ยานพาหนะ องค์กรปกครองส่วนท้องถิ่น ระเบียบ หนังสือสั่งการ หนังสือเวียน หลักเกณฑ์',
      required: Object.freeze([Object.freeze(['รถราชการ','รถส่วนกลาง','ยานพาหนะ','รถ']), Object.freeze(['ซ่อม','บำรุง','บำรุงรักษา','ชำรุด'])]),
      preferred: Object.freeze(['รถราชการ','รถส่วนกลาง','ยานพาหนะ','ซ่อม','บำรุงรักษา','ชำรุด','ระเบียบ','หนังสือสั่งการ','หนังสือเวียน','หลักเกณฑ์']),
      negative: Object.freeze(['tor','เช่ารถ','ค่าเดินทาง','เดินทางไปราชการ','ค่าพาหนะ','ค่าโดยสาร','เบี้ยเลี้ยง'])
    }),
    Object.freeze({
      id: 'procurement-tor',
      when: Object.freeze([Object.freeze(['tor','ขอบเขตงาน','จัดซื้อ','จัดจ้าง','ราคากลาง','ตรวจรับ'])]),
      expansion: 'จัดซื้อจัดจ้าง พัสดุภาครัฐ TOR ขอบเขตงาน ราคากลาง ระเบียบ กรมบัญชีกลาง',
      required: Object.freeze([Object.freeze(['tor','ขอบเขตงาน','จัดซื้อ','จัดจ้าง','ราคากลาง','ตรวจรับ','พัสดุ','ยี่ห้อ','คุณลักษณะเฉพาะ','การแข่งขัน'])]),
      preferred: Object.freeze(['tor','ขอบเขตงาน','จัดซื้อ','จัดจ้าง','ราคากลาง','ตรวจรับ','พัสดุ','ยี่ห้อ','คุณลักษณะเฉพาะ','การแข่งขัน','ระเบียบ']),
      negative: Object.freeze(['ค่าเดินทาง','เบี้ยเลี้ยง','ค่าที่พัก'])
    }),
    Object.freeze({
      id: 'official-travel',
      when: Object.freeze([Object.freeze(['เดินทางไปราชการ','ค่าเดินทาง','ค่าเครื่องบิน','ค่าโดยสาร','ค่าพาหนะ','เบี้ยเลี้ยง','ค่าที่พัก'])]),
      expansion: 'เดินทางไปราชการ ค่าเดินทาง ค่าโดยสาร ค่าพาหนะ เบี้ยเลี้ยง ค่าที่พัก ระเบียบ หลักเกณฑ์ การเบิกจ่าย',
      required: Object.freeze([Object.freeze(['เดินทางไปราชการ','ค่าเดินทาง','เครื่องบิน','ค่าโดยสาร','ค่าพาหนะ','เบี้ยเลี้ยง','ที่พัก'])]),
      preferred: Object.freeze(['เดินทางไปราชการ','ค่าเดินทาง','เครื่องบิน','ค่าโดยสาร','ค่าพาหนะ','เบี้ยเลี้ยง','ที่พัก','ระเบียบ','หลักเกณฑ์']),
      negative: Object.freeze(['tor','เช่ารถราชการ','ซ่อมรถ','บำรุงรักษารถ'])
    }),
    Object.freeze({
      id: 'health-maintenance-fund',
      when: Object.freeze([Object.freeze(['เงินบำรุง']), Object.freeze(['รพ.สต','รพสต','โรงพยาบาล','สาธารณสุข','หน่วยบริการ','ซื้อ','จัดหา','ใช้'])]),
      expansion: 'เงินบำรุง การใช้จ่ายเงินบำรุง ระเบียบเงินบำรุง หน่วยบริการสาธารณสุข รพ.สต. หนังสือสั่งการ กรมส่งเสริมการปกครองท้องถิ่น กระทรวงมหาดไทย',
      fallback: 'ระเบียบเงินบำรุง การใช้จ่ายเงินบำรุง หน่วยบริการสาธารณสุข รพ.สต. กรมส่งเสริมการปกครองท้องถิ่น',
      required: Object.freeze([Object.freeze(['เงินบำรุง']), Object.freeze(['รพ.สต','รพสต','โรงพยาบาล','สาธารณสุข','หน่วยบริการ','ซื้อ','จัดหา','ใช้จ่าย'])]),
      preferred: Object.freeze(['เงินบำรุง','รพ.สต','รพสต','หน่วยบริการ','สาธารณสุข','จัดซื้อ','ใช้จ่าย','ระเบียบ','หลักเกณฑ์']),
      negative: Object.freeze(['เงินบำรุงท้องถิ่น','ค่าซ่อมรถ','เดินทางไปราชการ'])
    })
  ]);

  const SUBJECT_PROFILES = Object.freeze([
    Object.freeze({ id: 'road-works', when: Object.freeze(['ถนน','งานทาง','ก่อสร้างทาง','ผิวทาง','ลาดยาง','แอสฟัลต์','คอนกรีตเสริมเหล็ก']), expansion: 'TOR ขอบเขตงานก่อสร้างถนน งานทาง ผิวทาง ลาดยาง แอสฟัลต์ คอนกรีตเสริมเหล็ก ราคากลาง กรมส่งเสริมการปกครองท้องถิ่น', fallback: 'หลักเกณฑ์การคำนวณราคากลางงานก่อสร้างทาง TOR งานก่อสร้างถนน ขอบเขตงานถนน งานทาง ผิวทาง กรมส่งเสริมการปกครองท้องถิ่น', evidence: Object.freeze(['ถนน','งานทาง','ก่อสร้างทาง','ผิวทาง','ลาดยาง','แอสฟัลต์','คอนกรีตเสริมเหล็ก']) }),
    Object.freeze({ id: 'vehicle', when: Object.freeze(['รถ','ยานพาหนะ']), expansion: 'รถ ยานพาหนะ รถราชการ', evidence: Object.freeze(['รถ','ยานพาหนะ']) }),
    Object.freeze({ id: 'building', when: Object.freeze(['อาคาร','สิ่งปลูกสร้าง']), expansion: 'อาคาร สิ่งปลูกสร้าง งานก่อสร้างอาคาร', evidence: Object.freeze(['อาคาร','สิ่งปลูกสร้าง']) }),
    Object.freeze({ id: 'information-technology', when: Object.freeze(['คอมพิวเตอร์','ระบบสารสนเทศ','ซอฟต์แวร์','เครือข่าย','ดิจิทัล']), expansion: 'คอมพิวเตอร์ ระบบสารสนเทศ ซอฟต์แวร์ เครือข่าย ดิจิทัล', evidence: Object.freeze(['คอมพิวเตอร์','ระบบสารสนเทศ','ซอฟต์แวร์','เครือข่าย','ดิจิทัล']) })
  ]);

  function normalize(value) { return String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim(); }
  function quote(value) { const text = normalize(value).replace(/"/g, ''); return text ? `"${text}"` : ''; }
  function lower(value) { return normalize(value).toLocaleLowerCase(); }
  function requiresFreshnessVerification(query, options = {}) {
    if (typeof options.requireFreshness === 'boolean') return options.requireFreshness;
    const q = lower(query);
    return FRESHNESS_TERMS.some(term => q.includes(term.toLocaleLowerCase()));
  }

  function queryTerms(query) {
    const normalized = lower(query)
      .replace(/([\p{Script=Thai}])([a-z0-9])/gu, '$1 $2')
      .replace(/([a-z0-9])([\p{Script=Thai}])/gu, '$1 $2');
    const segmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
      ? new Intl.Segmenter('th', { granularity: 'word' })
      : null;
    const raw = segmenter
      ? [...segmenter.segment(normalized)].filter(part => part.isWordLike).map(part => part.segment)
      : (normalized.match(/[\p{L}\p{N}.]+/gu) || []);
    const terms = raw.filter(term => term.length > 1 && !STOP_TERMS.has(term));
    return Object.freeze([...new Set(terms)]);
  }

  function includesAny(text, terms = []) { return terms.some(term => text.includes(lower(term))); }

  function detectSearchIntent(query) {
    const text = lower(query);
    return INTENT_PROFILES.find(profile => profile.when.every(group => includesAny(text, group))) || null;
  }

  function detectSearchSubject(query, intentProfile) {
    if (intentProfile?.id !== 'procurement-tor') return null;
    const text = lower(query);
    return SUBJECT_PROFILES.find(subject => includesAny(text, subject.when)) || null;
  }

  function rewriteQuery(query) {
    const original = normalize(query);
    const route = typeof window.GovPromptCore.routeRequest === 'function'
      ? window.GovPromptCore.routeRequest(original, { multiModule: true })
      : null;
    const moduleIds = route?.modules?.length ? route.modules.slice(0, 2) : [route?.primaryModule].filter(Boolean);
    const intentProfile = detectSearchIntent(original);
    const subjectProfile = detectSearchSubject(original, intentProfile);
    const hints = subjectProfile
      ? [subjectProfile.expansion, 'TOR ขอบเขตงาน ราคากลาง จัดซื้อจัดจ้าง พัสดุภาครัฐ ระเบียบ']
      : (intentProfile ? [intentProfile.expansion] : moduleIds.map(id => DOMAIN_HINTS[id]).filter(Boolean));
    const rewritten = [original, ...hints].filter(Boolean).join(' ');
    return Object.freeze({ original, rewritten, moduleIds: Object.freeze(moduleIds), route, terms: queryTerms(original), intentProfile, subjectProfile });
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
      queryTerms: rewritten.terms,
      intentProfile: rewritten.intentProfile,
      subjectProfile: rewritten.subjectProfile,
      fallbackQuery: rewritten.subjectProfile?.fallback || rewritten.intentProfile?.fallback || '',
      routedModules: rewritten.moduleIds,
      route: rewritten.route,
      sources: Object.freeze(sources), plans: Object.freeze(plans),
      policy: Object.freeze({ primaryFirst: true, verifyCurrentStatus: true, rejectUnsupportedSecondaryOnlyConclusion: true, intentAwareRewrite: true, intentAwareRanking: true, evidenceWeightedRanking: true, deduplicateResults: true })
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

  function intentFeatures(result, plan) {
    const profiles = plan.intentProfiles?.length ? plan.intentProfiles : activeIntentProfiles(plan.originalQuery);
    if (!profiles.length) return Object.freeze({ intentBoost: 0, intentPenalty: 0, intentScore: 0, matchedProfiles: Object.freeze([]) });
    const title = lower(result.title);
    const snippet = lower(result.snippet);
    const full = `${title} ${snippet}`;
    let boost = 0;
    let penalty = 0;
    const matchedProfiles = [];
    profiles.forEach(profile => {
      const titleBoostHits = profile.boosts.filter(term => title.includes(lower(term))).length;
      const fullBoostHits = profile.boosts.filter(term => full.includes(lower(term))).length;
      const titleConflictHits = profile.conflicts.filter(term => title.includes(lower(term))).length;
      const fullConflictHits = profile.conflicts.filter(term => full.includes(lower(term))).length;
      if (titleBoostHits || fullBoostHits) matchedProfiles.push(profile.id);
      boost += Math.min(0.26, titleBoostHits * 0.10 + fullBoostHits * 0.045);
      penalty += Math.min(0.42, titleConflictHits * 0.20 + fullConflictHits * 0.08);
    });
    const query = lower(plan.originalQuery);
    const titleLooksTor = /\btor\b|term of reference|ขอบเขตของงาน/i.test(title);
    const wantsTor = /\btor\b|ขอบเขตของงาน/i.test(query);
    const titleLooksNews = /ข่าว|ประชาสัมพันธ์|กิจกรรม|ประกาศรับสมัคร/.test(title);
    if (titleLooksTor && !wantsTor) penalty += 0.28;
    if (titleLooksNews && profiles.some(profile => ['travel','vehicle-repair','procurement','health-fund','personnel','council'].includes(profile.id))) penalty += 0.12;
    boost = Math.min(0.36, boost);
    penalty = Math.min(0.55, penalty);
    return Object.freeze({ intentBoost: boost, intentPenalty: penalty, intentScore: boost - penalty, matchedProfiles: Object.freeze([...new Set(matchedProfiles)]) });
  }

  function evidenceFeatures(result, plan) {
    const terms = plan.queryTerms?.length ? plan.queryTerms : queryTerms(plan.originalQuery);
    const title = lower(result.title);
    const snippet = lower(result.snippet);
    const agency = lower(result.sourceName);
    const full = `${title} ${snippet} ${agency}`;
    const matched = terms.filter(term => full.includes(term));
    const titleMatched = terms.filter(term => title.includes(term));
    const coverage = matched.length / Math.max(1, terms.length);
    const titleCoverage = titleMatched.length / Math.max(1, terms.length);
    const exactPhrase = plan.originalQuery && (title.includes(lower(plan.originalQuery)) || snippet.includes(lower(plan.originalQuery))) ? 1 : 0;
    const metadata = [result.documentNumber, result.documentDate || result.effectiveDate, result.title].filter(Boolean).length / 3;
    const profile = plan.intentProfile;
    const subjectProfile = plan.subjectProfile;
    const requiredMatches = profile?.required?.map(group => includesAny(full, group)) || [];
    const intentCompatibility = requiredMatches.length === 0 || requiredMatches.every(Boolean);
    const preferredMatches = profile?.preferred?.filter(term => full.includes(lower(term))).length || 0;
    const preferredCoverage = preferredMatches / Math.max(1, profile?.preferred?.length || 0);
    const negativeMatches = profile?.negative?.filter(term => full.includes(lower(term))).length || 0;
    const anchoredNegative = negativeMatches > 0 && !intentCompatibility;
    const subjectTitleMatch = !subjectProfile || includesAny(title, subjectProfile.evidence);
    const subjectSnippetMatches = subjectProfile?.evidence?.filter(term => snippet.includes(lower(term))).length || 0;
    const subjectCompatibility = !subjectProfile || subjectTitleMatch || subjectSnippetMatches >= 2;
    const primaryDocument = includesAny(title, PRIMARY_DOCUMENT_TERMS);
    const secondaryDocument = includesAny(title, SECONDARY_DOCUMENT_TERMS);
    let pathname = '';
    let queryString = '';
    try { const parsed = new URL(result.sourceUrl); pathname = lower(parsed.pathname); queryString = lower(parsed.search); } catch {}
    const navigationTitle = NAVIGATION_TITLE_PATTERNS.some(pattern => pattern.test(title));
    const navigationUrl = /(?:listnews|list_layout|\/search|\/ค้นหา|page=\d+)/i.test(`${pathname}${queryString}`);
    const navigational = navigationTitle && navigationUrl;
    const baseRelevance = coverage * 0.46 + titleCoverage * 0.20 + exactPhrase * 0.12 + metadata * 0.08;
    const intentBoost = profile ? preferredCoverage * 0.24 + (intentCompatibility ? 0.12 : 0) : 0.14 * coverage;
    const intentPenalty = anchoredNegative ? Math.min(0.45, 0.18 + negativeMatches * 0.09) : 0;
    const documentTypeAdjustment = primaryDocument ? 0.16 : (profile && secondaryDocument ? -0.14 : 0);
    const subjectAdjustment = subjectProfile ? (subjectCompatibility ? 0.18 : -0.30) : 0;
    const navigationPenalty = navigational ? 0.55 : 0;
    const relevance = Math.max(0, Math.min(1, baseRelevance + intentBoost + documentTypeAdjustment + subjectAdjustment - intentPenalty - navigationPenalty));
    return Object.freeze({ coverage, titleCoverage, exactPhrase, metadataCompleteness: metadata, preferredCoverage, intentCompatibility, subjectCompatibility, subjectTitleMatch, subjectSnippetMatches, negativeMatches, primaryDocument, secondaryDocument, navigational, intentBoost, intentPenalty, intentScore: intentBoost - intentPenalty, relevance });
  }

  function canonicalKey(result) {
    try {
      const url = new URL(result.sourceUrl);
      url.hash = '';
      ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(key => url.searchParams.delete(key));
      return url.toString().replace(/\/$/, '').toLocaleLowerCase();
    } catch {
      return `${lower(result.title)}|${lower(result.sourceName)}`;
    }
  }

  function rankResults(results = [], plan = {}) {
    const deduped = new Map();
    results.map(normalizeResult).forEach(result => {
      const features = evidenceFeatures(result, plan);
      const enriched = Object.freeze({ ...result, queryRelevance: features.relevance, evidenceFeatures: features });
      const key = canonicalKey(enriched);
      const existing = deduped.get(key);
      if (!existing || enriched.queryRelevance > existing.queryRelevance || (enriched.queryRelevance === existing.queryRelevance && enriched.sourcePriority > existing.sourcePriority)) deduped.set(key, enriched);
    });
    return Object.freeze([...deduped.values()].sort((a, b) =>
      Number(b.official) - Number(a.official)
      || b.queryRelevance - a.queryRelevance
      || (b.evidenceFeatures?.intentScore ?? 0) - (a.evidenceFeatures?.intentScore ?? 0)
      || b.sourcePriority - a.sourcePriority
      || String(b.documentDate || b.effectiveDate).localeCompare(String(a.documentDate || a.effectiveDate))
      || a.title.localeCompare(b.title, 'th')
    ));
  }

  function citationConfidence(result) {
    if (!result.official) return 'low';
    const metadata = result.evidenceFeatures?.metadataCompleteness ?? 0;
    const relevance = result.queryRelevance ?? 0;
    if (relevance >= 0.72 && metadata >= 0.66) return 'high';
    if (relevance >= 0.30) return 'medium';
    return 'low';
  }

  function createSearchCitations(results = []) {
    const createCitation = window.GovPromptCore.createCitation;
    if (typeof createCitation !== 'function') return Object.freeze([]);
    return Object.freeze(results.filter(result => result.official).map(result => {
      try { return createCitation(result, { confidenceLevel: citationConfidence(result), verify: true }); } catch { return null; }
    }).filter(Boolean));
  }

  function createEvidence(results, freshness, { verificationRequired = true } = {}) {
    const primaryResults = Object.freeze(results.filter(result => result.official && result.evidenceFeatures?.intentCompatibility !== false && result.evidenceFeatures?.subjectCompatibility !== false && result.evidenceFeatures?.navigational !== true && result.queryRelevance >= 0.24));
    const secondaryResults = Object.freeze(results.filter(result => !result.official || result.evidenceFeatures?.intentCompatibility === false || result.evidenceFeatures?.subjectCompatibility === false || result.evidenceFeatures?.navigational === true || result.queryRelevance < 0.24));
    const citations = createSearchCitations(primaryResults);
    const verifiedCurrent = Boolean(freshness?.verifiedCurrent && freshness?.best?.official);
    const hasPrimaryEvidence = primaryResults.length > 0;
    const strongPrimaryEvidence = primaryResults.some(result => result.queryRelevance >= 0.45);
    const conclusionEligible = hasPrimaryEvidence && strongPrimaryEvidence && (!verificationRequired || verifiedCurrent);
    return Object.freeze({ primaryResults, secondaryResults, citations, verificationRequired, verifiedCurrent, strongPrimaryEvidence, conclusionEligible, warning: verificationRequired && !verifiedCurrent ? UNVERIFIED_LATEST_WARNING : '' });
  }

  function planOnly(plan, warning, errorCode = '') {
    return Object.freeze({ mode: 'plan-only', plan, results: Object.freeze([]), freshness: null,
      evidence: Object.freeze({ primaryResults: Object.freeze([]), secondaryResults: Object.freeze([]), citations: Object.freeze([]), verificationRequired: false, verifiedCurrent: false, strongPrimaryEvidence: false, conclusionEligible: false, warning }), warning, errorCode });
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
        response = await doFetch(searchEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: plan.query, originalQuery: plan.originalQuery, routedModules: plan.routedModules, sites: plan.sources.map(source => source.host), count: Math.min(20, Math.max(5, Number(options.count) || 10)) }) });
      } catch { return planOnly(plan, 'ยังเชื่อมบริการค้นเว็บราชการสดไม่ได้ — ระบบจะใช้แผนค้นจาก Primary Source ก่อน', 'SEARCH_NETWORK_ERROR'); }
      if (!response.ok) {
        let errorCode = `HTTP_${response.status}`;
        try { const errorPayload = await response.json(); errorCode = normalize(errorPayload?.error) || errorCode; } catch {}
        return planOnly(plan, errorCode === 'SEARCH_PROVIDER_NOT_CONFIGURED' ? 'ยังไม่ได้ตั้งค่าผู้ให้บริการค้นเว็บบนเซิร์ฟเวอร์ — ระบบจะใช้แผนค้นจาก Primary Source ก่อน' : 'บริการค้นเว็บราชการสดยังไม่พร้อม — ระบบจะใช้แผนค้นจาก Primary Source ก่อน', errorCode);
      }
      let payload;
      try { payload = await response.json(); }
      catch { return planOnly(plan, 'บริการค้นเว็บราชการสดส่งข้อมูลกลับมาไม่ถูกต้อง — ระบบจะใช้แผนค้นจาก Primary Source ก่อน', 'INVALID_SEARCH_RESPONSE'); }
      let providerResults = Array.isArray(payload?.results)
        ? payload.results
        : (Array.isArray(payload?.data?.results) ? payload.data.results : []);
      let results = rankResults(providerResults, plan);
      let freshness = typeof window.GovPromptCore.selectBestCurrent === 'function' ? window.GovPromptCore.selectBestCurrent(results, options) : null;
      let evidence = createEvidence(results, freshness, { verificationRequired });
      if (plan.fallbackQuery && evidence.primaryResults.length === 0) {
        try {
          const fallbackResponse = await doFetch(searchEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ query: plan.fallbackQuery, originalQuery: plan.originalQuery, routedModules: plan.routedModules, sites: plan.sources.map(source => source.host), count: Math.min(20, Math.max(5, Number(options.count) || 10)) }) });
          if (fallbackResponse.ok) {
            const fallbackPayload = await fallbackResponse.json();
            const fallbackResults = Array.isArray(fallbackPayload?.results)
              ? fallbackPayload.results
              : (Array.isArray(fallbackPayload?.data?.results) ? fallbackPayload.data.results : []);
            providerResults = providerResults.concat(fallbackResults);
            results = rankResults(providerResults, plan);
            freshness = typeof window.GovPromptCore.selectBestCurrent === 'function' ? window.GovPromptCore.selectBestCurrent(results, options) : null;
            evidence = createEvidence(results, freshness, { verificationRequired });
          }
        } catch {}
      }
      return Object.freeze({ mode: 'live', plan, results, freshness, evidence, verificationRequired, searchedAt: normalize(payload.searchedAt), provider: normalize(payload.provider), warning: evidence.warning });
    }
    return Object.freeze({ search, createSearchPlan, rewriteQuery, rankResults, createEvidence, requiresFreshnessVerification, queryTerms, citationConfidence });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.UNVERIFIED_LATEST_WARNING = UNVERIFIED_LATEST_WARNING;
  window.GovPromptCore.requiresFreshnessVerification = requiresFreshnessVerification;
  window.GovPromptCore.rewriteOfficialSearchQuery = rewriteQuery;
  window.GovPromptCore.createOfficialSearchPlan = createSearchPlan;
  window.GovPromptCore.rankOfficialSearchResults = rankResults;
  window.GovPromptCore.createOfficialSearchEvidence = createEvidence;
  window.GovPromptCore.officialSearchQueryTerms = queryTerms;
  window.GovPromptCore.detectOfficialSearchIntent = detectSearchIntent;
  window.GovPromptCore.detectOfficialSearchSubject = detectSearchSubject;
  window.GovPromptCore.officialSearchCitationConfidence = citationConfidence;
  window.GovPromptCore.createOfficialSearchConnector = createOfficialSearchConnector;
  window.GovPromptCore.officialSearchConnector = createOfficialSearchConnector();
})();
