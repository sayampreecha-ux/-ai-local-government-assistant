(() => {
  'use strict';

  const core = window.GovPromptCore || {};
  const connector = core.officialSearchConnector;
  const CLIENT_TIMEOUT_MS = 12_000;
  if (!connector || typeof connector.search !== 'function') return;

  const frozenEmpty = Object.freeze([]);

  function fallbackPlan(query, options, errorCode) {
    let plan = null;
    try {
      if (typeof core.createOfficialSearchPlan === 'function') plan = core.createOfficialSearchPlan(query, options);
      else if (typeof connector.createSearchPlan === 'function') plan = connector.createSearchPlan(query, options);
    } catch {}
    const warning = 'บริการค้นเว็บราชการตอบช้าเกินกำหนด — ระบบหยุดรอและทำงานต่อแบบไม่ฟันธงจากข้อมูลสด';
    return Object.freeze({
      mode: 'plan-only',
      plan,
      results: frozenEmpty,
      freshness: null,
      evidence: Object.freeze({
        primaryResults: frozenEmpty,
        secondaryResults: frozenEmpty,
        citations: frozenEmpty,
        verificationRequired: Boolean(options?.requireFreshness),
        verifiedCurrent: false,
        strongPrimaryEvidence: false,
        conclusionEligible: false,
        warning
      }),
      warning,
      errorCode
    });
  }

  async function search(query, options = {}) {
    let timer;
    const timeoutToken = Object.freeze({ timeout: true });
    try {
      const result = await Promise.race([
        Promise.resolve().then(() => connector.search(query, options)).catch(() => fallbackPlan(query, options, 'SEARCH_NETWORK_ERROR')),
        new Promise(resolve => { timer = setTimeout(() => resolve(timeoutToken), CLIENT_TIMEOUT_MS); })
      ]);
      if (result === timeoutToken) return fallbackPlan(query, options, 'SEARCH_CLIENT_TIMEOUT');
      return result;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  core.officialSearchConnector = Object.freeze({ ...connector, search });
  core.OFFICIAL_SEARCH_CLIENT_TIMEOUT_MS = CLIENT_TIMEOUT_MS;
})();
