(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function' || typeof core.routeTransaction !== 'function') return;

  const originalRouteRequest = core.routeRequest;
  const originalRouteTransaction = core.routeTransaction;
  const MODULE_TYPE = Object.freeze({
    GP002: 'legal',
    GP003: 'procurement',
    GP005: 'finance'
  });

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function forcedModule(source) {
    const text = normalize(source);
    if (!text) return '';

    if (/เบี้ยเลี้ยง/.test(text)) return 'GP005';

    if (/\btor\b/i.test(text)
      && (/(?:ตรวจ|เช็ก|เช็ค|ไฟล์).{0,24}\btor\b/i.test(text)
        || /\btor\b.{0,24}(?:ตรวจ|เช็ก|เช็ค|ไฟล์)/i.test(text))) return 'GP003';

    const authorityAction = /(?:มีอำนาจ|ไม่มีอำนาจ).{0,45}(?:ยกเลิก|เพิกถอน).{0,45}(?:บัญชี|สอบแข่งขัน|การสอบ)/;
    const actionAuthority = /(?:ยกเลิก|เพิกถอน).{0,45}(?:บัญชี|สอบแข่งขัน|การสอบ).{0,45}(?:มีอำนาจ|ไม่มีอำนาจ)/;
    if (authorityAction.test(text) || actionAuthority.test(text)) return 'GP002';

    return '';
  }

  function corrected(result, moduleId, reason) {
    if (!moduleId || moduleId === result?.primaryModule) return result;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const modules = Object.freeze([...new Set([moduleId, ...(result?.modules || []).filter(id => id !== moduleId)])].slice(0, 3));
    return Object.freeze({
      ...result,
      primaryModule: moduleId,
      moduleId,
      transactionType: MODULE_TYPE[moduleId] || result?.transactionType || 'general',
      assistant: assistant || result?.assistant,
      modules,
      confidence: 0.995,
      fallback: false,
      ambiguous: false,
      reason
    });
  }

  core.routeRequest = function routeRequestWithRealQueryHotfix(request, options = {}) {
    const result = originalRouteRequest(request, options);
    return corrected(result, forcedModule(request), 'real-query-hotfix');
  };

  core.routeTransaction = function routeTransactionWithRealQueryHotfix(sharedContext, options = {}) {
    const result = originalRouteTransaction(sharedContext, options);
    const context = result?.context || sharedContext || {};
    const source = [context.transactionType, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput]
      .concat(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      .filter(Boolean)
      .join(' ');
    return corrected(result, forcedModule(source), 'real-query-hotfix');
  };

  core.ROUTER_REAL_QUERY_HOTFIX = Object.freeze({ forcedModule });
})();
