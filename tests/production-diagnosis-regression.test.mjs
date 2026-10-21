import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {detectGovernmentWorkflows} from '../src/government-workflow-suite.js';
const sandbox={window:{},location:{pathname:'/index.html'}};
for(const file of ['shared-context','prompt-registry','transaction-router','router-regression-overrides','hybrid-intent-classifier','hybrid-real-world-overrides','engineering-k-routing-overrides-v1','education-event-routing-overrides','media-routing-overrides','output-router','prompt-orchestrator','engineering-workflows-v1','privacy-guard','privacy-submit-guard'])
  { if(file==='privacy-guard')sandbox.document={readyState:'loading',addEventListener(){}};
    vm.runInNewContext(readFileSync(`assets/js/core/${file}.js`,'utf8'),sandbox,{filename:file}); }
const core=sandbox.window.GovPromptCore;
function build(question,extra={}){const context=core.createSharedContext({facts:question,desiredOutput:question,...extra});return core.createGovernmentPrompt({question,context,route:core.routeTransaction(context)});}
for(const [id,q,format] of [
  ['TOR04','ร่าง TOR งานก่อสร้างถนน พร้อมตรวจความสอดคล้องกับ BOQ และรายการประมาณราคา','tor'],
  ['DRAW01','จัดทำแบบรูปรายการงานก่อสร้างอาคาร ไม่ขอประมาณราคา ไม่ขอ TOR','technical-drawing'],
  ['BOQ01','จัดทำ BOQ ปร.4 งานก่อสร้างถนนพร้อมราคาวัสดุและแรงงาน','engineering-boq'],
  ['STRUCT01','ตรวจแบบก่อสร้างอาคารและโครงสร้าง ประเมินความเสี่ยง ไม่รับรองความปลอดภัย','drawing-review']
])test(id+' real orchestrator retains primary output',()=>{const r=build(q);assert.equal(r.outputPlan.format,format);assert.equal(r.taskPlan.deliverable,format);assert.ok(r.prompt.includes(q));assert.match(r.prompt,/Human Review/);assert.equal(r.qualityGates.evidenceRequired,true);});
test('category-only sensitive question allowed; added values/disclaimers never bypass security',()=>{
 assert.equal(core.evaluateProcurementFinanceData('จัดซื้อจัดจ้างอยู่ระหว่างพิจารณา บริษัททดสอบ ราคาเสนอ 500000 บาท').decision,'BLOCK');
 const topic='อธิบายหลัก PDPA สำหรับข้อมูลสุขภาพ ศาสนา และประวัติอาชญากรรม โดยไม่ใช้ข้อมูลบุคคลจริง';
 assert.equal(core.sanitizeExternalContent(topic).blocked,false);
 for(const q of [topic+' นายสมชาย ใจดี เป็นเบาหวาน',topic+' HN1234',topic+' ศาสนา: พุทธ',topic+' password=demo-secret',topic+' เลขบัตรประชาชน 1234567890123','ข้อมูลสุขภาพของบุคคล','อธิบายข้อมูลสุขภาพ นายสมชาย ใจดี','ผู้ป่วยใช้ยา amoxicillin','ข้อมูลศาสนา พุทธ','ประวัติอาชญากรรมของบุคคล']){
   const p=core.sanitizeExternalContent(q),g=core.evaluateProcurementFinanceData(q);
   assert.ok(p.blocked || p.redactions.length || g.decision==='BLOCK',q);
 }
});
test('PDPA topic selects legal workflow without swallowing actual HR',()=>{
 const q='ร่างแนวทางคุ้มครองข้อมูลส่วนบุคคล PDPA สำหรับ อบจ. โดยไม่ใช้ข้อมูลบุคคลจริง';
 assert.equal(detectGovernmentWorkflows({question:q})[0].id,'gov.legal');
 assert.ok(!build(q).taskPlan.disciplines.includes('human-resources'));
 assert.equal(detectGovernmentWorkflows({question:'จัดทำแผนอัตรากำลังและคุ้มครองข้อมูลส่วนบุคคลของพนักงาน'})[0].id,'gov.hr');
});
test('fund source matches context and prompt without unlocking legal decision',()=>{
 const q='ร่างโครงการอาหารปลอดภัยของ รพ.สต. ใช้เงินบำรุง วงเงิน 50000 บาท สำหรับกิจกรรมอบรม 1 วัน โดยยังไม่ยืนยันสิทธิเบิกจ่าย';
 const r=build(q);assert.match(r.prompt,/sourceOfFunds=maintenanceFund/);assert.match(r.prompt,/- แหล่งเงิน: เงินบำรุง/);assert.doesNotMatch(r.prompt,/- แหล่งเงิน: \[ยังไม่ได้ระบุ\]/);assert.equal(r.outputPlan.format,'project');
 assert.equal(detectGovernmentWorkflows({question:q})[0].id,'gov.project');
 assert.equal(detectGovernmentWorkflows({question:'ร่างโครงการอาหารปลอดภัย รพ.สต. ค่าอาหารเบิกจ่ายได้หรือไม่'})[0].id,'gov.finance');
 assert.equal(core.extractHealthFundingContext('รพ.สต. ใช้เงินบำรุงและเงินอุดหนุน').sourceOfFunds,'mixed');
 assert.equal(core.extractHealthFundingContext('รพ.สต. ไม่ใช้เงินบำรุง ใช้งบประมาณ อปท.').sourceOfFunds,'localGovernmentBudget');
 assert.equal(core.extractHealthFundingContext('รพ.สต. จัดกิจกรรม').sourceOfFunds,'unknown');
 assert.equal(core.createSharedContext({facts:q,fundingSource:'เงินอุดหนุน'}).fundingSource,'เงินอุดหนุน');
 assert.match(build(q,{fundingSource:'เงินอุดหนุน'}).prompt,/sourceOfFunds=mixed/);
});
test('agenda drafting stays an agenda and estimate audits retain A-D contract',()=>{
 const agenda=build('ร่างระเบียบวาระประชุมสภาท้องถิ่น โดยใช้ช่องว่างสำหรับวันเวลาและเรื่องเสนอ');
 assert.equal(agenda.outputPlan.format,'council-agenda');assert.equal(agenda.taskPlan.deliverable,'council-agenda');assert.equal(agenda.taskPlan.action,'draft');
 const r=build('ตรวจปริมาณงานซ่อมถนนคอนกรีตและราคากลาง');assert.equal(r.outputPlan.format,'engineering-estimate');assert.match(r.prompt,/Factor F/);assert.match(r.prompt,/ตาราง C/);
 assert.equal(build('ร่างหนังสือตอบ สตง. เรื่องงานก่อสร้างถนน').outputPlan.format,'official-document');
 assert.equal(core.routeRequest('ทำโพสต์ประชาสัมพันธ์งานก่อสร้างถนน').primaryModule,'GP012');
 assert.equal(build('ตรวจสอบค่า K งานก่อสร้างถนน').outputPlan.format,'k-review');
});
