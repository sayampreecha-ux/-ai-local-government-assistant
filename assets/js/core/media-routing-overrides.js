(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;

  const MEDIA_INTENT = /(?:การ์ด(?:อวยพร)?|โปสเตอร์|อินโฟกราฟิก|ภาพประชาสัมพันธ์|ภาพอวยพร|แคปชัน|โพสต์(?:ประชาสัมพันธ์)?|ข่าวประชาสัมพันธ์).{0,35}(?:วันแม่|วันพ่อ|วันเด็ก|ปีใหม่|สงกรานต์|วันสำคัญ|อวยพร|ประชาสัมพันธ์)?|(?:ทำ|สร้าง|ออกแบบ|เขียน).{0,18}(?:การ์ด(?:อวยพร)?|โปสเตอร์|อินโฟกราฟิก|ภาพประชาสัมพันธ์|ภาพอวยพร|แคปชัน|โพสต์(?:ประชาสัมพันธ์)?|ข่าวประชาสัมพันธ์)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isMediaIntent(source) {
    return MEDIA_INTENT.test(source);
  }

  function correctToPublicRelations(base) {
    if (!base || base.primaryModule === 'GP012') return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === 'GP012');
    const modules = Object.freeze([...new Set(['GP012', ...(base.modules || []).filter(id => id !== 'GP012')])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: 'GP012',
      moduleId: 'GP012',
      transactionType: 'public-relations',
      assistant: assistant || base.assistant,
      modules,
      confidence: 0.995,
      fallback: false,
      ambiguous: false,
      reason: 'post-hybrid:media-public-relations-guardrail'
    });
  }

  core.routeRequest = function routeRequestWithMediaGuardrail(request, options = {}) {
    const base = baseRouteRequest(request, options);
    const source = normalize(request);
    return isMediaIntent(source) ? correctToPublicRelations(base) : base;
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function routeTransactionWithMediaGuardrail(sharedContext, options = {}) {
      const base = baseRouteTransaction(sharedContext, options);
      const context = base?.context || sharedContext || {};
      const source = normalize([
        context.transactionType, context.domain, context.currentStage, context.facts,
        context.documents, context.desiredOutput,
        ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      ].filter(Boolean).join(' '));
      return isMediaIntent(source) ? correctToPublicRelations(base) : base;
    };
  }

  core.MEDIA_ROUTING_GUARDRAIL = Object.freeze({ moduleId: 'GP012', pattern: MEDIA_INTENT });
})();
