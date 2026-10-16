import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const box={console,URL,document:{baseURI:'http://localhost/',addEventListener(){},querySelector(){return null},querySelectorAll(){return []}},addEventListener(){}};box.window=box;vm.createContext(box);
for(const m of readFileSync('index.html','utf8').matchAll(/<script src="(assets\/js\/core\/[^"?]+)(?:\?[^" ]*)?" defer><\/script>/g)){
 vm.runInContext(readFileSync(m[1],'utf8'),box,{filename:m[1],importModuleDynamically:()=>Promise.reject(Error('UI-only import'))});
 if(m[1].endsWith('engineering-workflows-v1.js'))break;
}
const core=box.GovPromptCore;
const cases=JSON.parse(readFileSync('tests/engineering/final-acceptance-cases.json','utf8'));
function bundle(question){const context=core.createSharedContext({facts:question,desiredOutput:question});return core.createGovernmentPrompt({question,context,route:core.routeTransaction(context)});}
for(const c of cases)test(c.id+' preserves deliverable and serialized gates',()=>{
 const r=bundle(c.question);
 assert.equal(core.routeRequest(c.question).primaryModule,'GP007');
 assert.equal(r.route.moduleId,'GP007');
 for(const task of c.expectedTasks)assert.ok(r.engineeringPlan.tasks.some(t=>t.id===task),task);
 assert.ok(c.expectedOutputs.includes(r.outputPlan.id),r.outputPlan.id);
 assert.equal(r.taskPlan.evidenceMode,'verify-applicable-primary-source');
 assert.equal(r.qualityGates.evidenceRequired,true);
 assert.equal(r.qualityGates.decisionRequired,true);
 assert.match(r.prompt,/Evidence Gate: ON/);
 assert.doesNotMatch(r.prompt,/Evidence Gate: OFF/);
 assert.match(r.prompt,/Decision Lock: ON/);
 assert.match(r.prompt,/Human Review/);
 assert.match(r.prompt,/Trusted Numeric: NO-GO/);
 assert.match(r.prompt,/GovPrompt สร้าง Prompt สำหรับ AI ภายนอกเท่านั้น/);
 assert.ok(r.prompt.includes(c.question));
 assert.equal(r.engineeringPlan.certificationAllowed,false);
 assert.equal(r.engineeringPlan.numericStatus,'UNVERIFIED');
 assert.doesNotMatch(r.prompt,/- ส่งผลลัพธ์หลักในรูปแบบ “บทวิเคราะห์”/);
 if(c.id==='T05-critical-drawing'){
  assert.equal(r.qualityGates.legalVersionRequired,true);
  assert.equal(r.taskPlan.action,'draft');assert.equal(r.taskPlan.riskLevel,'HIGH');
  assert.deepEqual(Array.from(r.engineeringPlan.tasks,t=>t.id),['D01']);
  assert.match(r.prompt,/ห้ามเดาความหนา เหล็กเสริม/);
  assert.match(r.prompt,/หากสร้างไฟล์ CAD\/แบบจริงไม่ได้/);
 }
 if((c.task==='T01'&&!/BOQ|ปร\.?4/i.test(c.question))||c.task==='T11'){
  assert.notEqual(r.taskPlan.constructionReview,true);assert.doesNotMatch(r.prompt,/ผลลัพธ์บังคับแยก 4 ส่วน/);
 }
 if(c.task==='T07'){assert.notEqual(r.outputPlan.id,'tor');if(c.id==='T07-cross'){assert.notEqual(r.taskPlan.constructionReview,true);assert.match(r.prompt,/ไม่สร้าง BOQ ใหม่เมื่อผู้ใช้ขอเพียงตรวจเอกสารอ้างอิง/);}}
 if(c.id==='T08-cross'||c.id==='T12-cross'){
  assert.equal(r.prMode,undefined);assert.match(r.prompt,/ส่งโพสต์\/ชิ้นงานประชาสัมพันธ์ที่ขอร่วมด้วย/);
 }
});
for(const q of ['จัดทำแบบรูปรายการถนนโดยแยกจาก TOR งานก่อสร้าง','ช่วยจัดทำร่างรายการประกอบแบบงานก่อสร้าง โดยแยกแบบรูปรายการออกจาก TOR'])test('negated TOR: '+q,()=>{
 const r=bundle(q);assert.ok(r.engineeringPlan.drawing);assert.equal(r.outputPlan.id,'technical-drawing');assert.ok(!r.engineeringPlan.tasks.some(t=>t.id==='T06'));
});
for(const [q,expected] of [['ทำโพสต์ประชาสัมพันธ์ซ่อมถนน','GP012'],['ร่าง TOR ซื้อคอมพิวเตอร์','GP003'],['ร่างหนังสือขอความอนุเคราะห์','GP001'],['ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา','GP003']])test('other-domain route retained: '+q,()=>{
 assert.equal(core.routeRequest(q).primaryModule,expected);assert.equal(core.ENGINEERING_WORKFLOWS.plan(q),null);
});
test('original 36 baseline inputs and IDs retained',async()=>{
 const {cases:original}=await import('./cases.mjs');for(const c of original)assert.ok(cases.some(x=>x.id===c.id&&x.question===c.question));assert.equal(original.length,36);assert.equal(cases.length,61);
});
