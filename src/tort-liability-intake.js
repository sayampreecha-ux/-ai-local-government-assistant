// Conservative and standalone. Integration into GP runtime requires release approval.
// No personal data and no authoritative percentage or legal conclusion.
export const TORT_CASE_TYPES = Object.freeze(['vehicle','finance','procurement','property','medical','procedural','other']);
const patterns = [
 ['vehicle',/รถ(ราชการ|ยนต์|ชน|คว่ำ)|อุบัติเหตุ|คู่กรณี/u],
 ['finance',/เงิน(หาย|ขาด|สูญ|ราชการ|สด)|เบิกจ่าย|ใบเสร็จ|รับเงิน/u],
 ['procurement',/จัดซื้อ|จัดจ้าง|พัสดุ|ตรวจรับ|ราคากลาง/u],
 ['property',/ทรัพย์สิน|โจรกรรม|ไฟไหม้|เพลิงไหม้|สูญหาย/u],
 ['medical',/รักษาพยาบาล|แพทย์|คนไข้|ผู้ป่วย/u],
 ['procedural',/สอบละเมิด|แต่งตั้งกรรมการ|อายุความ|คำสั่งเรียกชดใช้/u]
];
const requirements = {
 vehicle:['คำขอ/อนุญาตใช้รถ','คำสั่งหรือหน้าที่ผู้ขับ','บันทึกเหตุและพยาน','หลักฐานประเมินความเสียหาย','กรมธรรม์ประกันภัย'],
 finance:['เอกสารรับ/จ่ายเงิน','ทะเบียนบัญชี','หลักฐานการรักษาเงิน','คำสั่งมอบหมายหน้าที่'],
 procurement:['สัญญา/ใบสั่ง','TOR/แบบรูปรายการ','หลักฐานตรวจรับ','หลักฐานราคาและความเสียหาย'],
 property:['ทะเบียนทรัพย์สิน','รายงานเหตุ','หลักฐานสภาพการเก็บรักษา','หลักฐานประเมินความเสียหาย'],
 medical:['เวชระเบียนที่ได้รับอนุญาต','รายงานเหตุ','ความเห็นผู้เชี่ยวชาญ'],
 procedural:['คำสั่งแต่งตั้ง','อำนาจและระเบียบฉบับปัจจุบัน','พยานหลักฐาน','วันที่เกี่ยวกับอายุความ'],
 other:['รายงานเหตุ','ข้อเท็จจริงและพยานหลักฐาน','คำสั่งมอบหมายหน้าที่']
};
export function draftTortIntake(input) {
 const normalized=typeof input==='string'?input.trim():'';
 const category=patterns.find(([,rx])=>rx.test(normalized))?.[0]??'other';
 return Object.freeze({
  category,
  evidenceChecklist:[...requirements[category]],
  legalVersion:'NOT_VERIFIED',
  decision:'HUMAN_REVIEW_REQUIRED',
  allocationPercent:null,
  compensationOrder:null,
  note:'เอกสารเตรียมประเด็นเท่านั้น ห้ามวินิจฉัยความผิด กำหนดสัดส่วน หรือออกคำสั่งโดยอัตโนมัติ'
 });
}
