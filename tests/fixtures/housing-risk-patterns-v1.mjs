/**
 * GovPrompt Housing Audit Benchmark v1
 *
 * This fixture is a risk taxonomy only. It is NOT a legal rule source and
 * must never be used to conclude that misconduct has occurred.
 */

export const HOUSING_RISK_PATTERNS_V1 = Object.freeze([
  {
    id: 'H01',
    key: 'lease_or_residence_change',
    label: 'เปลี่ยนบ้านหรือสัญญาเช่า',
    evidence: ['สัญญาเช่าฉบับเดิมและฉบับใหม่', 'หลักฐานการอยู่อาศัยจริง'],
    requiredStatus: 'UNVERIFIED',
  },
  {
    id: 'H02',
    key: 'role_conflict',
    label: 'ผู้เช่าและผู้ตรวจสอบเป็นบุคคลเดียวกัน',
    evidence: ['คำสั่งแต่งตั้งผู้ตรวจสอบ', 'ลายมือชื่อและเส้นทางอนุมัติ'],
    requiredStatus: 'UNVERIFIED',
  },
  {
    id: 'H03',
    key: 'contract_residence_mismatch',
    label: 'สัญญาเช่าไม่ตรงกับการอยู่อาศัยจริง',
    evidence: ['สัญญาเช่า', 'หลักฐานการพักอาศัย', 'ข้อมูลการตรวจสอบข้อเท็จจริง'],
    requiredStatus: 'UNVERIFIED',
  },
  {
    id: 'H04',
    key: 'fact_verification_without_inspection',
    label: 'รับรองข้อเท็จจริงโดยไม่ตรวจสอบเพียงพอ',
    evidence: ['รายงานตรวจสอบ', 'ภาพถ่ายหรือบันทึกการลงพื้นที่', 'พยานหลักฐานประกอบ'],
    requiredStatus: 'UNVERIFIED',
  },
  {
    id: 'H05',
    key: 'concealed_eligibility_facts',
    label: 'ปกปิดข้อมูลสิทธิหรือทรัพย์สินที่เกี่ยวข้อง',
    evidence: ['คำรับรองผู้เบิก', 'ข้อมูลสิทธิที่เกี่ยวข้อง', 'เอกสารทรัพย์สิน'],
    requiredStatus: 'UNVERIFIED',
  },
  {
    id: 'H06',
    key: 'receipt_or_amount_mismatch',
    label: 'ใบเสร็จไม่ตรงหรือยอดเบิกสูงกว่าจ่ายจริง',
    evidence: ['ใบเสร็จรับเงิน', 'หลักฐานการชำระเงินจริง', 'รายการเบิกจ่าย'],
    requiredStatus: 'UNVERIFIED',
  },
  {
    id: 'H07',
    key: 'duplicate_spousal_claim',
    label: 'คู่สมรสเบิกค่าเช่าบ้านซ้ำซ้อน',
    evidence: ['คำรับรองของคู่สมรส', 'รายการเบิกจ่ายของทั้งสองฝ่าย', 'หลักฐานสิทธิ'],
    requiredStatus: 'UNVERIFIED',
  },
]);

export const HOUSING_AUDIT_SAFETY_RULES_V1 = Object.freeze({
  riskIsNotProof: true,
  completeDocumentsAreNotProofOfActualResidence: true,
  legalConclusionRequiresOfficialSources: true,
  unresolvedIssuesRequireDecisionLock: true,
});
