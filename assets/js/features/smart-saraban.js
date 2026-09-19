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
  version: '1.0.0'
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
  return {
    level: highRiskTerms.test(text) ? 'elevated' : 'routine',
    authorityCheckRequired: highRiskTerms.test(text),
    reason: highRiskTerms.test(text)
      ? 'พบคำหรือบริบทที่อาจเกี่ยวข้องกับอำนาจ กฎหมาย หรือผลกระทบทางราชการ'
      : 'ไม่พบตัวบ่งชี้ความเสี่ยงสูงจากข้อความที่ให้มา'
  };
}

export function buildSarabanPrompt(context, { evidence = [], authorityResult = null } = {}) {
  const inspection = inspectSarabanInput(context);
  const risk = classifySarabanRisk(context);
  return [
    'บทบาท: ผู้ช่วยร่างบันทึกข้อความราชการไทย',
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
    'กฎบังคับ:',
    '- ใช้เฉพาะข้อมูลที่ผู้ใช้ให้หรือหลักฐานที่ระบุไว้',
    '- ห้ามสมมติข้อเท็จจริง เลขที่หนังสือ วันเดือนปี ชื่อบุคคล หรือฐานอำนาจ',
    '- แยกข้อเท็จจริง ข้อพิจารณา และข้อเสนอให้ชัดเจน',
    '- หากข้อมูลไม่ครบ ให้แสดงรายการที่ต้องเติมแทนการเดา',
    '- การร่างไม่ใช่การอนุมัติหรือลงนามแทนผู้มีอำนาจ',
    '',
    `สถานะข้อมูล: ${inspection.status}`,
    `ความเสี่ยงเบื้องต้น: ${risk.level}`,
    `ต้องตรวจฐานอำนาจ: ${risk.authorityCheckRequired ? 'ใช่' : 'ตามเนื้อหาที่ตรวจพบ'}`,
    `หลักฐานที่ให้มา: ${JSON.stringify(evidence)}`,
    `ผลตรวจฐานอำนาจ: ${JSON.stringify(authorityResult)}`,
    '',
    'ผลลัพธ์ที่ต้องส่งกลับ:',
    '1. สรุปข้อมูลตั้งต้น',
    '2. ร่างบันทึกข้อความ',
    '3. ข้อมูลที่ยังขาด',
    '4. จุดที่ต้องให้เจ้าหน้าที่ตรวจยืนยัน',
    '5. สถานะ Quality Gate และเหตุผล'
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
    { id: 'DQ-06', name: 'ข้อมูลที่ต้องยืนยัน', status: 'review' }
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
