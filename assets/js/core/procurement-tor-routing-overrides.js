(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;
  const TOR_PATTERN = /(?:\btor\b|ที\s*โอ\s*อาร์|ทีโออาร์|ขอบเขต(?:ของ)?งาน(?:จัดซื้อจัดจ้าง)?)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function correctToProcurement(base) {
    if (!base || base.primaryModule === 'GP003') return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === 'GP003');
    const modules = Object.freeze([...new Set(['GP003', ...(base.modules || []).filter(id => id !== 'GP003')])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: 'GP003',
      moduleId: 'GP003',
      transactionType: 'procurement',
      assistant: assistant || base.assistant,
      modules,
      confidence: 0.999,
      fallback: false,
      ambiguous: false,
      reason: 'post-hybrid:tor-procurement-guardrail'
    });
  }

  core.routeRequest = function routeRequestWithTorGuardrail(request, options = {}) {
    const base = baseRouteRequest(request, options);
    return TOR_PATTERN.test(normalize(request)) ? correctToProcurement(base) : base;
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function routeTransactionWithTorGuardrail(sharedContext, options = {}) {
      const base = baseRouteTransaction(sharedContext, options);
      const context = base?.context || sharedContext || {};
      const source = normalize([
        context.transactionType, context.domain, context.currentStage, context.facts,
        context.documents, context.desiredOutput,
        ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      ].filter(Boolean).join(' '));
      return TOR_PATTERN.test(source) ? correctToProcurement(base) : base;
    };
  }

  core.TOR_PROCUREMENT_ROUTING_GUARDRAIL = Object.freeze({ moduleId: 'GP003', pattern: TOR_PATTERN });
})();
