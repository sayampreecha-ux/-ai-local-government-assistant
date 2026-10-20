// Additive, offline-only revenue guidance. Does not alter existing routing or UI.
export const REVENUE_DOMAINS = Object.freeze([
  {id:'land-building', keywords:['ภาษีที่ดิน','สิ่งปลูกสร้าง'], evidence:['กฎหมายฉบับใช้บังคับ','ประเภทการใช้ประโยชน์','ฐานภาษี','ปีภาษี']},
  {id:'sign', keywords:['ภาษีป้าย','ประเภทป้าย'], evidence:['กฎหมายฉบับใช้บังคับ','ประเภทป้าย','ขนาดป้าย','ปีภาษี']},
  {id:'assessment-appeal', keywords:['ประเมินภาษี','คัดค้านภาษี','อุทธรณ์ภาษี'], evidence:['หนังสือแจ้งประเมิน','วันรับแจ้ง','กฎหมายฉบับใช้บังคับ']},
  {id:'arrears', keywords:['ภาษีค้าง','เร่งรัดภาษี','เบี้ยปรับภาษี','เงินเพิ่มภาษี'], evidence:['ยอดค้างที่ตรวจสอบแล้ว','ปีภาษี','ประวัติการชำระ','กฎหมายฉบับใช้บังคับ']},
  {id:'tax-map', keywords:['แผนที่ภาษี','สำรวจทรัพย์สิน'], evidence:['ข้อมูลสำรวจที่ได้รับอนุญาต','ทะเบียนทรัพย์สิน','คู่มือทางการ']},
  {id:'ltax', keywords:['LTAX','แอลแท็กซ์'], evidence:['ชื่อระบบและรุ่น','คู่มือทางการฉบับตรงรุ่น']},
  {id:'elaas', keywords:['e-LAAS','อีลาส','บันทึกรายรับ'], evidence:['คู่มือทางการฉบับปัจจุบัน','ประเภทการรับเงิน','เอกสารการรับเงิน']},
  {id:'documents', keywords:['หนังสือแจ้งภาษี','บันทึกข้อความภาษี','แบบฟอร์มภาษี'], evidence:['ประเภทเอกสาร','ข้อเท็จจริงที่ยืนยัน','แบบทางการที่ใช้บังคับ']},
  {id:'hotel', keywords:['ภาษีผู้เข้าพัก','ภาษีโรงแรม','ภาษีจากผู้เข้าพัก'], match: q => /ค่าธรรมเนียม.{0,25}โรงแรม/.test(q) || /(?:จัดเก็บ|ภาษี|รายได้).{0,30}ผู้เข้าพักโรงแรม/.test(q), evidence:['ประเภท อปท. และอำนาจจัดเก็บ','กฎหมายและข้อบัญญัติฉบับใช้บังคับ','ผู้มีหน้าที่ชำระและข้อยกเว้น','ฐานคำนวณ อัตรา และช่วงเวลาที่ใช้','หลักฐานการยื่น ชำระ และแจ้ง'], instructions:['ตรวจชื่อและลักษณะรายได้ตามต้นฉบับ แยกภาษีกับค่าธรรมเนียม ผู้เข้าพักกับผู้ประกอบการ ตรวจข้อยกเว้น การยื่น ชำระ แจ้ง อุทธรณ์ และค้างชำระตามที่เกี่ยวข้อง ห้ามถือว่าทุก อปท. มีอำนาจเหมือน อบจ.']},
  {id:'fuel-tobacco', keywords:[], match: q => /น้ำมัน|ก๊าซ|ก๊าส|ยาสูบ/.test(q) && /ภาษี(?:จาก)?(?:น้ำมัน|ก๊าซ|ก๊าส|ยาสูบ)|รายได้|ข้อบัญญัติ|จัดเก็บ/.test(q), evidence:['ประเภท อปท. และอำนาจจัดเก็บ','กฎหมายและข้อบัญญัติฉบับใช้บังคับ','ชนิดสินค้าและลักษณะรายได้','ผู้มีหน้าที่ชำระ ฐานคำนวณ และข้อยกเว้น','อัตราและช่วงเวลาที่ใช้','หลักฐานการยื่น ชำระ และแจ้ง'], instructions:['แยกน้ำมัน ก๊าซ และยาสูบทีละประเภท ตรวจว่าเป็นรายได้จัดเก็บเองหรือจัดสรร ผู้มีหน้าที่ชำระ ฐาน อัตรา ข้อบัญญัติ ข้อยกเว้น การยื่น ชำระ แจ้ง อุทธรณ์ และค้างชำระตามต้นฉบับ ห้ามสันนิษฐานว่าเก็บได้ทุกชนิดหรือทุก อปท.']}
]);
export function revenueGuidance(question, suppliedEvidence = {}) {
  const q = String(question ?? '').normalize('NFC').toLowerCase();
  const matches = REVENUE_DOMAINS.filter(d => d.keywords.some(k => q.includes(k.toLowerCase())) || d.match?.(q));
  if (!matches.length) return null;
  // A named system or a clearly requested output takes precedence over incidental
  // references to assessment. Preserve the matching evidence of every domain.
  const explicitAppeal = /อุทธรณ์ภาษี|คัดค้านภาษี/.test(q);
  const priority = explicitAppeal
    ? ['assessment-appeal', 'ltax', 'elaas', 'documents', 'tax-map', 'arrears', 'sign', 'land-building', 'hotel', 'fuel-tobacco']
    : ['ltax', 'elaas', 'documents', 'tax-map', 'arrears', 'sign', 'land-building', 'hotel', 'fuel-tobacco', 'assessment-appeal'];
  const domain = [...matches].sort((a,b) =>
    priority.indexOf(a.id) - priority.indexOf(b.id))[0];
  const missing = [...new Set(matches.flatMap(d => d.evidence))]
    .filter(k => suppliedEvidence[k] !== true);
  return Object.freeze({
    domain: domain.id,
    relatedDomains: Object.freeze(matches.map(d => d.id)),
    mode: 'guidance-only',
    missingEvidence: missing,
    decisionLock: missing.length > 0,
    instructions: [
      'งานจัดเก็บรายได้ที่มีผลต่อภาษี หนี้ หรือฐานประเมิน ต้องตรวจหลักฐานและกฎฉบับใช้บังคับ แม้คำสั่งทั่วไปจัดความเสี่ยง LOW หรือเลือก ai-only; ห้ามใช้ค่า LOW/ปิด Evidence Gate เดิมเพื่อฟันธง',
      'หากกล่าวถึงหลายประเภทรายได้ ให้ตรวจหลักฐานที่เกี่ยวข้องทั้งหมดก่อนรับรองผล',
      'ตอบขั้นตอนและข้อควรตรวจสอบเท่าที่มีหลักฐาน โดยแยกข้อเท็จจริงกับข้อเสนอ',
      'ให้ AI ปลายทางเปิดตรวจต้นฉบับกฎหมาย/หนังสือสั่งการ/คู่มือทางการ รวมวันมีผลและการแก้ไขก่อนสรุป',
      'ห้ามสมมุติอัตรา สูตร กำหนดเวลา แบบฟอร์ม หรือขั้นตอนหน้าจอ',
      'ก่อนให้คำแนะนำต้องตรวจประเภท อปท. และอำนาจจัดเก็บภาษีเฉพาะประเภท โดยเฉพาะกรณี อบจ. ห้ามสันนิษฐานว่าเป็นผู้จัดเก็บภาษีที่ดินและสิ่งปลูกสร้าง',
      'ห้ามอ้างว่าเชื่อมต่อ LTAX หรือ e-LAAS หรือทำธุรกรรมแล้ว',
      'ถามข้อมูลที่ขาดผ่านช่องหลักทีละประเด็น ห้ามขอข้อมูลส่วนบุคคลเกินจำเป็น',
      'ต้องให้เจ้าหน้าที่ตรวจสอบก่อนใช้จริง',
      ...matches.flatMap(d => d.instructions || [])
    ]
  });
}
