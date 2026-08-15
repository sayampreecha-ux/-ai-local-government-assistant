(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;

  const MEDIA_INTENT = /(?:การ์ด(?:อวยพร)?|โปสเตอร์|อินโฟกราฟิก|ภาพประชาสัมพันธ์|ภาพอวยพร|แคปชัน|โพสต์(?:ประชาสัมพันธ์)?|ข่าวประชาสัมพันธ์).{0,35}(?:วันแม่|วันพ่อ|วันเด็ก|ปีใหม่|สงกรานต์|วันสำคัญ|อวยพร|ประชาสัมพันธ์)?|(?:ทำ|สร้าง|ออกแบบ|เขียน).{0,18}(?:การ์ด(?:อวยพร)?|โปสเตอร์|อินโฟกราฟิก|ภาพประชาสัมพันธ์|ภาพอวยพร|แคปชัน|โพสต์(?:ประชาสัมพันธ์)?|ข่าวประชาสัมพันธ์)/i;
  const COVER_MEDIA_INTENT = /(?:ทำ|สร้าง|ออกแบบ|จัดทำ).{0,16}(?:ปก|หน้าปก|ปกสอบ|ปกคัดเลือก|ปกนำเสนอ|โปรไฟล์|ภาพแนะนำตัว|โปสเตอร์แนะนำตัว|อินโฟผลงาน).{0,35}(?:วิสัยทัศน์|ผลงาน|แนะนำตัว|ประวัติ|ผู้สมัคร|ผู้บริหาร|คัดเลือก|สอบ|องค์กร)?|(?:ปก|หน้าปก|ปกสอบ|ปกคัดเลือก|ปกนำเสนอ).{0,25}(?:วิสัยทัศน์|ผลงาน|แนะนำตัว|ประวัติ|ผู้สมัคร|ผู้บริหาร|คัดเลือก|สอบ|องค์กร)/i;
  const CONTENT_ONLY = /^(?:ช่วย)?(?:เขียน|ร่าง|สรุป|วิเคราะห์|ปรับถ้อยคำ|ตรวจ).{0,24}(?:วิสัยทัศน์|ผลงาน)|^(?:คำกล่าว|ร่างคำกล่าว).{0,30}(?:วิสัยทัศน์|ผลงาน)|(?:executive\s*summary|สรุปผู้บริหาร)/i;
  const FINANCE_DECISION = /(?:เบิก|เบิกจ่าย|ค่าใช้จ่าย|จ่าย|ใช้เงิน|ใช้งบ).{0,80}(?:ได้ไหม|ได้หรือไม่|ได้มั้ย|หรือไม่)/i;
  const BUDGET_DRAFT_INTENT = /(?:^|\s)(?:ช่วย)?(?:ทำ|จัดทำ|ร่าง|ทำร่าง|เขียนร่าง).{0,10}(?:งบ|งบประมาณ)(?:\s*(?:ปี|พ\.?ศ\.?)\s*(?:25)?\d{2,4})?(?:\s|$)|(?:^|\s)(?:ร่างงบ|ทำงบ|จัดทำงบ)(?:\s*(?:ปี|พ\.?ศ\.?)\s*(?:25)?\d{2,4})?(?:\s|$)/i;
  const SPECIALIZED_DOMAIN = /(?:\btor\b|จัดซื้อจัดจ้าง|พัสดุ|ราคากลาง|เงินบำรุง|รพ\.?สต\.?|โรงพยาบาลส่งเสริมสุขภาพตำบล|เวชภัณฑ์|โรงเรียน|นักเรียน|ครู|ศูนย์พัฒนาเด็กเล็ก|ถนน|ก่อสร้าง)/i;
  const FRESHNESS_INTENT = /(?:ล่าสุด|ปัจจุบัน|ตอนนี้|ขณะนี้|ยังใช้|ยังมีผล|ฉบับใหม่|ฉบับล่าสุด|แก้ไขล่าสุด)/i;

  const SEARCH_HINTS = Object.freeze({
    GP001: 'งานสารบรรณ หนังสือราชการ ระเบียบสำนักนายกรัฐมนตรี หนังสือเวียน',
    GP002: 'กฎหมาย ฐานอำนาจ ระเบียบ ประกาศ หนังสือสั่งการ ราชกิจจานุเบกษา',
    GP003: 'จัดซื้อจัดจ้าง พัสดุภาครัฐ TOR ราคากลาง กรมบัญชีกลาง ระเบียบ',
    GP004: 'แผนพัฒนาท้องถิ่น งบประมาณ โครงการ ข้อบัญญัติงบประมาณ กระทรวงมหาดไทย',
    GP005: 'การเงิน การคลัง การเบิกจ่าย ค่าใช้จ่าย ระเบียบ หลักเกณฑ์ หนังสือสั่งการ องค์กรปกครองส่วนท้องถิ่น',
    GP006: 'บริหารงานบุคคลท้องถิ่น ก.กลาง ก.จังหวัด เลื่อนเงินเดือน แต่งตั้ง โอนย้าย วินัย',
    GP007: 'งานช่าง วิศวกรรม ถนน ก่อสร้าง มาตรฐานงานทาง กรมส่งเสริมการปกครองท้องถิ่น',
    GP008: 'สาธารณสุข รพ.สต. เงินบำรุง หน่วยบริการสุขภาพ ระเบียบ กระทรวงมหาดไทย',
    GP009: 'การศึกษาท้องถิ่น โรงเรียน ศูนย์พัฒนาเด็กเล็ก ครู นักเรียน ระเบียบ',
    GP010: 'ตรวจสอบภายใน ควบคุมภายใน บริหารความเสี่ยง หน่วยงานรัฐ',
    GP011: 'บริหารท้องถิ่น ผู้บริหาร นโยบาย หนังสือสั่งการ',
    GP012: 'ประชาสัมพันธ์ภาครัฐ การสื่อสารราชการ ข่าวประชาสัมพันธ์',
    GP013: 'สภาท้องถิ่น ญัตติ มติสภา สมัยประชุม ข้อบัญญัติ ระเบียบ'
  });

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isMediaIntent(source) {
    if (CONTENT_ONLY.test(source) || FINANCE_DECISION.test(source)) return false;
    return MEDIA_INTENT.test(source) || COVER_MEDIA_INTENT.test(source);
  }

  function correct(base, moduleId, reason) {
    if (!base || !moduleId || base.primaryModule === moduleId) return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const transactionType = assistant?.transactionTypes?.[0] || base.transactionType || 'general';
    const modules = Object.freeze([...new Set([moduleId, base.primaryModule, ...(base.modules || [])].filter(Boolean))].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: moduleId,
      moduleId,
      transactionType,
      assistant: assistant || base.assistant,
      modules,
      confidence: 0.995,
      fallback: false,
      ambiguous: false,
      reason
    });
  }

  function applyIntentFirstRouting(base, source) {
    if (BUDGET_DRAFT_INTENT.test(source)) {
      return correct(base, 'GP004', 'intent-first:budget-draft');
    }
    if (FINANCE_DECISION.test(source) && !SPECIALIZED_DOMAIN.test(source)) {
      return correct(base, 'GP005', 'intent-first:financial-decision');
    }
    if (isMediaIntent(source)) return correct(base, 'GP012', 'post-hybrid:media-public-relations-guardrail');
    return base;
  }

  core.routeRequest = function routeRequestWithIntentFirstGuardrail(request, options = {}) {
    const base = baseRouteRequest(request, options);
    return applyIntentFirstRouting(base, normalize(request));
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function routeTransactionWithIntentFirstGuardrail(sharedContext, options = {}) {
      const base = baseRouteTransaction(sharedContext, options);
      const context = base?.context || sharedContext || {};
      const source = normalize([
        context.transactionType, context.domain, context.currentStage, context.facts,
        context.documents, context.desiredOutput,
        ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      ].filter(Boolean).join(' '));
      return applyIntentFirstRouting(base, source);
    };
  }

  function buildSearchVariants(query) {
    const original = normalize(query);
    const route = typeof core.routeRequest === 'function' ? core.routeRequest(original, { multiModule: true }) : null;
    const moduleId = route?.primaryModule || '';
    const hint = SEARCH_HINTS[moduleId] || '';
    const freshness = FRESHNESS_INTENT.test(original) ? 'ฉบับล่าสุด ปัจจุบัน ยังมีผลใช้บังคับ' : '';
    const primary = [original, hint, freshness].filter(Boolean).join(' ');
    const refined = [
      original,
      hint,
      'ระเบียบ หลักเกณฑ์ ประกาศ หนังสือสั่งการ หนังสือเวียน ต้นฉบับราชการ',
      freshness
    ].filter(Boolean).join(' ');
    return Object.freeze({ primary, refined, moduleId, freshness: Boolean(freshness) });
  }

  function searchStrength(result) {
    const primaryCount = result?.evidence?.primaryResults?.length || 0;
    const officialCount = (result?.results || []).filter(item => item?.official).length;
    const total = result?.results?.length || 0;
    return primaryCount * 10 + officialCount * 3 + total;
  }

  function shouldRefine(result) {
    if (!result || result.mode !== 'live') return false;
    const primaryCount = result?.evidence?.primaryResults?.length || 0;
    const strong = Boolean(result?.evidence?.strongPrimaryEvidence);
    return !strong && primaryCount === 0;
  }

  function wrapSearchConnector(connector) {
    if (!connector || typeof connector.search !== 'function' || connector.__intentFirstSearchV2) return connector;
    const baseSearch = connector.search.bind(connector);
    const wrapped = {
      ...connector,
      async search(query, options = {}) {
        const variants = buildSearchVariants(query);
        const first = await baseSearch(variants.primary, options);
        if (!shouldRefine(first) || variants.refined === variants.primary) {
          return Object.freeze({ ...first, searchPlanner: Object.freeze({ version: '2.0', intentFirst: true, refined: false, moduleId: variants.moduleId }) });
        }
        const second = await baseSearch(variants.refined, options);
        const picked = searchStrength(second) > searchStrength(first) ? second : first;
        return Object.freeze({ ...picked, searchPlanner: Object.freeze({ version: '2.0', intentFirst: true, refined: true, moduleId: variants.moduleId }) });
      },
      __intentFirstSearchV2: true
    };
    return Object.freeze(wrapped);
  }

  function installIntentFirstSearchPlanner() {
    if (core.__INTENT_FIRST_SEARCH_PLANNER_INSTALLED__) return true;
    if (!core.officialSearchConnector || typeof core.createOfficialSearchConnector !== 'function') return false;
    const baseFactory = core.createOfficialSearchConnector;
    core.createOfficialSearchConnector = function createIntentFirstOfficialSearchConnector(options = {}) {
      return wrapSearchConnector(baseFactory(options));
    };
    core.officialSearchConnector = wrapSearchConnector(core.officialSearchConnector);
    core.__INTENT_FIRST_SEARCH_PLANNER_INSTALLED__ = true;
    return true;
  }

  core.buildIntentFirstSearchVariants = buildSearchVariants;
  core.installIntentFirstSearchPlanner = installIntentFirstSearchPlanner;
  core.MEDIA_ROUTING_GUARDRAIL = Object.freeze({
    moduleId: 'GP012',
    mediaPattern: MEDIA_INTENT,
    coverPattern: COVER_MEDIA_INTENT,
    contentOnlyPattern: CONTENT_ONLY,
    financeDecisionPattern: FINANCE_DECISION,
    budgetDraftPattern: BUDGET_DRAFT_INTENT
  });

  if (!installIntentFirstSearchPlanner() && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', installIntentFirstSearchPlanner, { once: true });
  }
})();
