import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {detectGovernmentWorkflows} from '../../src/government-workflow-suite.js';
import {buildWorkflowRuntimeView,buildWorkflowPromptBlock} from '../../assets/js/core/government-workflow-runtime-v5.js';
const sandbox={window:{},location:{pathname:'/index.html'}};
for(const file of ['shared-context','prompt-registry','transaction-router'])vm.runInNewContext(readFileSync(`assets/js/core/${file}.js`,'utf8'),sandbox);
const core=sandbox.window.GovPromptCore;
for(const query of ['เบิกค่าเช่าซื้อบ้าน','ขอเบิกค่าเช่าซื้อบ้าน','เบิกค่าซื้อบ้าน','สิทธิผ่อนชำระบ้าน','ขอเบิกค่าเช่าบ้าน'])test(query+' stays in finance',()=>{
 assert.deepEqual(detectGovernmentWorkflows({query}).map(x=>x.id),['gov.finance']);
 const route=core.routeTransaction(core.createSharedContext({facts:query,desiredOutput:query}));
 assert.equal(route.moduleId,'GP005');
 assert.ok(!core.routeRequest(query).modules.includes('GP003'));
 const view=buildWorkflowRuntimeView({query});
 assert.deepEqual(view.workflowIds,['gov.finance']);
 assert.doesNotMatch(buildWorkflowPromptBlock(view),/gov.procurement|gov.project|Cross-workflow:/);
});
for(const query of ['เบิกค่าเช่าซื้อบ้าน และจัดซื้อคอมพิวเตอร์ให้สำนักงาน','ซื้อรถขุด','จัดซื้อบ้านพักของหน่วยงาน','เบิกค่าเช่าซื้อบ้านพักของหน่วยงาน'])test(query+' preserves real procurement',()=>{
 assert.ok(detectGovernmentWorkflows({query}).some(x=>x.id==='gov.procurement'));
 assert.ok(buildWorkflowRuntimeView({query}).workflowIds.includes('gov.procurement'));
});
test('mixed benefit and explicit procurement keeps the procurement route',()=>{
 assert.ok(core.routeRequest('ขอเบิกค่าเช่าซื้อบ้าน และจัดซื้อคอมพิวเตอร์ให้สำนักงาน').modules.includes('GP003'));
});
test('explicit project is not suppressed by a benefit claim',()=>{
 assert.ok(detectGovernmentWorkflows({query:'เบิกค่าเช่าซื้อบ้าน และทำโครงการอบรม'}).some(x=>x.id==='gov.project'));
});
