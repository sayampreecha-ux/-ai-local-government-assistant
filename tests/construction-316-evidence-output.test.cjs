const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={window:{},location:{pathname:'/index.html'}};
for(const name of ['shared-context','prompt-registry','transaction-router','output-router','prompt-orchestrator'])vm.runInNewContext(fs.readFileSync(`assets/js/core/${name}.js`,'utf8'),sandbox);
const core=sandbox.window.GovPromptCore;
const cases=[
'ตรวจแบบและ BOQ ถนนคอนกรีต 100 เมตร กว้าง 6 เมตร หนา 0.15 เมตร ราคาสมมุติ 2450 บาท',
'ตรวจสอบ ปร.4 รวม 337000 บาท เทียบ ปร.5 ยังไม่มี Factor F',
'ตรวจ Factor F งานก่อสร้างโดยยังไม่มีตารางฉบับที่ใช้',
'ตรวจราคาวัสดุและค่าแรงจังหวัดปี 2569 โดยยังไม่มีประกาศราคา',
'ตรวจ BOQ 95 ลูกบาศก์เมตร เทียบแบบก่อสร้าง 90 ลูกบาศก์เมตร',
'ถอดปริมาณงานจาก PDF แบบก่อสร้าง แต่ยังไม่ได้แนบ PDF',
'ตรวจค่า K งานหินคลุกปรับเกลี่ยเรียบไม่มีบดอัด ยังไม่มีดัชนีและเงื่อนไขสัญญา',
'ตรวจถนนตามแบบกว้าง 6.00 เมตร วัดจริง 5.90 เมตร หักเงิน 3675 บาทได้เลยหรือไม่',
'ตรวจรับคอนกรีตส่งงาน 25 กันยายน ผลทดสอบออก 2 ตุลาคม',
'ตรวจสูตรค่า K งานถนน',
'ตรวจราคาวัสดุ 1250 บาท ไม่มีหลักฐานแหล่งราคาทางการ',
'ตรวจเอกสารเบิกจ่ายค่าก่อสร้างไม่ครบ ไม่มีรายงานตรวจรับลงนาม'];
for(const question of cases)test(question,()=>{
 const result=core.createGovernmentPrompt({question});
 assert.equal(result.taskPlan.riskLevel,'HIGH');
 assert.equal(result.qualityGates.evidenceRequired,true);
 assert.equal(result.qualityGates.legalVersionRequired,true);
 assert.match(result.prompt,/constructionEvidenceStatus=UNVERIFIED; decisionLock=ON/);
 assert.doesNotMatch(result.prompt,/Evidence Gate: OFF|Legal Version Gate: OFF/);
 assert.match(result.prompt,/ส่วนต่างเชิงคณิตศาสตร์ไม่ใช่ยอดหักตามสัญญาอัตโนมัติ/);
 assert.match(result.prompt,/ห้ามอ้างว่าเปิดอ่านหรือถอดปริมาณแล้ว/);
 assert.match(result.prompt,/ตัวเลขและราคาจำลองไม่ใช่ราคามาตรฐานราชการ/);
});
for(const question of ['ร่างหนังสือเชิญประชุม','สรุปกิจกรรมวันเด็ก','เขียนโพสต์ประชาสัมพันธ์ถนนสายใหม่'])test('unrelated: '+question,()=>{
 assert.doesNotMatch(core.createGovernmentPrompt({question}).prompt,/CONSTRUCTION EVIDENCE CONTROL/);
});
