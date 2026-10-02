(() => {
  'use strict';

  // GovPrompt policy: the GP frontend must not perform live web searches.
  // It may prepare a search plan for the user's selected AI platform.
  const POLICY_VERSION = 'user-ai-search-only-1.0';
  const WARNING = 'GovPrompt ไม่ค้นเว็บสดเอง — โปรดนำแผนค้นนี้ไปใช้กับ ChatGPT/Gemini หรือ AI ที่ผู้ใช้เลือก';
  const PRIMARY_TERMS = ['พระราชบัญญัติ', 'กฎกระทรวง', 'ระเบียบ', 'ประกาศ', 'หนังสือสั่งการ', 'หนังสือเวียน', 'หลักเกณฑ์'];
  const MODULE_HINTS = Object.freeze({
    GP003: 'จัดซื้อจัดจ้าง พัสดุภาครัฐ TOR ราคากลาง วิธีจัดซื้อจัดจ้าง กรมบัญชีกลาง',
    GP002: 'กฎหมาย ระเบียบ หนังสือสั่งการ ฐานอำนาจ องค์กรปกครองส่วนท้องถิ่น',
    GP005: 'การเงิน การคลัง การเบิกจ่าย ระเบียบ หลักเกณฑ์ องค์กรปกครองส่วนท้องถิ่น'
  });

  function text(value) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
  function createSearchPlan(query, options = {}) {
    const originalQuery = text(query);
    const module = text(options.module || options.routedModule || 'GP003');
    const hint = MODULE_HINTS[module] || MODULE_HINTS.GP003;
    const primary = PRIMARY_TERMS.filter(term => originalQuery.includes(term));
    const planQuery = [originalQuery, hint, primary.join(' ')].filter(Boolean).join(' ');
    return Object.freeze({
      originalQuery,
      query: planQuery,
      routedModules: module ? [module] : [],
      sources: Object.freeze(['ratchakitcha.soc.go.th', 'krisdika.go.th', 'cgd.go.th', 'moi.go.th', 'dla.go.th', 'bb.go.th', 'admincourt.go.th', 'coj.go.th', 'nacc.go.th', 'audit.go.th']),
      userAiOnly: true,
      liveSearchRequired: false,
      execution: 'user-selected-ai'
    });
  }
  function rewriteQuery(query, options = {}) { return createSearchPlan(query, options).query; }
  function requiresFreshnessVerification(query) {
    return /ล่าสุด|ปัจจุบัน|มีผลใช้บังคับ|ยกเลิก|แก้ไข|current|latest|effective|repealed/i.test(text(query));
  }
  function planOnly(plan, warning = WARNING, errorCode = 'USER_AI_SEARCH_ONLY') {
    return Object.freeze({ mode: 'plan-only', plan, results: Object.freeze([]), freshness: null,
      evidence: Object.freeze({ primaryResults: Object.freeze([]), secondaryResults: Object.freeze([]), citations: Object.freeze([]), verificationRequired: false, verifiedCurrent: false, strongPrimaryEvidence: false, conclusionEligible: false, warning }),
      verificationRequired: false, searchedAt: '', provider: '', warning, errorCode, policyVersion: POLICY_VERSION });
  }
  function createOfficialSearchConnector() {
    return Object.freeze({
      search: async (query, options = {}) => planOnly(createSearchPlan(query, options)),
      createSearchPlan,
      rewriteQuery,
      rankResults: results => Object.freeze(Array.isArray(results) ? results : []),
      createEvidence: () => Object.freeze({ primaryResults: [], secondaryResults: [], citations: [], verificationRequired: false, verifiedCurrent: false, strongPrimaryEvidence: false, conclusionEligible: false, warning: WARNING }),
      requiresFreshnessVerification,
      queryTerms: () => Object.freeze([]),
      citationConfidence: () => 'low'
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.OFFICIAL_SEARCH_POLICY_VERSION = POLICY_VERSION;
  window.GovPromptCore.OFFICIAL_SEARCH_USER_AI_ONLY = true;
  window.GovPromptCore.UNVERIFIED_LATEST_WARNING = WARNING;
  window.GovPromptCore.requiresFreshnessVerification = requiresFreshnessVerification;
  window.GovPromptCore.rewriteOfficialSearchQuery = rewriteQuery;
  window.GovPromptCore.createOfficialSearchPlan = createSearchPlan;
  window.GovPromptCore.rankOfficialSearchResults = results => Object.freeze(Array.isArray(results) ? results : []);
  window.GovPromptCore.createOfficialSearchEvidence = () => Object.freeze({ primaryResults: [], secondaryResults: [], citations: [], verificationRequired: false, verifiedCurrent: false, strongPrimaryEvidence: false, conclusionEligible: false, warning: WARNING });
  window.GovPromptCore.officialSearchQueryTerms = () => Object.freeze([]);
  window.GovPromptCore.detectOfficialSearchIntent = () => false;
  window.GovPromptCore.detectOfficialSearchSubject = () => null;
  window.GovPromptCore.officialSearchCitationConfidence = () => 'low';
  window.GovPromptCore.createOfficialSearchConnector = createOfficialSearchConnector;
  window.GovPromptCore.officialSearchConnector = createOfficialSearchConnector();
})();