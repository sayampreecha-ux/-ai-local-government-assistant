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
    Object.freeze({ moduleId: 'GP002', patterns: Object.freeze([
      /(?:อบจ\.?|อบต\.?|เทศบาล|อปท\.?|องค์กรปกครองส่วนท้องถิ่น).{0,20}(?:มีอำนาจ|อำนาจหน้าที่).{0,25}(?:ทำ|ดำเนิน|จัดทำ)?.{0,12}โครงการ/,
      /(?:อบจ\.?|อบต\.?|เทศบาล|อปท\.?|องค์กรปกครองส่วนท้องถิ่น).{0,25}สนับสนุนงบประมาณ.{0,25}(?:หน่วยงาน|ส่วนราชการ|องค์กร).{0,15}(?:ได้ไหม|ได้หรือไม่)?/,
      /(?:นายก|ผู้บริหาร).{0,20}มอบอำนาจ.{0,20}(?:ปลัด|รองปลัด|ผู้อำนวยการ).{0,20}(?:ลงนาม|อนุมัติ|สั่งการ)?/,
      /มติ(?:ของ)?คณะกรรมการ.{0,25}(?:มีผล|ผูกพัน|มีผลผูกพัน)/,
      /คำสั่งทางปกครอง.{0,30}(?:ผิดขั้นตอน|ไม่ชอบ|เพิกถอน|ยกเลิก|แก้ไข)/,
      /(?:ยกเลิก|เพิกถอน).{0,15}คำสั่งเดิม.{0,25}(?:ออก|ทำ).{0,10}คำสั่งใหม่/
    ]) }),
    Object.freeze({ moduleId: 'GP003', patterns: Object.freeze([
      /(?:แก้ไข|เปลี่ยนแปลง).{0,15}สัญญา.{0,20}(?:หลังลงนาม|ลงนามแล้ว|ภายหลังลงนาม)/
    ]) }),
    Object.freeze({ moduleId: 'GP004', patterns: Object.freeze([
      /(?:ช่วย)?(?:เขียน|ร่าง|จัดทำ|ทำ).{0,10}โครงการ.{0,35}(?:ส่งเสริม|พัฒนา|อบรม|สุขภาพ|ผู้สูงอายุ|ประชาชน|อาชีพ|รายได้)/,
      /ตั้งงบ.{0,25}(?:ซื้อ|จัดซื้อ|จัดหา).{0,15}(?:รถ|ครุภัณฑ์|อุปกรณ์).{0,15}(?:ปีหน้า|ปีงบประมาณ|งบปี)/,
      /เงินสำรองจ่าย.{0,35}(?:น้ำท่วม|ภัยพิบัติ|ฉุกเฉิน|ซ่อม|ถนน)/,
      /(?:ขอใช้|ใช้).{0,8}เงินสะสม.{0,35}(?:ซ่อม|ถนน|ก่อสร้าง|โครงการ|ครุภัณฑ์)/
    ]) }),
    Object.freeze({ moduleId: 'GP005', patterns: Object.freeze([
      /(?:เบิก|ขอเบิก|ค่า).{0,18}(?:ตั๋วเครื่องบิน|ค่าเครื่องบิน|โดยสารเครื่องบิน|เครื่องบิน).{0,12}(?:ได้ไหม|ได้หรือไม่)?/,
      /(?:ตั๋วเครื่องบิน|ค่าเครื่องบิน|โดยสารเครื่องบิน).{0,20}(?:เบิก|ค่าเดินทาง|เดินทางไปราชการ)/,
      /(?:เบิก|จ่าย).{0,15}(?:ค่าพาหนะ|ค่าแท็กซี่|ค่ารถ|ค่าที่พัก|ค่าตั๋ว|ค่าโดยสาร)/,
      /(?:เหมารถ|รถเหมา).{0,25}(?:เบิก|ค่าเดินทาง|ไปราชการ|ได้ไหม|ได้หรือไม่)/,
      /(?:ใบเสร็จ|ใบสำคัญรับเงิน).{0,12}(?:หาย|สูญหาย).{0,25}(?:เบิก|เบิกจ่าย|ค่าใช้จ่าย)/
    ]) }),
    Object.freeze({ moduleId: 'GP006', patterns: Object.freeze([
      /(?:ผู้บริหาร|นายก|ปลัด).{0,15}สั่งงาน.{0,25}(?:นอกเหนือหน้าที่|นอกหน้าที่|ไม่ใช่หน้าที่).{0,25}(?:ข้าราชการ|พนักงาน|เจ้าหน้าที่).{0,20}(?:ปฏิเสธ|ไม่ทำ|ได้ไหม|ได้หรือไม่)?/
    ]) }),
    Object.freeze({ moduleId: 'GP007', patterns: Object.freeze([
      /(?:ตรวจ|ทดสอบ|เช็ก|เช็ค).{0,20}(?:ความหนาแน่น|ชั้นทาง|ชั้นพื้นทาง|ชั้นรองพื้นทาง|ดิน|แอสฟัลต์|คอนกรีต)/,
      /(?:ความหนาแน่น|ชั้นทาง|ชั้นพื้นทาง|ชั้นรองพื้นทาง).{0,20}(?:ผ่าน|ไม่ผ่าน|ตรวจ|ทดสอบ)/,
      /(?:สะพาน|ถนน|ท่อ|คอสะพาน).{0,20}(?:ชำรุด|เสียหาย|ขาด).{0,20}(?:ฉุกเฉิน|เร่งด่วน).{0,30}(?:ซ่อม|แก้ไข)/,
      /(?:ผู้รับจ้าง).{0,20}(?:ขอ)?เปลี่ยนวัสดุ.{0,25}(?:แบบ|แบบก่อสร้าง|รายการ|สเปก|ข้อกำหนด)/
    ]) }),
    Object.freeze({ moduleId: 'GP008', patterns: Object.freeze([
      /(?:ซื้อ|จัดซื้อ|จัดหา).{0,15}(?:ยา|เวชภัณฑ์|วัคซีน|เวชภัณฑ์มิใช่ยา).{0,25}(?:รพ\.?สต\.?|สาธารณสุข|สุขภาพ|ดำเนินการ)?/,
      /(?:ค่าใช้จ่าย|เบิก|จ่าย).{0,20}(?:กิจกรรม|โครงการ).{0,12}อสม\.?/,
      /อสม\.? .{0,20}(?:ค่าใช้จ่าย|เบิก|จ่าย|เงินอะไร)/
    ]) }),
    Object.freeze({ moduleId: 'GP009', patterns: Object.freeze([
      /(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก).{0,35}(?:โครงการ|กิจกรรม|วันเด็ก|อาหาร|เบิก|จ่าย|ซื้อ|พัฒนาเด็ก)/,
      /(?:โครงการ|กิจกรรม|วันเด็ก|อาหาร|เบิก|จ่าย|ซื้อ).{0,35}(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก)/,
      /(?:โรงเรียน|สถานศึกษา).{0,30}(?:ซื้อ|จัดซื้อ|จัดหา).{0,18}(?:อาหารกลางวัน|อาหารนักเรียน|อุปกรณ์กีฬา|สื่อการเรียน|วัสดุการศึกษา)/,
      /(?:ซื้อ|จัดซื้อ|จัดหา).{0,18}(?:อาหารกลางวัน|อุปกรณ์กีฬา|สื่อการเรียน|วัสดุการศึกษา).{0,25}(?:โรงเรียน|สถานศึกษา|นักเรียน)/
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

  const EXPLICIT_PLANNING = /โครงการ|แผนพัฒนา|แผนงาน|งบประมาณ|โอนงบ|เงินสำรอง|เงินสะสม|ข้อบัญญัติงบประมาณ|ตัวชี้วัด|\bkpi\b|งบรายจ่าย|งบลงทุน|งบกลาง|งบดำเนินงาน/i;

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

  function nextEvidenceModule(result) {
    return (result?.ranking || []).find(item => item.moduleId !== 'GP004' && item.rawScore > 0)?.moduleId || 'GP002';
  }

  function buildCorrectedResult(result, moduleId, reason) {
    if (!moduleId || moduleId === result.moduleId) return result;
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    const modules = Object.freeze([...new Set([moduleId, ...(result.modules || []).filter(id => id !== moduleId)])].slice(0, 3));
    return Object.freeze({
      ...result,
      moduleId,
      transactionType: moduleType[moduleId] || 'general',
      assistant,
      modules,
      confidence: 0.97,
      fallback: false,
      ambiguous: false,
      reason
    });
  }

  core.routeTransaction = function routeTransactionWithRegressionGuardrails(sharedContext, options = {}) {
    const result = originalRouteTransaction(sharedContext, options);
    const source = getSource(result.context || sharedContext);
    const forced = forcedModule(source);
    if (forced) return buildCorrectedResult(result, forced, 'regression-guardrail');

    // The legacy GP004 low-signal token “งบ” can appear inside unrelated Thai words such as “เครื่องบิน”.
    // Reject GP004 unless the request contains an explicit planning/budget concept.
    if (result.moduleId === 'GP004' && !EXPLICIT_PLANNING.test(source)) {
      return buildCorrectedResult(result, nextEvidenceModule(result), 'spurious-planning-token-rejected');
    }
    return result;
  };

  core.ROUTER_REGRESSION_RULES = RULES;
  core.ROUTER_EXPLICIT_PLANNING_PATTERN = EXPLICIT_PLANNING;
})();
