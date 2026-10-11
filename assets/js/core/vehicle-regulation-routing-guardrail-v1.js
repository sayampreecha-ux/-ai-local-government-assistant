(() => {
  'use strict';

  // Scoped to government vehicles only. Do not change the general router.
  const core = window.GovPromptCore;
  if (!core || typeof core.routeTransaction !== 'function') return;
  const baseRouteTransaction = core.routeTransaction;
  const baseRouteRequest = typeof core.routeRequest === 'function' ? core.routeRequest : null;
  const GOVERNMENT = /(?:อบจ\.?|อบต\.?|อปท\.?|เทศบาล|ราชการ|ส่วนกลาง|ประจำตำแหน่ง|องค์กรปกครองส่วนท้องถิ่น|ท้องถิ่น)/i;
  const VEHICLE = /(?:รถ(?:ยนต์|ไฟฟ้า|ราชการ|ส่วนกลาง|ประจำตำแหน่ง|ดับเพลิง)?|ยานพาหนะ|บัตรอัดประจุไฟฟ้า|สก\.?\s*1|ปต\.?\s*1)/i;
  const ACTION = /(?:สก\.?\s*1|ปต\.?\s*1|ซ่อม|เสีย|ชำรุด|ยางรั่ว|ยางแตก|รถยก|จัดหา|จัดซื้อ|จัดจ้าง|ซื้อ|เช่า|ใช้รถ|ขอใช้|อนุมัติ|เบิก|ชาร์จ|อัดประจุ|เติมน้ำมัน|บันทึก|แบบ\s*[1-6]|ระเบียบ)/i;
  const DECISION = /(?:ได้ไหม|ได้ไห|ได้มั้ย|ได้หรือไม่|หรือไม่|อย่างไร|ยังไง|ทำไง|ต้อง|ควร|ทันที|ก่อนอนุมัติ|ฉุกเฉิน|เร่งด่วน|ขอใช้|อนุมัติ|เบิก|ซ่อม|จัดซื้อ|จัดจ้าง|เช่า)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
  }
  function isVehicleRegulationRequest(value) {
    const source = normalize(value);
    return GOVERNMENT.test(source) && VEHICLE.test(source) && ACTION.test(source);
  }
  function isVehicleRegulationDecision(value) {
    const source = normalize(value);
    return isVehicleRegulationRequest(source) && DECISION.test(source);
  }
  function correctRoute(route, source) {
    if (!isVehicleRegulationRequest(source) || !route) return route;
    const moduleId = 'GP003';
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const modules = Object.freeze([...new Set([moduleId, ...(route.modules || []).filter(id => id !== moduleId)])].slice(0, 3));
    return Object.freeze({
      ...route, moduleId, primaryModule: moduleId, transactionType: 'procurement',
      assistant: assistant || route.assistant, modules,
      confidence: Math.max(0.98, route.confidence || 0), fallback: false,
      ambiguous: false, reason: 'vehicle-regulation-2569:procurement-primary'
    });
  }

  core.routeTransaction = function routeTransactionWithVehicleRegulation(sharedContext, options = {}) {
    const route = baseRouteTransaction(sharedContext, options);
    const context = route?.context || sharedContext || {};
    const source = [
      context.facts, context.desiredOutput, context.documents, context.currentStage,
      ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
    ].filter(Boolean).join(' ');
    return correctRoute(route, source);
  };
  if (baseRouteRequest) {
    core.routeRequest = function routeRequestWithVehicleRegulation(request, options = {}) {
      return correctRoute(baseRouteRequest(request, options), normalize(request));
    };
  }
  core.isVehicleRegulationRequest = isVehicleRegulationRequest;
  core.isVehicleRegulationDecision = isVehicleRegulationDecision;
  core.VEHICLE_REGULATION_GUARDRAIL_VERSION = '1.0.0';
})();