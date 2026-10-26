import test from 'node:test';
import assert from 'node:assert/strict';
import {draftTortIntake,TORT_CASE_TYPES} from '../../src/tort-liability-intake.js';
const cases=[
['รถราชการชนคู่กรณี','vehicle'],['รถคว่ำ','vehicle'],['อุบัติเหตุขณะปฏิบัติงาน','vehicle'],
['เงินสดหาย','finance'],['เบิกจ่ายไม่ถูกต้อง','finance'],['ออกใบเสร็จรับเงิน','finance'],
['จัดซื้อเกินราคา','procurement'],['งานจัดจ้างเสียหาย','procurement'],['ตรวจรับผิด','procurement'],
['ทรัพย์สินสูญหาย','property'],['ไฟไหม้สำนักงาน','property'],['ถูกโจรกรรม','property'],
['แพทย์รักษาพยาบาลผิดพลาด','medical'],['คนไข้ได้รับอันตราย','medical'],['ผู้ป่วยเสียหาย','medical'],
['สอบละเมิดเจ้าหน้าที่','procedural'],['แต่งตั้งกรรมการ','procedural'],['อายุความเรียกชดใช้','procedural'],
['รายละเอียดไม่ชัดเจน','other'],['','other'],['เจ้าหน้าที่ทำผิด','other'],
['รถชนแล้วประกันจ่ายไหม','vehicle'],['เงินราชการขาดบัญชี','finance'],['จัดซื้อพัสดุ','procurement'],
['ทรัพย์สินเสียหาย','property'],['ความเห็นแพทย์','medical'],['คำสั่งเรียกชดใช้','procedural'],
['ค่าเสียหายแสนบาท','other'],['ข้อบกพร่องระบบงาน','other'],['ขอเปอร์เซ็นต์ละเมิด','other']
];
test('seven valid categories',()=>assert.equal(TORT_CASE_TYPES.length,7));
for(const [input,category] of cases)test('intake '+input,()=>{
 const a=draftTortIntake(input);
 assert.equal(a.category,category);
 assert.ok(a.evidenceChecklist.length>0);
 assert.equal(a.legalVersion,'NOT_VERIFIED');
 assert.equal(a.allocationPercent,null);
 assert.equal(a.compensationOrder,null);
 assert.equal(a.decision,'HUMAN_REVIEW_REQUIRED');
});
