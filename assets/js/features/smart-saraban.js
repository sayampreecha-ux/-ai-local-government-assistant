/**
 * GP Smart Saraban MVP
 *
 * Additive, dependency-free workflow helpers for GP-SB001.
 * This module does not replace the existing Router, Context Manager,
 * Prompt Registry, Governance Layer, or Quality Gates.
 */

export const SMART_SARABAN_TASK = Object.freeze({
  id: 'GP-SB001',
  name: 'ร่างบันทึกข้อความราชการ',
  version: '1.1.0'
});

export const SARABAN_FIELDS = Object.freeze([
  'owningUnit',
  'subject',
  'recipient',
  'purpose',
  'facts',
  'proposal'
]);

const asText = (value) => (typeof value === 'string' ? value.trim() : '');

export function createSarabanContext(input = {}) {
  return {
    taskId: SMART_SARABAN_TASK.id,
    documentType: 'memorandum',
    owningUnit: asText(input.owningUnit),
    subject: asText(input.subject),
    recipient: asText(input.recipient),
    purpose: asText(input.purpose),
    facts: asText(input.facts),
    proposal: asText(input.proposal),
    attachments: Array.isArray(input.attachments) ? [...input.attachments] : [],
    sourceReferences: Array.isArray(input.sourceReferences) ? [...input.sourceReferences] : [],
    currentStage: 'intake'
  };
}

export function inspectSarabanInput(context) {
  const missing = SARABAN_FIELDS.filter((field) => !asText(context?.[field]));
  return {
    status: missing.length === 0 ? 'complete' : 'incomplete',
    missingFields: missing,
    canDraft: Boolean(asText(context?.subject) && asText(context?.purpose) && asText(context?.facts)),
    warnings: missing.length ? ['ข้อมูลบางรายการยังไม่ครบ ต้องตรวจสอบก่อนใช้งานจริง'] : []
  };
}

export function classifySarabanRisk(context) {
  const text = [context?.subject, context?.purpose, context?.facts, context?.proposal]
    .map(asText)
    .join(' ');
  const highRiskTerms = /(อนุมัติ|งบประมาณ|จัดซื้อ|จัดจ้าง|ลงโทษ|วินัย|กฎหมาย|เงินสะสม|สัญญา|สิทธิ|อุทธรณ์)/u;
  const authorityCheckRequired = highRiskTerms.test(text);
  return {
    level: authorityCheckRequired ? 'elevated' : 'routine',
    authorityCheckRequired,
    liveSearchRequired: authorityCheckRequired,
    reason: authorityCheckRequired
      ? 'พบคำหรือบริบทที่อาจเกี่ยวข้องกับอำนาจ กฎหมาย หรือผลกระทบทางราชการ'
      : 'ไม่พบตัวบ่งชี้ความเสี่ยงสูงจากข้อความที่ให้มา'
  };
}

