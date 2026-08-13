(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;

  const EDUCATION_EVENT = /(?:โครงการ|จัด|จัดงาน|จัดกิจกรรม|ดำเนินโครงการ).{0,28}(?:สัปดาห์วิทยาศาสตร์|วันวิทยาศาสตร์(?:แห่งชาติ)?|ค่ายวิทยาศาสตร์|มหกรรมวิทยาศาสตร์|บวชสามเณร|บรรพชาสามเณร|บรรพชาอุปสมบท|สามเณรภาคฤดูร้อน|บวชภาคฤดูร้อน|ค่ายคุณธรรม(?:เยาวชน)?|อบรมคุณธรรม(?:เยาวชน)?|ส่งเสริมคุณธรรม(?:เด็ก|เยาวชน)?)|(?:สัปดาห์วิทยาศาสตร์|วันวิทยาศาสตร์(?:แห่งชาติ)?|ค่ายวิทยาศาสตร์|มหกรรมวิทยาศาสตร์|บวชสามเณร|บรรพชาสามเณร|บรรพชาอุปสมบท|สามเณรภาคฤดูร้อน|บวชภาคฤดูร้อน|ค่ายคุณธรรม(?:เยาวชน)?|อบรมคุณธรรม(?:เยาวชน)?|ส่งเสริมคุณธรรม(?:เด็ก|เยาวชน)?).{0,28}(?:โครงการ|จัด|จัดงาน|จัดกิจกรรม|ดำเนินโครงการ)|^(?:โครงการวันสัปดาห์วิทยาศาสตร์|โครงการสัปดาห์วิทยาศาสตร์|งานสัปดาห์วิทยาศาสตร์|กิจกรรมวันวิทยาศาสตร์|วันวิทยาศาสตร์แห่งชาติ|ค่ายวิทยาศาสตร์|มหกรรมวิทยาศาสตร์|โครงการบวชสามเณร|โครงการบรรพชาสามเณร|โครงการบรรพชาอุปสมบท|สามเณรภาคฤดูร้อน|บวชภาคฤดูร้อน|ค่ายคุณธรรมเยาวชน)$/i;
  const TOR_PATTERN = /(?:\btor\b|ที\s*โอ\s*อาร์|ทีโออาร์|ขอบเขต(?:ของ)?งาน(?:จัดซื้อจัดจ้าง)?)/i;
  const KEEP_EXISTING = /(?:คำกล่าว|กล่าวเปิด|กล่าวปิด|คำกล่าวเปิด|คำกล่าวปิด|สุนทรพจน์|โอวาท|พิธีเปิด|พิธีปิด|โปสเตอร์|โพสต์|ประชาสัมพันธ์|อินโฟกราฟิก|แคปชัน|ข่าวประชาสัมพันธ์|จัดซื้อ|จัดจ้าง|ซื้อ|จ้าง|tor|ทีโออาร์|ที\s*โอ\s*อาร์|ขอบเขต(?:ของ)?งาน|เบิก|เบิกจ่าย|มีอำนาจ|ฐานอำนาจ|ผิดกฎหมาย|ถูกกฎหมาย)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function isEducationEvent(source) {
    return EDUCATION_EVENT.test(source) && !KEEP_EXISTING.test(source);
  }

  function correct(base, moduleId, transactionType, reason, confidence) {
    if (!base || base.primaryModule === moduleId) return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const modules = Object.freeze([...new Set([moduleId, ...(base.modules || []).filter(id => id !== moduleId)])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: moduleId,
      moduleId,
      transactionType,
      assistant: assistant || base.assistant,
      modules,
      confidence,
      fallback: false,
      ambiguous: false,
      reason
    });
  }

  function correctToEducation(base) {
    return correct(base, 'GP009', 'education', 'post-hybrid:education-event-guardrail', 0.996);
  }

  function correctToProcurement(base) {
    return correct(base, 'GP003', 'procurement', 'post-hybrid:tor-procurement-guardrail', 0.999);
  }

  function applyGuardrails(base, source) {
    if (TOR_PATTERN.test(source)) return correctToProcurement(base);
    if (isEducationEvent(source)) return correctToEducation(base);
    return base;
  }

  core.routeRequest = function routeRequestWithEducationEventGuardrail(request, options = {}) {
    const base = baseRouteRequest(request, options);
    return applyGuardrails(base, normalize(request));
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
      return applyGuardrails(base, source);
    };
  }

  core.EDUCATION_EVENT_ROUTING_GUARDRAIL = Object.freeze({ moduleId: 'GP009', pattern: EDUCATION_EVENT });
  core.TOR_PROCUREMENT_ROUTING_GUARDRAIL = Object.freeze({ moduleId: 'GP003', pattern: TOR_PATTERN });
})();
