import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js','utf8');
const section=source.split("id: 'engineering'")[1].split("id: 'council'")[0];
const tasks=[...section.matchAll(/label: '([^']+)', prompt: '([^']+)'/g)].map(m=>({label:m[1],prompt:m[2]}));
const k=readFileSync('assets/js/ui/engineering-k-quick-action-v1.js','utf8');
tasks.push({label:'ตรวจสอบค่า K',prompt:k.match(/button.dataset.prompt = '([^']+)'/)[1]});
const sandbox={window:{},location:{pathname:'/index.html'}};
for(const name of ['shared-context','prompt-registry','transaction-router','output-router','prompt-orchestrator'])vm.runInNewContext(readFileSync(`assets/js/core/${name}.js`,'utf8'),sandbox);
const core=sandbox.window.GovPromptCore;
const cases=JSON.parse(readFileSync('tests/fixtures/engineering-final/cases.json'));
test('six ordered actions, K remains supplied by original module',()=>{
 assert.deepEqual(tasks.map(x=>x.label),['ถอดแบบและจัดทำ BOQ','แบบรูปรายการ / TOR งานก่อสร้าง','จัดทำราคากลางงานก่อสร้าง','ตรวจแบบ / ตรวจงาน / ตรวจรับ','วิเคราะห์ปัญหาถนน / อาคาร / โครงสร้าง','ตรวจสอบค่า K']);
});
for(const c of cases)test(`${c.id}: generated handoff preserves task and evidence requirements (not browser E2E)`,()=>{
 const question=tasks[c.button].prompt+' '+c.scenario;
 const result=core.createGovernmentPrompt({question,context:core.createSharedContext({facts:question,desiredOutput:question})});
 assert.ok(result.prompt.includes(question),'full question preserved');
 for(const text of c.expect)assert.ok(result.prompt.includes(text),text);
 assert.match(result.prompt,/Human Review/);
 if(c.button<3)for(const text of ['VERIFIED','PENDING','BLOCKED','Partial Decision Lock','ไม่ใช่การรับรองเอกสารทางราชการ'])assert.ok(result.prompt.includes(text),text);
});