export function buildSarabanPrompt(context, { evidence = [], authorityResult = null } = {}) {
  const inspection = inspectSarabanInput(context);
  const risk = classifySarabanRisk(context);
  const liveAuthorityInstruction = risk.liveSearchRequired
    ? [
        'คำสั่งค้นข้อมูลสดสำหรับ AI ฝั่งผู้ใช้: ให้ใช้ Web Search ของแพลตฟอร์มนี้ทันที',
        '- ค้นจากแหล่งปฐมภูมิและเว็บไซต์ราชการที่ตรวจสอบได้ก่อน เช่น ราชกิจจานุเบกษา กฤษฎีกา กรมบัญชีกลาง กระทรวงมหาดไทย สถ. และหน่วยงานเจ้าของเรื่อง',
        '- เปิดอ่านเอกสารต้นฉบับจริง ไม่สรุปจากผลค้นหาหรือ Snippet เพียงอย่างเดียว',
        '- ค้น Rule → Case → Later Rule → Conflict Check → Applicable Rule → Answer',
        '- ตรวจวันมีผลใช้บังคับ ฉบับแก้ไข การยกเลิก ฉบับใหม่กว่า และบทเฉพาะกาล',
        '- เทียบวันที่ของข้อเท็จจริงกับวันที่กฎมีผล ห้ามนำกฎต่างช่วงเวลามาปะปนโดยไม่อธิบาย',
        '- ค้นหลักฐานที่อาจโต้แย้งหรือหักล้างข้อสรุปด้วย ไม่เลือกเฉพาะหลักฐานที่สนับสนุน',
        '- ระบุชื่อหน่วยงานผู้ออก เลขหนังสือ/เลขที่เอกสาร วันที่ ข้อ/มาตรา และ URL ที่เปิดตรวจได้',
        '- หากค้นไม่พบหรือยืนยันฉบับที่ใช้บังคับไม่ได้ ให้ระบุว่า “ยังยืนยันหลักฐานที่ใช้บังคับกับกรณีไม่ได้ — ยังไม่ควรฟันธง”',
        '- ห้ามอ้างว่าได้ค้นสดแล้ว หากยังไม่ได้ใช้ Web Search และเปิดตรวจแหล่งข้อมูลจริง'
      ]
    : [
        'การค้นเว็บสด: พิจารณาค้นเมื่อพบประเด็นกฎหมาย อำนาจ งบประมาณ หรือข้อเท็จจริงที่เปลี่ยนแปลงได้',
        'หากจำเป็นต้องค้น ให้ใช้ Web Search ของ AI ฝั่งผู้ใช้และอ้างแหล่งต้นฉบับที่เปิดตรวจจริง'
      ];

  return [
    'บทบาท: Government AI Copilot สำหรับงานราชการไทย และผู้ช่วยร่างบันทึกข้อความราชการ',
    `ภารกิจ: ${SMART_SARABAN_TASK.id} — ${SMART_SARABAN_TASK.name}`,
    '',
    'ข้อมูลตั้งต้น:',
    `หน่วยงานเจ้าของเรื่อง: ${context?.owningUnit || '[ยังไม่ได้ระบุ]'}`,
    `เรื่อง: ${context?.subject || '[ยังไม่ได้ระบุ]'}`,
    `เรียน: ${context?.recipient || '[ยังไม่ได้ระบุ]'}`,
    `วัตถุประสงค์: ${context?.purpose || '[ยังไม่ได้ระบุ]'}`,
    `ข้อเท็จจริง: ${context?.facts || '[ยังไม่ได้ระบุ]'}`,
    `ข้อเสนอ: ${context?.proposal || '[ยังไม่ได้ระบุ]'}`,
    '',
    'กฎบังคับด้านความถูกต้อง:',
    '- ใช้เฉพาะข้อมูลที่ผู้ใช้ให้หรือหลักฐานที่เปิดตรวจได้จริง',
    '- ห้ามสมมติข้อเท็จจริง เลขที่หนังสือ วันเดือนปี ชื่อบุคคล ราคา ผู้มีอำนาจ หรือฐานอำนาจ',
    '- แยกข้อเท็จจริง ข้อกฎหมาย ข้อวิเคราะห์ ความเสี่ยง และข้อเสนอให้ชัดเจน',
    '- หากข้อมูลหรือหลักฐานไม่ครบ ให้ระบุช่องว่างและห้ามฟันธงแทนการเดา',
    '- การร่างไม่ใช่การอนุมัติ ลงนาม สั่งจ่าย หรือใช้อำนาจแทนเจ้าหน้าที่',
    '',
    ...liveAuthorityInstruction,
    '',
    `สถานะข้อมูล: ${inspection.status}`,
    `ความเสี่ยงเบื้องต้น: ${risk.level}`,
    `ต้องตรวจฐานอำนาจ: ${risk.authorityCheckRequired ? 'ใช่' : 'ตามเนื้อหาที่ตรวจพบ'}`,
    `หลักฐานที่ให้มา: ${JSON.stringify(evidence)}`,
    `ผลตรวจฐานอำนาจที่มีอยู่: ${JSON.stringify(authorityResult)}`,
    '',
    'รูปแบบผลลัพธ์ที่ต้องส่งกลับ:',
    '1. Answer First: ข้อสรุปสถานะ — ดำเนินการได้ / มีเงื่อนไข / มีความเสี่ยง / ยังฟันธงไม่ได้',
    '2. ข้อเท็จจริงที่รับทราบและข้อเท็จจริงที่ยังขาด',
    '3. ฐานอำนาจและแหล่งปฐมภูมิที่เปิดตรวจจริง',
    '4. ตารางเทียบเงื่อนไขทีละข้อ: ผ่าน / ไม่ผ่าน / ยังไม่ทราบ',
    '5. ร่างบันทึกข้อความที่ไม่สร้างข้อเท็จจริงขึ้นเอง',
    '6. ความเสี่ยงและเอกสารที่ต้องตรวจเพิ่ม',
    '7. สถานะ Applicable Authority Check, Evidence Gate และ Quality Gate',
    '8. จุดที่ต้องให้มนุษย์ตรวจสอบ อนุมัติ หรือลงนาม'
  ].join('\n');
}

export function runSarabanQualityGate(context, draft = '') {
  const text = asText(draft);
  const checks = [
    { id: 'DQ-01', name: 'ประเภทเอกสาร', status: context?.documentType === 'memorandum' ? 'pass' : 'review' },
    { id: 'DQ-02', name: 'เรื่อง', status: asText(context?.subject) ? 'pass' : 'fail' },
    { id: 'DQ-03', name: 'ข้อเท็จจริง', status: asText(context?.facts) ? 'pass' : 'fail' },
    { id: 'DQ-04', name: 'วัตถุประสงค์', status: asText(context?.purpose) ? 'pass' : 'fail' },
    { id: 'DQ-05', name: 'ร่างผลลัพธ์', status: text ? 'review' : 'fail' },
    { id: 'DQ-06', name: 'ข้อมูลที่ต้องยืนยัน', status: 'review' },
    { id: 'DQ-07', name: 'การตรวจแหล่งปฐมภูมิเมื่อมีความเสี่ยงสูง', status: classifySarabanRisk(context).authorityCheckRequired ? 'review' : 'pass' },
    { id: 'DQ-08', name: 'Human Review', status: 'review' }
  ];
  const hasFail = checks.some((check) => check.status === 'fail');
  return {
    status: hasFail ? 'red' : 'yellow',
    checks,
    humanReviewRequired: true,
    decisionLock: classifySarabanRisk(context).authorityCheckRequired,
    note: 'ผลตรวจนี้เป็นตัวช่วยคัดกรอง ไม่ใช่การรับรองความถูกต้องทางกฎหมายหรือการอนุมัติ'
  };
}

export const smartSaraban = Object.freeze({
  task: SMART_SARABAN_TASK,
  createSarabanContext,
  inspectSarabanInput,
  classifySarabanRisk,
  buildSarabanPrompt,
  runSarabanQualityGate
});
