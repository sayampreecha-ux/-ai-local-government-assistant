(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function' || typeof core.routeTransaction !== 'function') return;

  const originalRouteRequest = core.routeRequest;
  const originalRouteTransaction = core.routeTransaction;
  const MODULE_TYPE = Object.freeze({
    GP001: 'records',
    GP002: 'legal',
    GP003: 'procurement',
    GP004: 'planning-budget',
    GP005: 'finance',
    GP006: 'human-resources',
    GP008: 'public-health',
    GP010: 'internal-audit',
    GP012: 'public-relations'
  });

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function forcedModule(source) {
    const text = normalize(source);
    if (!text) return '';

    if (/เบี้ยเลี้ยง/.test(text)) return 'GP005';

    if (/(?:ตรวจ|ตรวจสอบ|เช็ก|เช็ค).{0,18}(?:เอกสาร)?(?:เบิกจ่าย|ฎีกา|ขอเบิก).{0,28}(?:ก่อนเสนอ|เสนออนุมัติ|อนุมัติ)/.test(text)
      || /(?:เบิกจ่าย|ฎีกา|ขอเบิก).{0,28}(?:ตรวจ|ตรวจสอบ|เช็ก|เช็ค).{0,18}(?:ก่อนเสนอ|เสนออนุมัติ|อนุมัติ)/.test(text)) return 'GP005';

    if (/(?:เงินสะสม|เงินสำรองจ่าย).{0,55}(?:ซ่อม|ถนน|น้ำท่วม|ฉุกเฉิน)/.test(text)
      || /(?:ซ่อม|ถนน|น้ำท่วม|ฉุกเฉิน).{0,55}(?:เงินสะสม|เงินสำรองจ่าย)/.test(text)) return 'GP004';

    if (/(?:ทำ|เขียน|จัดทำ).{0,14}(?:โครงการ).{0,32}(?:ส่งเสริมสุขภาพ|สุขภาพ|ป้องกันโรค|ฟื้นฟูสุขภาพ)/.test(text)
      || /(?:โครงการ).{0,32}(?:ส่งเสริมสุขภาพ|สุขภาพ|ป้องกันโรค|ฟื้นฟูสุขภาพ)/.test(text)) return 'GP008';

    const localExecutiveCareer = /(?:รองปลัด|ปลัด).{0,16}(?:ต้น|กลาง|สูง).{0,55}(?:กี่ปี|กี่ปีถึง|ครองตำแหน่ง|ดำรงตำแหน่ง|สอบคัดเลือก|สอบได้|เลื่อน|ขึ้น|เป็น).{0,30}(?:ปลัด)?(?:ต้น|กลาง|สูง)?/;
    const professionalCareer = /(?:ชก\.?|ชำนาญการ).{0,35}(?:กี่ปี|ครองตำแหน่ง|ดำรงตำแหน่ง|เลื่อน|ขึ้น|เป็น).{0,25}(?:ชพ\.?|ชำนาญการพิเศษ)/;
    if (localExecutiveCareer.test(text) || professionalCareer.test(text)) return 'GP006';

    if (/\btor\b/i.test(text)
      && (/(?:ตรวจ|เช็ก|เช็ค|ไฟล์).{0,24}\btor\b/i.test(text)
        || /\btor\b.{0,24}(?:ตรวจ|เช็ก|เช็ค|ไฟล์)/i.test(text))) return 'GP003';

    if (/(?:ทำ|สร้าง|ร่าง|เขียน|ออกแบบ).{0,20}(?:วิดีโอ|วีดีโอ|คลิป|video).{0,40}(?:ประชาสัมพันธ์|แนะนำองค์กร|แนะนำหน่วยงาน|องค์กร|หน่วยงาน)?/i.test(text)
      || /(?:วิดีโอ|วีดีโอ|คลิป|video).{0,35}(?:ประชาสัมพันธ์|แนะนำองค์กร|แนะนำหน่วยงาน|องค์กร|หน่วยงาน)/i.test(text)
      || /(?:ทำ|ร่าง|เขียน).{0,20}(?:ข้อความ|โพสต์).{0,40}(?:ประชาสัมพันธ์|เชิญชวน)/.test(text)
      || /(?:ข้อความ|โพสต์).{0,35}(?:เชิญชวน|ประชาสัมพันธ์)/.test(text)) return 'GP012';

    const authorityAction = /(?:มีอำนาจ|ไม่มีอำนาจ).{0,45}(?:ยกเลิก|เพิกถอน).{0,45}(?:บัญชี|สอบแข่งขัน|การสอบ)/;
    const actionAuthority = /(?:ยกเลิก|เพิกถอน).{0,45}(?:บัญชี|สอบแข่งขัน|การสอบ).{0,45}(?:มีอำนาจ|ไม่มีอำนาจ)/;
    if (authorityAction.test(text) || actionAuthority.test(text)) return 'GP002';

    return '';
  }

  function contextualDocumentModule(result, source) {
    const text = normalize(source);
    if (!text || result?.primaryModule !== 'GP011' || Number(result?.confidence ?? 1) > 0.5) return '';
    if (!/(?:เอกสาร|รายงาน|ข้อความ|สองฉบับ|ไฟล์)/.test(text)) return '';
    if (/(?:ความเสี่ยง|เสี่ยง|จุดขัดแย้ง|ผิดระเบียบ|ตรวจสอบ)/.test(text)) return 'GP010';
    if (/(?:เปรียบเทียบ|ต่างกัน|ปรับข้อความ|แปลง|ดึง|สรุป|ย่อ)/.test(text)) return 'GP001';
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
    const forced = forcedModule(request) || contextualDocumentModule(result, request);
    return corrected(result, forced, 'real-query-hotfix');
  };

  core.routeTransaction = function routeTransactionWithRealQueryHotfix(sharedContext, options = {}) {
    const result = originalRouteTransaction(sharedContext, options);
    const context = result?.context || sharedContext || {};
    const source = [context.transactionType, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput]
      .concat(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      .filter(Boolean)
      .join(' ');
    const forced = forcedModule(source) || contextualDocumentModule(result, source);
    return corrected(result, forced, 'real-query-hotfix');
  };

  core.ROUTER_REAL_QUERY_HOTFIX = Object.freeze({ forcedModule, contextualDocumentModule });
})();