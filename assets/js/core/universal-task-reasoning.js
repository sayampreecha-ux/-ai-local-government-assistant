(() => {
  'use strict';

  const core = window.GovPromptCore = window.GovPromptCore || {};

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  const ACTIONS = Object.freeze([
    ['draft', /(?:ร่าง|เขียน|จัดทำ|ทำ)(?:หนังสือ|บันทึก|โครงการ|tor|คำกล่าว|ข่าว|โพสต์|แผน|รายงาน|คำสั่ง|ประกาศ|mou)/i],
    ['create', /(?:ทำ|สร้าง|ออกแบบ|จัดทำ)(?:ปก|โปสเตอร์|อินโฟ|อินโฟกราฟิก|ภาพ|สื่อ|ตาราง|checklist|เช็กลิสต์|แบบฟอร์ม)/i],
    ['analyze', /(?:วิเคราะห์|พิจารณา|หารือ|ตีความ|มีอำนาจ|ได้ไหม|ได้หรือไม่|ชอบด้วย|ผิดกฎหมาย|ถูกกฎหมาย)/i],
    ['verify', /(?:ตรวจ|เช็ก|เช็ค|ตรวจสอบ|ทบทวน|ประเมินความเสี่ยง)/i],
    ['summarize', /(?:สรุป|ย่อ|สรุปผู้บริหาร|executive summary)/i],
    ['plan', /(?:วางแผน|แผนงาน|ขั้นตอน|workflow|roadmap|แนวทางดำเนินการ)/i],
    ['calculate', /(?:คำนวณ|รวมยอด|หายอด|คิดเป็น|ร้อยละ|เปอร์เซ็นต์)/i]
  ]);

  const DELIVERABLES = Object.freeze([
    ['official-document', /(?:หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|หนังสือภายใน|คำสั่ง|ประกาศ|mou)/i],
    ['project', /(?:โครงการ|หลักการและเหตุผล|วัตถุประสงค์|ตัวชี้วัด)/i],
    ['procurement', /(?:tor|ขอบเขตของงาน|จัดซื้อ|จัดจ้าง|ราคากลาง|สัญญา)/i],
    ['finance', /(?:เบิก|เบิกจ่าย|ฎีกา|ค่าใช้จ่าย|เงินสะสม|เงินสำรองจ่าย|งบประมาณ)/i],
    ['legal-analysis', /(?:กฎหมาย|ระเบียบ|ข้อหารือ|หนังสือเวียน|หนังสือสั่งการ|อำนาจ|คำพิพากษา)/i],
    ['public-content', /(?:โปสเตอร์|โพสต์|ประชาสัมพันธ์|ข่าวประชาสัมพันธ์|อินโฟ|อินโฟกราฟิก|การ์ด|แคปชัน|ปก)/i],
    ['speech', /(?:คำกล่าว|กล่าวเปิด|กล่าวปิด|สุนทรพจน์|โอวาท)/i],
    ['table', /(?:ตาราง|csv|json|รายการ|เปรียบเทียบ)/i],
    ['general-answer', /.+/]
  ]);

  const DISCIPLINES = Object.freeze([
    ['records', /(?:หนังสือราชการ|บันทึกข้อความ|สารบรรณ|รับส่งหนังสือ)/i],
    ['legal', /(?:กฎหมาย|ระเบียบ|อำนาจ|ข้อหารือ|คำพิพากษา|หนังสือเวียน|หนังสือสั่งการ)/i],
    ['procurement', /(?:พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|สัญญา|ผู้รับจ้าง)/i],
    ['planning-budget', /(?:โครงการ|แผน|งบประมาณ|เงินสะสม|เงินสำรองจ่าย)/i],
    ['finance', /(?:เบิก|เบิกจ่าย|ฎีกา|ค่าเดินทาง|ค่าใช้จ่าย|ใบเสร็จ)/i],
    ['human-resources', /(?:บุคคล|บุคลากร|ข้าราชการ|พนักงาน|ตำแหน่ง|วินัย|ลาป่วย|สอบ)/i],
    ['engineering', /(?:ถนน|สะพาน|ก่อสร้าง|ช่าง|แบบ|ประมาณราคา|หน้างาน)/i],
    ['public-health', /(?:สาธารณสุข|รพ\.สต|สุขภาพ|อสม|ยา|เวชภัณฑ์|โรค)/i],
    ['education', /(?:การศึกษา|โรงเรียน|เด็ก|เยาวชน|นักเรียน|กีฬา|วิทยาศาสตร์|สามเณร|บรรพชา|คุณธรรม)/i],
    ['audit', /(?:ตรวจสอบภายใน|สตง|ป\.ป\.ช|ความเสี่ยง|ควบคุมภายใน)/i],
    ['executive', /(?:ผู้บริหาร|สรุปผู้บริหาร|briefing|คำกล่าว)/i],
    ['public-relations', /(?:ประชาสัมพันธ์|โปสเตอร์|โพสต์|ข่าว|อินโฟ|การ์ด|ปก|แคปชัน)/i],
    ['council', /(?:สภาท้องถิ่น|สภา อบจ|สภาเทศบาล|ประชุมสภา|ญัตติ|ข้อบัญญัติ)/i]
  ]);

  const FRESHNESS = /(?:ล่าสุด|ปัจจุบัน|ยังใช้|ยังมีผล|ฉบับใหม่|อัตรา|สิทธิ|ระเบียบ|กฎหมาย|หนังสือเวียน|หนังสือสั่งการ|ข้อหารือ|ราคากลาง|จัดซื้อ|จัดจ้าง|เบิก|งบประมาณ|คำพิพากษา)/i;
  const EXPLICIT_GENERATION = /(?:ช่วย)?(?:ทำ|ร่าง|เขียน|จัดทำ|สร้าง|ออกแบบ|สรุป|ตรวจ|วิเคราะห์|วางแผน)/i;

  function firstMatch(source, entries, fallback) {
    for (const [id, pattern] of entries) if (pattern.test(source)) return id;
    return fallback;
  }

  function allMatches(source, entries) {
    return Object.freeze(entries.filter(([, pattern]) => pattern.test(source)).map(([id]) => id));
  }

  function planUniversalTask(question, context = {}) {
    const source = normalize([question, context?.facts, context?.desiredOutput].filter(Boolean).join(' '));
    if (!source) throw new TypeError('question must be a non-empty string');

    const action = firstMatch(source, ACTIONS, 'answer');
    const deliverable = firstMatch(source, DELIVERABLES, 'general-answer');
    const disciplines = allMatches(source, DISCIPLINES);
    const evidenceMode = FRESHNESS.test(source) ? 'verify-current-primary-source' : 'reason-from-provided-context-first';
    const shouldProduceNow = EXPLICIT_GENERATION.test(source) || action !== 'answer';

    return Object.freeze({
      version: '7.1',
      action,
      deliverable,
      disciplines,
      evidenceMode,
      shouldProduceNow,
      routeIsAdvisory: true,
      missingInfoPolicy: 'produce-usable-draft-first-then-ask-only-decisive-gaps',
      selfCheck: Object.freeze([
        'ตอบตรงสิ่งที่ผู้ใช้ขอ ไม่ยึดติดชื่อหมวด',
        'ไม่แต่งข้อเท็จจริง เลขหนังสือ มาตรา วันที่ หรือแหล่งอ้างอิง',
        'งานที่ขึ้นกับกฎ/อัตรา/สถานะปัจจุบันต้องยืนยันแหล่งปฐมภูมิและความใหม่',
        'ตรวจ PDPA ข้อมูลอ่อนไหว และข้อมูลลับ',
        'งานสั่งการ/อนุมัติ/ลงนาม/จ่ายเงินจริงต้องคง Human Approval',
        'ส่งมอบชิ้นงานพร้อมใช้ก่อนคำอธิบาย เมื่อผู้ใช้ขอให้ทำหรือร่าง'
      ])
    });
  }

  core.planUniversalTask = planUniversalTask;
  core.UNIVERSAL_TASK_REASONING_VERSION = '7.1';
})();
