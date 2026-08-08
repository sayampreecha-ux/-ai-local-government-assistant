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

  // High-precision semantic guardrails for common Thai local-government phrasing.
  // Keep these narrow: they correct ambiguous action/domain collisions without replacing the main router.
  const RULES = Object.freeze([
    Object.freeze({ moduleId: 'GP001', patterns: Object.freeze([
      /(?:ช่วย)?(?:ทำ|ร่าง|เขียน|จัดทำ)?.{0,12}หนังสือ(?:เชิญ|ขอความร่วมมือ|ขออนุเคราะห์|แจ้ง|ตอบ|ส่ง|ถึง)/,
      /หนังสือ(?:เชิญ|ขออนุเคราะห์|ขอความร่วมมือ)(?:ประชุม|ร่วมงาน|เข้าร่วม|วิทยากร)?/,
      /(?:เขียน|ร่าง|ทำ|จัดทำ).{0,15}(?:บันทึก|บันทึกข้อความ).{0,20}(?:เสนอ|เรียน|ถึง).{0,20}(?:หัวหน้าส่วน|ผู้อำนวยการ|นายก|ปลัด|ผู้บริหาร)/,
      /(?:เขียน|ร่าง|ทำ|จัดทำ).{0,12}หนังสือ.{0,15}(?:ผู้ว่า|ผู้ว่าราชการ|นายอำเภอ|ส่วนราชการ|หน่วยงาน)/
    ]) }),
    Object.freeze({ moduleId: 'GP005', patterns: Object.freeze([
      /(?:เบิก|ขอเบิก|ค่า).{0,18}(?:ตั๋วเครื่องบิน|ค่าเครื่องบิน|โดยสารเครื่องบิน|เครื่องบิน).{0,12}(?:ได้ไหม|ได้หรือไม่)?/,
      /(?:ตั๋วเครื่องบิน|ค่าเครื่องบิน|โดยสารเครื่องบิน).{0,20}(?:เบิก|ค่าเดินทาง|เดินทางไปราชการ)/,
      /(?:เบิก|จ่าย).{0,15}(?:ค่าพาหนะ|ค่าแท็กซี่|ค่ารถ|ค่าที่พัก|ค่าตั๋ว|ค่าโดยสาร)/
    ]) }),
    Object.freeze({ moduleId: 'GP007', patterns: Object.freeze([
      /(?:ตรวจ|ทดสอบ|เช็ก|เช็ค).{0,20}(?:ความหนาแน่น|ชั้นทาง|ชั้นพื้นทาง|ชั้นรองพื้นทาง|ดิน|แอสฟัลต์|คอนกรีต)/,
      /(?:ความหนาแน่น|ชั้นทาง|ชั้นพื้นทาง|ชั้นรองพื้นทาง).{0,20}(?:ผ่าน|ไม่ผ่าน|ตรวจ|ทดสอบ)/
    ]) }),
    Object.freeze({ moduleId: 'GP009', patterns: Object.freeze([
      /(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก).{0,35}(?:โครงการ|กิจกรรม|วันเด็ก|อาหาร|เบิก|จ่าย|ซื้อ|พัฒนาเด็ก)/,
      /(?:โครงการ|กิจกรรม|วันเด็ก|อาหาร|เบิก|จ่าย|ซื้อ).{0,35}(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก)/
    ]) }),
    Object.freeze({ moduleId: 'GP010', patterns: Object.freeze([
      /(?:ตรวจสอบ|สอบทาน|ตรวจติดตาม|ตรวจการ).{0,25}(?:การเบิกจ่าย|เบิกจ่าย|เบิกเงิน|พัสดุ|การเงิน|งบประมาณ|ครุภัณฑ์|ทรัพย์สิน|โครงการ)/,
      /(?:audit|ตรวจสอบภายใน).{0,30}(?:พัสดุ|การเงิน|เบิกจ่าย|เบิกเงิน|งบประมาณ|โครงการ)/i,
      /(?:การเบิกจ่าย|เบิกเงิน|พัสดุ|โครงการ).{0,20}(?:ตรวจสอบภายใน|สอบทาน|ตรวจติดตาม)/
    ]) }),
    Object.freeze({ moduleId: 'GP011', patterns: Object.freeze([
      /(?:ช่วย)?(?:ร่าง|เขียน|ทำ|จัดทำ)?.{0,12}(?:คำกล่าว|กล่าว)(?:เปิด|ปิด|ต้อนรับ|รายงาน).{0,40}/,
      /(?:กล่าวต้อนรับ|คำกล่าวต้อนรับ|กล่าวเปิด|กล่าวปิด).{0,35}(?:คณะศึกษาดูงาน|ผู้เข้าร่วม|แขก|ผู้มีเกียรติ|กิจกรรม|งาน|โครงการ|การแข่งขัน|กีฬา|วันเด็ก|ยาเสพติด)/,
      /(?:พิธีเปิด|พิธีปิด).{0,25}(?:การแข่งขัน|กีฬา|งาน|โครงการ|กิจกรรม|วันเด็ก|ยาเสพติด)/
    ]) }),
    Object.freeze({ moduleId: 'GP012', patterns: Object.freeze([
      /(?:ทำ|สร้าง|ร่าง|เขียน)?.{0,8}(?:อินโฟ|อินโฟกราฟิก).{0,35}(?:สรุป|กฎหมาย|ข่าว|โครงการ|ประชาสัมพันธ์)?/,
      /(?:สรุป|กฎหมาย|ข่าว|โครงการ).{0,25}(?:เป็น|ทำ)?\s*(?:อินโฟ|อินโฟกราฟิก)/
    ]) }),
    Object.freeze({ moduleId: 'GP013', patterns: Object.freeze([
      /(?:สภา|สภาท้องถิ่น|มติสภา|ญัตติ).{0,35}(?:อนุมัติ|เห็นชอบ|โครงการ|งบประมาณ|งบ|แผน)/,
      /(?:ญัตติ).{0,25}(?:งบประมาณ|โครงการ|แผน)/,
      /(?:งบประมาณ|โครงการ|แผน).{0,25}(?:ญัตติ|มติสภา|สภาท้องถิ่น)/
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
