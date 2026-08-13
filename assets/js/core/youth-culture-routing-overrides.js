(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;
  const TARGET = 'GP009';
  const MODULE_TYPE = 'education';

  const EDUCATION_CULTURE = /(?:โครงการ|จัด|จัดกิจกรรม|จัดงาน|ดำเนินโครงการ|กิจกรรม)?.{0,24}(?:บวชสามเณร|บรรพชาสามเณร|บรรพชาอุปสมบท|สามเณรภาคฤดูร้อน|บวชภาคฤดูร้อน|ค่ายคุณธรรม(?:เยาวชน)?|อบรมคุณธรรม(?:เยาวชน)?|ส่งเสริมคุณธรรม(?:เด็ก|เยาวชน)?)/;
  const KEEP_EXISTING = /(?:คำกล่าว|กล่าวเปิด|กล่าวปิด|พิธีเปิด|พิธีปิด|โปสเตอร์|โพสต์|ประชาสัมพันธ์|อินโฟกราฟิก|แคปชัน|ข่าวประชาสัมพันธ์|จัดซื้อ|จัดจ้าง|ซื้อ|จ้าง|tor|เบิก|เบิกจ่าย|มีอำนาจ|ฐานอำนาจ|ผิดกฎหมาย|ถูกกฎหมาย)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function shouldRoute(source) {
    return EDUCATION_CULTURE.test(source) && !KEEP_EXISTING.test(source);
  }

  function correct(base) {
    if (!base || base.primaryModule === TARGET) return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === TARGET);
    const modules = Object.freeze([...new Set([TARGET, ...(base.modules || []).filter(id => id !== TARGET)])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: TARGET,
      moduleId: TARGET,
      transactionType: MODULE_TYPE,
      assistant: assistant || base.assistant,
      modules,
      confidence: 0.995,
      fallback: false,
      ambiguous: false,
      reason: 'post-hybrid:youth-culture-education-guardrail'
    });
  }

  core.routeRequest = function routeRequestWithYouthCultureGuardrail(request, options = {}) {
    const base = baseRouteRequest(request, options);
    return shouldRoute(normalize(request)) ? correct(base) : base;
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function routeTransactionWithYouthCultureGuardrail(sharedContext, options = {}) {
      const base = baseRouteTransaction(sharedContext, options);
      const context = base?.context || sharedContext || {};
      const source = normalize([
        context.transactionType, context.domain, context.currentStage, context.facts,
        context.documents, context.desiredOutput,
        ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      ].filter(Boolean).join(' '));
      return shouldRoute(source) ? correct(base) : base;
    };
  }
})();
