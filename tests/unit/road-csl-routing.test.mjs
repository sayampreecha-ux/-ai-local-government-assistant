import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { installImageStudio, isImageCreativeIntent } from '../../assets/js/ui/image-studio-v1.js';
const sandbox={window:{},location:{pathname:'/index.html'}};
for(const name of ['shared-context','prompt-registry','transaction-router','output-router','prompt-orchestrator'])vm.runInNewContext(fs.readFileSync(`assets/js/core/${name}.js`,'utf8'),sandbox);
const core=sandbox.window.GovPromptCore;
installImageStudio(core);
const questions=[
 'ช่วยถอดปริมาณงานก่อสร้างจากแบบรูปรายการและจัดทำ BOQ/ปร.4 เป็นรายการ พร้อมหน่วย สูตรคำนวณ ตำแหน่งอ้างอิงแบบ และหลักฐานแต่ละปริมาณ แยกรายการที่คำนวณได้จริงกับรายการที่ข้อมูลไม่พอ ห้ามเดาขนาด ปริมาณ หรือรายละเอียดที่ไม่มีในแบบ และให้วิศวกรตรวจรับรองผล ก่อสร้างถนนคสล',
 'ช่วยถอดปริมาณงานก่อสร้างจากแบบรูปรายการและจัดทำ BOQ/ปร.4',
 'ถอดแบบถนน ค.ส.ล. จัดทำรูปแบบ BOQ และ ปร.4/ปร.5',
 'ถอดแบบถนน ค.ส.ล.'
];
for(const question of questions)test(`construction with late Image Studio: ${question}`,()=>{
 assert.equal(isImageCreativeIntent(question),false);
 const context=core.createSharedContext({facts:question,desiredOutput:question});
 assert.equal(core.routeRequest(question).primaryModule,'GP007');
 const route=core.routeTransaction(context);
 assert.equal(route.moduleId,'GP007');
 assert.equal(core.routeOutput(question,route,context).id,'construction-estimate');
 const bundle=core.createGovernmentPrompt({question,route,context});
 assert.equal(bundle.outputPlan.id,'construction-estimate');
 assert.equal(bundle.route.moduleId,'GP007');
 for(const marker of ['A ตาราง','B สูตร','C ตาราง','D ข้อจำกัด','Human Review','Partial Decision Lock: ON'])assert.ok(bundle.prompt.includes(marker),marker);
 assert.doesNotMatch(bundle.prompt,/IMAGE CREATIVE MODE|หมวดที่ระบบคาดการณ์: GP012/);
});
for(const question of ['ทำภาพประชาสัมพันธ์จากภาพที่แนบ','ทำรูปให้สวยที่สุด','ทำโปสเตอร์ประชาสัมพันธ์งานก่อสร้างถนน','ทำภาพจากแบบรูปรายการสำหรับประชาสัมพันธ์'])test(`preserve creative intent: ${question}`,()=>{
 assert.equal(isImageCreativeIntent(question),true);
 assert.equal(core.routeRequest(question).primaryModule,'GP012');
 const context=core.createSharedContext({facts:question,desiredOutput:question});
 const result=core.createGovernmentPrompt({question,route:core.routeTransaction(context),context});
 assert.match(result.prompt,/IMAGE CREATIVE MODE/);
});
for(const [question,moduleId] of [['วิเคราะห์ข้อกฎหมายปกครองเกี่ยวกับอำนาจขององค์กรปกครองส่วนท้องถิ่น','GP002'],['จัดทำ TOR งานก่อสร้างเพื่อจัดซื้อจัดจ้าง','GP003'],['ตรวจสอบราคาวัสดุ ค่าแรง และ Factor F','GP007'],['เขียนข่าวประชาสัมพันธ์เปิดถนน','GP012']])test(`regression ${moduleId}`,()=>assert.equal(core.routeRequest(question).primaryModule,moduleId));
