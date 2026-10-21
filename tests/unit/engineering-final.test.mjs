import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {readEngineeringMenu,engineeringLabels} from '../helpers/engineering-menu.mjs';
const {catalog,tasks,actions}=readEngineeringMenu();
const sandbox={window:{},location:{pathname:'/index.html'}};
for(const name of ['shared-context','prompt-registry','transaction-router','output-router','prompt-orchestrator'])vm.runInNewContext(readFileSync(`assets/js/core/${name}.js`,'utf8'),sandbox);
const core=sandbox.window.GovPromptCore;
const cases=JSON.parse(readFileSync('tests/fixtures/engineering-final/cases.json'));
test('main six engineering actions plus K remain ordered, TOR is a drawing subchoice',()=>{
 assert.deepEqual([...tasks.map(x=>x.label),'🔍 ตรวจสอบค่า K'],engineeringLabels);
 assert.equal(catalog.filter(c=>c.id!=='assistance').length,13);
 assert.deepEqual([...tasks.find(x=>x.label==='จัดทำแบบรูปรายการงานก่อสร้าง').choices].map(x=>x.label),['จัดทำแบบรูปรายการ','ร่าง TOR งานก่อสร้าง']);
});
for(const c of cases)test(`${c.id}: generated handoff preserves task and evidence requirements (not browser E2E)`,()=>{
 const question=actions[c.action].prompt+' '+c.scenario;
 const result=core.createGovernmentPrompt({question,context:core.createSharedContext({facts:question,desiredOutput:question})});
 assert.ok(result.prompt.includes(question),'full question preserved');
 for(const text of c.expect)assert.ok(result.prompt.includes(text),text);
 assert.match(result.prompt,/Human Review/);
 if(['boq','tor','price'].includes(c.action)){assert.equal(result.qualityGates.evidenceRequired,true);assert.equal(result.qualityGates.decisionRequired,true);assert.equal(result.qualityGates.legalVersionRequired,true);}
 if(['boq','tor','price'].includes(c.action))for(const text of ['VERIFIED','PENDING','BLOCKED','Partial Decision Lock','ไม่ใช่การรับรองเอกสารทางราชการ'])assert.ok(result.prompt.includes(text),text);
});
