import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readEngineeringMenu} from '../helpers/engineering-menu.mjs';

const sandbox={window:{},location:{pathname:'/index.html'}};
for(const name of ['shared-context','prompt-registry','transaction-router','router-regression-overrides','hybrid-intent-classifier','hybrid-real-world-overrides','engineering-k-routing-overrides-v1','education-event-routing-overrides','media-routing-overrides','output-router','prompt-orchestrator'])
 vm.runInNewContext(readFileSync(`assets/js/core/${name}.js`,'utf8'),sandbox);
vm.runInNewContext(readFileSync('assets/js/ui/image-studio-v1.js','utf8').replace(/^export /gm,''),sandbox);
const core=sandbox.window.GovPromptCore;
const {actions}=readEngineeringMenu();
const cases=JSON.parse(readFileSync('tests/fixtures/engineering-final/cases.json'));
const source=JSON.parse(readFileSync('tests/fixtures/engineering-final/source.json'));
for(const id of ['BOQ01','TOR04','STRUCT01'])test(`${id}: full menu/intake text retains engineering/procurement route through image override`,()=>{
 const c=cases.find(c=>c.id===id),seed=actions[c.action];
 const answer=`โครงการ ${source.project} จังหวัดเชียงใหม่ วงเงินยังไม่ยืนยัน ต้องการ ${seed.label} ${c.scenario} แหล่งโครงการจริง ${source.source} เอกสาร ${Object.values(source.documents).join(' ')} ยังไม่ได้แนบไฟล์ใน GovPrompt ให้ AI ปลายทางอ่านต้นฉบับก่อนวิเคราะห์`;
 const question=`${seed.prompt}\n\nข้อมูลเพิ่มเติมจากผู้ใช้:\n- ${answer}`;
 const context=core.createSharedContext({facts:question,desiredOutput:question});
 for(const route of [core.routeRequest(question),core.routeTransaction(context)]){
  assert.ok(['GP007','GP003'].includes(route.moduleId||route.primaryModule),`${id}: ${route.reason}`);
  assert.notEqual(route.transactionType,'public-relations');
 }
 const result=core.createGovernmentPrompt({question,context});
 assert.ok(!result.imageCreativeMode);
 assert.ok(result.prompt.includes(question));
 assert.match(result.prompt,/Human Review/);
 if(['boq','tor','price'].includes(c.action))assert.equal(result.qualityGates.evidenceRequired,true);
});
for(const question of ['ทำข่าวประชาสัมพันธ์กิจกรรมของ อบจ.','เขียนโพสต์เฟซบุ๊กประชาสัมพันธ์โครงการ','สร้างอินโฟกราฟิกประชาสัมพันธ์','จัดทำปกนำเสนอผลงาน','ทำปก','ทำรูปประชาสัมพันธ์โครงการก่อสร้าง','สร้างภาพอวยพรวันปีใหม่'])test(`PR negative control: ${question}`,()=>{
 assert.equal(core.routeRequest(question).primaryModule,'GP012');
 assert.equal(core.routeTransaction(core.createSharedContext({facts:question,desiredOutput:question})).moduleId,'GP012');
});
