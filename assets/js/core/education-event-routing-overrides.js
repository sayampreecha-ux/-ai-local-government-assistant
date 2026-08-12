(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;

  const EDUCATION_EVENT = /(?:โครงการ|จัด|จัดงาน|จัดกิจกรรม|ดำเนินโครงการ).{0,28}(?:สัปดาห์วิทยาศาสตร์|วันวิทยาศาสตร์(?:แห่งชาติ)?|ค่ายวิทยาศาสตร์|มหกรรมวิทยาศาสตร์)|(?:สัปดาห์วิทยาศาสตร์|วันวิทยาศาสตร์(?:แห่งชาติ)?|ค่ายวิทยาศาสตร์|มหกรรมวิทยาศาสตร์).{0,28}(?:โครงการ|จัด|จัดงาน|จัดกิจกรรม|ดำเนินโครงการ)|^(?:โครงการวันสัปดาห์วิทยาศาสตร์|โครงการสัปดาห์วิทยาศาสตร์|งานสัปดาห์วิทยาศาสตร์|กิจกรรมวันวิทยาศาสตร์|วันวิทยาศาสตร์แห่งชาติ|ค่ายวิทยาศาสตร์|มหกรรมวิทยาศาสตร์)$/i;
  const EXECUTIVE_SPEECH = /(?:คำกล่าว|กล่าวเปิด|กล่าวปิด|คำกล่าวเปิด|คำกล่าวปิด|สุนทรพจน์|โอวาท|พิธีเปิด|พิธีปิด)/;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isEducationEvent(source) {
    return EDUCATION_EVENT.test(source) && !EXECUTIVE_SPEECH.test(source);
  }

  function correctToEducation(base) {
    if (!base || base.primaryModule === 'GP009') return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === 'GP009');
    const modules = Object.freeze([...new Set(['GP009', ...(base.modules || []).filter(id => id !== 'GP009')])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: 'GP009',
      moduleId: 'GP009',
      transactionType: 'education',
      assistant: assistant || base.assistant,
      modules,
      confidence: 0.996,
      fallback: false,
      ambiguous: false,
      reason: 'post-hybrid:education-science-event-guardrail'
    });
  }

  core.routeRequest = function routeRequestWithEducationEventGuardrail(request, options = {}) {
    const base = baseRouteRequest(request, options);
    const source = normalize(request);
    return isEducationEvent(source) ? correctToEducation(base) : base;
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function routeTransactionWithEducationEventGuardrail(sharedContext, options = {}) {
      const base = baseRouteTransaction(sharedContext, options);
      const context = base?.context || sharedContext || {};
      const source = normalize([
        context.transactionType, context.domain, context.currentStage, context.facts,
        context.documents, context.desiredOutput,
        ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      ].filter(Boolean).join(' '));
      return isEducationEvent(source) ? correctToEducation(base) : base;
    };
  }

  core.EDUCATION_EVENT_ROUTING_GUARDRAIL = Object.freeze({ moduleId: 'GP009', pattern: EDUCATION_EVENT });
})();
