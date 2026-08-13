(() => {
  'use strict';
  const core = window.GovPromptCore;
  if (!core || typeof core.routeTransaction !== 'function') return;
  const baseRouteTransaction = core.routeTransaction;
  const financeQuestion = /(?:เบิก|เบิกจ่าย|ค่าใช้จ่าย|จ่าย|ใช้เงิน|ใช้งบ).{0,80}(?:ได้ไหม|ได้หรือไม่|ได้มั้ย|หรือไม่)/i;
  const specialized = /(?:\btor\b|จัดซื้อ|จัดจ้าง|พัสดุ|ราคากลาง|รพ\.?สต\.?|สาธารณสุข|ยา|เวชภัณฑ์|โรงเรียน|นักเรียน|ครู|ถนน|ก่อสร้าง)/i;

  core.routeTransaction = function routeTransactionWithFinancePriority(sharedContext, options = {}) {
    const base = baseRouteTransaction(sharedContext, options);
    const context = base?.context || sharedContext || {};
    const source = [context.transactionType, context.domain, context.facts, context.documents, context.desiredOutput]
      .filter(Boolean).join(' ');
    if (!financeQuestion.test(source) || specialized.test(source) || base?.primaryModule === 'GP005') return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === 'GP005');
    const modules = Object.freeze([...new Set(['GP005', ...(base?.modules || []).filter(id => id !== 'GP005')])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: 'GP005',
      moduleId: 'GP005',
      transactionType: 'finance',
      assistant: assistant || base?.assistant,
      modules,
      confidence: 0.995,
      routeCorrection: 'finance-question-priority'
    });
  };
})();
