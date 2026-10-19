import test from 'node:test';
import assert from 'node:assert/strict';
import { REVENUE_DOMAINS, revenueGuidance } from '../src/revenue-guidance.js';
const samples = [
 ['land-building',['ภาษีที่ดิน','สิ่งปลูกสร้าง','ช่วยดูภาษีที่ดิน','ตรวจสิ่งปลูกสร้าง','คำนวณภาษีที่ดิน']],
 ['sign',['ภาษีป้าย','ประเภทป้าย','คำนวณภาษีป้าย','ตรวจภาษีป้าย','แจ้งภาษีป้าย']],
 ['assessment-appeal',['ประเมินภาษี','คัดค้านภาษี','อุทธรณ์ภาษี','ตรวจประเมินภาษี','ร่างอุทธรณ์ภาษี']],
 ['arrears',['ภาษีค้าง','เร่งรัดภาษี','เบี้ยปรับภาษี','เงินเพิ่มภาษี','ตรวจภาษีค้าง']],
 ['tax-map',['แผนที่ภาษี','สำรวจทรัพย์สิน','ตรวจแผนที่ภาษี','ช่วยสำรวจทรัพย์สิน','ข้อมูลแผนที่ภาษี']],
 ['ltax',['LTAX','ltax online','LTAX GIS','คู่มือ LTAX','แก้ปัญหา LTAX']],
 ['elaas',['e-LAAS','New e-LAAS','บันทึกรายรับ','คู่มือ e-LAAS','ตรวจ e-LAAS']],
 ['documents',['หนังสือแจ้งภาษี','บันทึกข้อความภาษี','แบบฟอร์มภาษี','ร่างหนังสือแจ้งภาษี','ตรวจแบบฟอร์มภาษี']]
];
for (const [domain, questions] of samples) {
  for (const question of questions) test(`${domain}: ${question}`, () => {
    const result = revenueGuidance(question);
    assert.equal(result?.domain, domain);
    assert.equal(result?.decisionLock, true);
    assert.equal(result?.mode, 'guidance-only');
    assert.ok(result.missingEvidence.length > 0);
    assert.ok(result.instructions.some(x=>x.includes('ห้ามสมมุติ')));
  });
}
test('unrelated tasks remain untouched',()=>assert.equal(revenueGuidance('ร่างหนังสือราชการทั่วไป'),null));
test('all verified evidence lifts only the evidence lock',()=>{
  const evidence=Object.fromEntries(REVENUE_DOMAINS[0].evidence.map(k=>[k,true]));
  const result=revenueGuidance('ภาษีที่ดิน',evidence);
  assert.equal(result.decisionLock,false);
  assert.equal(result.mode,'guidance-only');
});
test('missing question is inert',()=>assert.equal(revenueGuidance(null),null));
