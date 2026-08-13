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

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isMediaIntent(source) {
    if (CONTENT_ONLY.test(source) || FINANCE_DECISION.test(source)) return false;
    return MEDIA_INTENT.test(source) || COVER_MEDIA_INTENT.test(source);
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

  core.MEDIA_ROUTING_GUARDRAIL = Object.freeze({ moduleId: 'GP012', mediaPattern: MEDIA_INTENT, coverPattern: COVER_MEDIA_INTENT, contentOnlyPattern: CONTENT_ONLY, financeDecisionPattern: FINANCE_DECISION });
})();