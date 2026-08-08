(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeTransaction !== 'function') return;

  const originalRouteTransaction = core.routeTransaction;
  const moduleType = Object.freeze({
    GP001: 'records', GP002: 'legal', GP003: 'procurement', GP004: 'planning-budget',
    GP005: 'finance', GP006: 'human-resources', GP007: 'engineering', GP008: 'public-health',
    GP009: 'education', GP010: 'internal-audit', GP011: 'executive', GP012: 'public-relations', GP013: 'council'
  });

  const RULES = Object.freeze([
    Object.freeze({ moduleId: 'GP001', patterns: Object.freeze([
      /(?:ช่วย)?(?:ทำ|ร่าง|เขียน|จัดทำ)?.{0,10}หนังสือ(?:เชิญ|ขอความร่วมมือ|แจ้ง|ตอบ|ส่ง)/,
      /หนังสือเชิญ(?:ประชุม|ร่วมงาน|เข้าร่วม|วิทยากร)?/
    ]) }),
    Object.freeze({ moduleId: 'GP009', patterns: Object.freeze([
      /(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก).{0,30}(?:โครงการ|อาหาร|เบิก|จ่าย|ซื้อ)/,
      /(?:โครงการ|อาหาร|เบิก|จ่าย|ซื้อ).{0,30}(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก)/
    ]) }),
    Object.freeze({ moduleId: 'GP010', patterns: Object.freeze([
      /(?:ตรวจสอบ|สอบทาน|ตรวจติดตาม).{0,20}(?:การเบิกจ่าย|เบิกจ่าย|พัสดุ|การเงิน|งบประมาณ|ครุภัณฑ์|ทรัพย์สิน)/,
      /(?:audit|ตรวจสอบภายใน).{0,25}(?:พัสดุ|การเงิน|เบิกจ่าย|งบประมาณ)/i
    ]) }),
    Object.freeze({ moduleId: 'GP012', patterns: Object.freeze([
      /(?:ทำ|สร้าง|ร่าง|เขียน)?.{0,8}(?:อินโฟ|อินโฟกราฟิก).{0,30}(?:สรุป|กฎหมาย|ข่าว|โครงการ|ประชาสัมพันธ์)?/,
      /(?:สรุป|กฎหมาย|ข่าว|โครงการ).{0,20}(?:เป็น|ทำ)?\s*(?:อินโฟ|อินโฟกราฟิก)/
    ]) }),
    Object.freeze({ moduleId: 'GP013', patterns: Object.freeze([
      /(?:สภา|สภาท้องถิ่น|มติสภา|ญัตติ).{0,30}(?:อนุมัติ|เห็นชอบ|โครงการ|งบประมาณ|งบ|แผน)/,
      /(?:ญัตติ).{0,20}(?:งบประมาณ|โครงการ|แผน)/,
      /(?:งบประมาณ|โครงการ|แผน).{0,20}(?:ญัตติ|มติสภา|สภาท้องถิ่น)/
    ]) })
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().trim();
  }

  function getSource(context) {
    return normalize([
      context?.transactionType,
      context?.domain,
      context?.currentStage,
      context?.facts,
      context?.documents,
      context?.desiredOutput,
      ...(Array.isArray(context?.specialFlags) ? context.specialFlags : [])
    ].filter(Boolean).join(' '));
  }

  function forcedModule(source) {
    for (const rule of RULES) {
      if (rule.patterns.some(pattern => pattern.test(source))) return rule.moduleId;
    }
    return '';
  }

  core.routeTransaction = function routeTransactionWithRegressionGuardrails(sharedContext, options = {}) {
    const result = originalRouteTransaction(sharedContext, options);
    const source = getSource(result.context || sharedContext);
    const moduleId = forcedModule(source);
    if (!moduleId || moduleId === result.moduleId) return result;

    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const modules = Object.freeze([...new Set([moduleId, ...(result.modules || [])])].slice(0, 3));
    return Object.freeze({
      ...result,
      moduleId,
      transactionType: moduleType[moduleId] || 'general',
      assistant,
      modules,
      confidence: 0.97,
      fallback: false,
      ambiguous: false,
      reason: 'regression-guardrail'
    });
  };

  core.ROUTER_REGRESSION_RULES = RULES;
})();
