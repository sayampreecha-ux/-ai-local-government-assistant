(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = typeof core.routeTransaction === 'function' ? core.routeTransaction : null;
  const MODULE_TYPE = Object.freeze({
    GP001: 'records', GP002: 'legal', GP003: 'procurement', GP004: 'planning-budget',
    GP005: 'finance', GP006: 'human-resources', GP007: 'engineering', GP008: 'public-health',
    GP009: 'education', GP010: 'internal-audit', GP011: 'executive', GP012: 'public-relations', GP013: 'council'
  });

  // Post-hybrid guardrails: narrow rules for common cross-domain collisions seen in real OBT/municipality work.
  // Specific domain nouns intentionally outrank generic verbs such as ซื้อ/เบิก/โครงการ when the user's real task belongs elsewhere.
  const RULES = Object.freeze([
    Object.freeze({ moduleId: 'GP002', patterns: Object.freeze([
      /(?:อบจ\.?|อบต\.?|เทศบาล|อปท\.?).{0,18}มีอำนาจ.{0,25}(?:ทำ|ดำเนิน|จัด|สนับสนุน|โครงการ)/,
      /(?:สนับสนุนงบประมาณ|สนับสนุนเงิน).{0,30}(?:หน่วยงานอื่น|ส่วนราชการ|องค์กรอื่น)/,
      /(?:นายก|ผู้บริหาร).{0,18}มอบอำนาจ.{0,22}(?:ปลัด|รอง|ผู้อำนวยการ|ลงนาม)/,
      /มติคณะกรรมการ.{0,30}(?:ผลผูกพัน|ผูกพัน|มีผล)/,
      /คำสั่งทางปกครอง.{0,30}(?:ผิดขั้นตอน|ไม่ชอบ|ชอบด้วย|ยกเลิก|เพิกถอน)/,
      /(?:ยกเลิก|เพิกถอน).{0,18}คำสั่งเดิม.{0,25}(?:ออกคำสั่งใหม่|คำสั่งใหม่)/
    ]) }),
    Object.freeze({ moduleId: 'GP003', patterns: Object.freeze([
      /(?:แก้ไข|เปลี่ยนแปลง).{0,18}สัญญา.{0,25}(?:หลังลงนาม|ลงนามแล้ว|ได้ไหม|ได้หรือไม่)/
    ]) }),
    Object.freeze({ moduleId: 'GP004', patterns: Object.freeze([
      /(?:ช่วย)?(?:เขียน|จัดทำ|ทำ).{0,12}โครงการ.{0,35}(?:ส่งเสริมสุขภาพ|ผู้สูงอายุ|ประชาชน)/,
      /(?:ตั้งงบ|ตั้งงบประมาณ).{0,25}(?:ซื้อรถ|รถยนต์|ครุภัณฑ์).{0,20}(?:ปีหน้า|ปีงบประมาณ|ได้ไหม|ได้หรือไม่)?/,
      /เงินสำรองจ่าย.{0,35}(?:ซ่อมถนน|น้ำท่วม|ภัยพิบัติ|ฉุกเฉิน)/,
      /(?:ใช้|ขอใช้)เงินสะสม.{0,35}(?:ซ่อมถนน|ถนนชำรุด|โครงการ|ก่อสร้าง)/
    ]) }),
    Object.freeze({ moduleId: 'GP005', patterns: Object.freeze([
      /(?:พะเยา|เชียงราย|เชียงใหม่|กรุงเทพ|สนามบิน|โรงแรม).{0,35}(?:เหมารถ|รถเหมา).{0,22}(?:เบิก|ได้ไหม|ได้หรือไม่)/,
      /(?:เหมารถ|รถเหมา).{0,35}(?:เบิก|ค่าเดินทาง|ไปราชการ)/,
      /ใบเสร็จหาย.{0,30}(?:เบิก|เบิกค่าใช้จ่าย|เบิกได้|ได้หรือไม่)/
    ]) }),
    Object.freeze({ moduleId: 'GP006', patterns: Object.freeze([
      /ผู้บริหาร.{0,25}สั่งงาน.{0,30}(?:นอกเหนือหน้าที่|นอกหน้าที่).{0,22}(?:ข้าราชการ|พนักงาน|ปฏิเสธ|ได้ไหม|ได้หรือไม่)?/
    ]) }),
    Object.freeze({ moduleId: 'GP007', patterns: Object.freeze([
      /สะพาน.{0,18}(?:ชำรุด|เสียหาย|ฉุกเฉิน).{0,35}(?:ซ่อมก่อน|จัดซื้อจัดจ้าง|ดำเนินการ)/,
      /ผู้รับจ้าง.{0,25}(?:เปลี่ยนวัสดุ|ขอเปลี่ยนวัสดุ).{0,25}(?:แบบ|กำหนด|สัญญา)/
    ]) }),
    Object.freeze({ moduleId: 'GP008', patterns: Object.freeze([
      /(?:ซื้อ|จัดหา).{0,18}(?:ยา|เวชภัณฑ์).{0,25}(?:ต้องดำเนินการ|อย่างไร|ยังไง)/,
      /(?:ค่าใช้จ่าย|เบิก).{0,25}(?:กิจกรรม\s*อสม\.?|อสม\.?).{0,30}(?:เงินอะไร|จากเงิน|ได้ไหม|ได้หรือไม่)/,
      /(?:กิจกรรม\s*อสม\.?|อสม\.?).{0,25}(?:ค่าใช้จ่าย|เบิก|เงินอะไร|จากเงิน)/
    ]) }),
    Object.freeze({ moduleId: 'GP009', patterns: Object.freeze([
      /โรงเรียน.{0,30}(?:ซื้อ|จัดซื้อ).{0,20}อาหารกลางวัน/,
      /(?:ซื้อ|จัดซื้อ).{0,25}(?:อุปกรณ์กีฬา|วัสดุกีฬา).{0,25}(?:โรงเรียน|นักเรียน|การศึกษา)/
    ]) })
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function matchModule(source) {
    for (const rule of RULES) {
      if (rule.patterns.some(pattern => pattern.test(source))) return rule.moduleId;
    }
    return '';
  }

  function correct(base, moduleId) {
    if (!moduleId || !base || moduleId === base.primaryModule) return base;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const modules = Object.freeze([...new Set([moduleId, ...(base.modules || []).filter(id => id !== moduleId)])].slice(0, 3));
    return Object.freeze({
      ...base,
      primaryModule: moduleId,
      moduleId,
      transactionType: MODULE_TYPE[moduleId] || base.transactionType || 'general',
      assistant: assistant || base.assistant,
      modules,
      confidence: 0.995,
      fallback: false,
      ambiguous: false,
      reason: 'post-hybrid:real-world-cross-domain-guardrail'
    });
  }

  core.routeRequest = function routeRequestWithRealWorldGuardrails(request, options = {}) {
    const base = baseRouteRequest(request, options);
    return correct(base, matchModule(normalize(request)));
  };

  if (baseRouteTransaction) {
    core.routeTransaction = function routeTransactionWithRealWorldGuardrails(sharedContext, options = {}) {
      const base = baseRouteTransaction(sharedContext, options);
      const context = base?.context || sharedContext || {};
      const source = normalize([
        context.transactionType, context.domain, context.currentStage, context.facts,
        context.documents, context.desiredOutput,
        ...(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      ].filter(Boolean).join(' '));
      return correct(base, matchModule(source));
    };
  }

  core.HYBRID_REAL_WORLD_GUARDRAILS = RULES;
})();
