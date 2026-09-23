(() => {
  'use strict';
  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;
  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;
  const K_PATTERN = /ค่า\s*K|ค่าชดเชยค่างานก่อสร้าง|สัญญาแบบปรับราคาได้|เงินชดเชยค่างาน|CUCEM[-\s]?K/i;
  const normalize = value => String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();

  function force(route, source) {
    if (!K_PATTERN.test(normalize(source))) return route;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === 'GP007');
    return Object.freeze({
      ...(route || {}),
      primaryModule: 'GP007',
      moduleId: 'GP007',
      transactionType: 'engineering',
      assistant: assistant || route?.assistant,
      modules: Object.freeze(['GP007', ...((route?.modules || []).filter(id => id !== 'GP007'))].slice(0, 3)),
      confidence: 0.995,
      fallback: false,
      ambiguous: false,
      reason: 'engineering-k-audit-override'
    });
  }

  core.routeRequest = function engineeringKAuditRouteRequest(request, options = {}) {
    return force(baseRouteRequest(request, options), request);
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function engineeringKAuditRouteTransaction(context, options = {}) {
      const base = baseRouteTransaction(context, options);
      const c = base?.context || context || {};
      const source = [
        c.transactionType, c.domain, c.currentStage, c.facts, c.documents,
        c.desiredOutput, ...(Array.isArray(c.specialFlags) ? c.specialFlags : [])
      ].filter(Boolean).join(' ');
      return force(base, source);
    };
  }

  core.ENGINEERING_K_ROUTING_OVERRIDE = Object.freeze({ moduleId: 'GP007', pattern: String(K_PATTERN) });
})();