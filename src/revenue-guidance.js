// Additive, offline-only revenue guidance. Does not alter existing routing or UI.
export const REVENUE_DOMAINS = Object.freeze([
  {id:'land-building', keywords:['ภาษีที่ดิน','สิ่งปลูกสร้าง'], evidence:['กฎหมายฉบับใช้บังคับ','ประเภทการใช้ประโยชน์','ฐานภาษี','ปีภาษี']},
  {id:'sign', keywords:['ภาษีป้าย','ประเภทป้าย'], evidence:['กฎหมายฉบับใช้บังคับ','ประเภทป้าย','ขนาดป้าย','ปีภาษี']},
  {id:'assessment-appeal', keywords:['ประเมินภาษี','คัดค้านภาษี','อุทธรณ์ภาษี'], evidence:['หนังสือแจ้งประเมิน','วันรับแจ้ง','กฎหมายฉบับใช้บังคับ']},
  {id:'arrears', keywords:['ภาษีค้าง','เร่งรัดภาษี','เบี้ยปรับภาษี','เงินเพิ่มภาษี'], evidence:['ยอดค้างที่ตรวจสอบแล้ว','ปีภาษี','ประวัติการชำระ','กฎหมายฉบับใช้บังคับ']},
  {id:'tax-map', keywords:['แผนที่ภาษี','สำรวจทรัพย์สิน'], evidence:['ข้อมูลสำรวจที่ได้รับอนุญาต','ทะเบียนทรัพย์สิน','คู่มือทางการ']},
  {id:'ltax', keywords:['LTAX','แอลแท็กซ์'], evidence:['ชื่อระบบและรุ่น','คู่มือทางการฉบับตรงรุ่น']},
  {id:'elaas', keywords:['e-LAAS','อีลาส','บันทึกรายรับ'], evidence:['คู่มือทางการฉบับปัจจุบัน','ประเภทการรับเงิน','เอกสารการรับเงิน']},
  {id:'documents', keywords:['หนังสือแจ้งภาษี','บันทึกข้อความภาษี','แบบฟอร์มภาษี'], evidence:['ประเภทเอกสาร','ข้อเท็จจริงที่ยืนยัน','แบบทางการที่ใช้บังคับ']}
]);
export function revenueGuidance(question, suppliedEvidence = {}) {
  const q = String(question ?? '').normalize('NFC').toLowerCase();
  const domain = REVENUE_DOMAINS.find(d => d.keywords.some(k => q.includes(k.toLowerCase())));
  if (!domain) return null;
  const missing = domain.evidence.filter(k => suppliedEvidence[k] !== true);
  return Object.freeze({
    domain: domain.id,
    mode: 'guidance-only',
    missingEvidence: missing,
    decisionLock: missing.length > 0,
    instructions: [
      'ตอบขั้นตอนและข้อควรตรวจสอบเท่าที่มีหลักฐาน โดยแยกข้อเท็จจริงกับข้อเสนอ',
      'ให้ AI ปลายทางเปิดตรวจต้นฉบับกฎหมาย/หนังสือสั่งการ/คู่มือทางการ รวมวันมีผลและการแก้ไขก่อนสรุป',
      'ห้ามสมมุติอัตรา สูตร กำหนดเวลา แบบฟอร์ม หรือขั้นตอนหน้าจอ',
      'ก่อนให้คำแนะนำต้องตรวจประเภท อปท. และอำนาจจัดเก็บภาษีเฉพาะประเภท โดยเฉพาะกรณี อบจ. ห้ามสันนิษฐานว่าเป็นผู้จัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง',
      'ห้ามอ้างว่าเชื่อมต่อ LTAX หรือ e-LAAS หรือทำธุรกรรมแล้ว',
      'ถามข้อมูลที่ขาดผ่านช่องหลักทีละประเด็น ห้ามขอข้อมูลส่วนบุคคลเกินจำเป็น',
      'ต้องให้เจ้าหน้าที่ตรวจสอบก่อนใช้จริง'
    ]
  });
}
