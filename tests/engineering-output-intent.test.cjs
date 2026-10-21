const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
const file=fs.readFileSync('assets/js/core/engineering-workflows-v1.js','utf8');
const core={routeRequest:()=>({}),routeTransaction:()=>({}),createGovernmentPrompt:()=>({prompt:'baseline'})};
const sandbox={window:{GovPromptCore:core}};vm.runInNewContext(file,sandbox);
const engineering=core.ENGINEERING_WORKFLOWS;
const cases=[
 ['TOR04','ร่าง TOR งานก่อสร้างถนน พร้อมตรวจความสอดคล้องกับ BOQ และรายการประมาณราคา','tor','T06'],
 ['DRAW01','จัดทำแบบรูปรายการงานก่อสร้างอาคาร ไม่ขอประมาณราคา ไม่ขอ TOR','technical-drawing','D01'],
 ['BOQ01','จัดทำ BOQ ปร.4 งานก่อสร้างถนนพร้อมราคาวัสดุและแรงงาน','engineering-boq','T02'],
 ['STRUCT01','ตรวจแบบก่อสร้างอาคารและโครงสร้าง ประเมินความเสี่ยง ไม่รับรองความปลอดภัย','drawing-review','T05']
];
for(const [id,question,format,task] of cases)test(id+' primary output and bounded prompt',()=>{
 const plan=engineering.plan(question);assert.ok(plan,id);const output=engineering.output(plan);
 assert.equal(output.format,format);assert.ok(output.instructions.some(x=>x.includes(task)));
 const prompt=core.createGovernmentPrompt({question}).prompt;
 assert.match(prompt,/Decision Lock: ON/);assert.match(prompt,/Human Review/);
 if(id==='TOR04'){assert.match(prompt,/วัตถุประสงค์/);assert.match(prompt,/เกณฑ์ตรวจรับ/);assert.equal(output.format,'tor');}
 if(id==='DRAW01'){assert.ok(!plan.estimationRequested);assert.equal(plan.tasks.some(x=>x.id==='T04'),false);}
 if(id==='BOQ01')assert.match(prompt,/จำนวนเงินรายการ = ปริมาณ/);
 if(id==='STRUCT01')assert.match(prompt,/ห้ามรับรองความมั่นคงปลอดภัย/);
});
test('public-relations negative route',()=>assert.equal(engineering.plan('ทำโพสต์ประชาสัมพันธ์งานก่อสร้างถนน'),null));
