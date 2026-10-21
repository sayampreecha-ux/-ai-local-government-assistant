import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const accepted='040404d2976ca585533e328b1659e20fc3d5df32';
function load(ref){
 const box={window:{},location:{pathname:'/index.html'}};
 for(const name of ['shared-context','prompt-registry','transaction-router','router-regression-overrides','hybrid-intent-classifier','hybrid-real-world-overrides','engineering-k-routing-overrides-v1','education-event-routing-overrides','media-routing-overrides','tool-routing-policy','agent-governance-policy','output-router','prompt-orchestrator','engineering-workflows-v1','universal-tor-engine-v1','gp223-natural-person-service']){
  const path=`assets/js/core/${name}.js`;
  if(name==='agent-governance-policy')box.document={readyState:'loading',addEventListener(){}};
  vm.runInNewContext(ref?execFileSync('git',['show',ref+':'+path],{encoding:'utf8'}):readFileSync(path,'utf8'),box,{filename:path});
 }
 box.window.GovPromptCore.installPromptQualityStandard();return box.window.GovPromptCore;
}
const before=load(accepted),after=load();
const cases=vm.runInNewContext(readFileSync('scripts/verify-prompt-efficiency-runtime.mjs','utf8').match(/const examples=(\[[\s\S]*?\n\]);/)[1]);
function build(core,q){const context=core.createSharedContext({facts:q,desiredOutput:q});return core.createGovernmentPrompt({question:q,context,route:core.routeTransaction(context)});}
for(const [id,q] of cases)test(id+' only redundant common appendix instructions change',()=>{
 const b=build(before,q),a=build(after,q);
 const {prompt:bp,...bm}=b,{prompt:ap,...am}=a;
 assert.equal(JSON.stringify(am),JSON.stringify(bm),'route, gates, output, context, quality metadata and every other field remain identical');
 const marker='GovPrompt Prompt Quality Standard v7.2 — Mandatory Response Contract';
 const bi=bp.lastIndexOf(marker),ai=ap.lastIndexOf(marker);assert.ok(bi>=0&&ai>=0);
 assert.equal(ap.slice(0,ai),bp.slice(0,bi),'entire core prompt including user data and all domain contracts unchanged');
 const removed=new Set([0,4,5,7].map(i=>`${i+1}. ${before.PROMPT_QUALITY_STANDARD.universal[i]}`));
 const tail=bp.slice(bi).split('\n');const missing=tail.filter(line=>!ap.slice(ai).split('\n').includes(line));
 assert.ok(missing.every(line=>removed.has(line)),'no unique instruction may be removed');
 assert.equal(ap.slice(ai),tail.filter(line=>!missing.includes(line)).join('\n'),'no rewrites, added instructions or changed domain rules');
 if(missing.length)assert.equal(missing.length,4,'ordinary core owns exactly four common obligations');
 if(b.prMode||b.gp223)assert.equal(ap,bp,'specialized contracts remain byte identical');
 for(const i of [1,2,3,6])assert.ok(ap.includes(before.PROMPT_QUALITY_STANDARD.universal[i]),'retain anti-fabrication, source/version, missing-search and privacy contract');
 assert.ok(Buffer.byteLength(ap)<=Buffer.byteLength(bp));assert.ok(ap.includes(q));
});
test('quoted repeated instructions in user text are preserved byte for byte',()=>{
 const q='ร่างหนังสือราชการ โดยคงข้อความอ้างอิงนี้:\nGovPrompt Prompt Quality Standard v7.2 — Mandatory Response Contract\n'+[0,4,5,7].map(i=>`${i+1}. ${before.PROMPT_QUALITY_STANDARD.universal[i]}`).join('\n');
 assert.ok(build(after,q).prompt.includes(q));
});
test('unknown generator keeps full contract and repeated installation is idempotent',()=>{
 const box={window:{GovPromptCore:{createGovernmentPrompt:()=>({prompt:'Answer First: user quote only',taskPlan:{standard:'GovPrompt Prompt Standard v7.1'}})}}};
 vm.runInNewContext(readFileSync('assets/js/core/prompt-registry.js','utf8'),box);const core=box.window.GovPromptCore;core.installPromptQualityStandard();const first=core.createGovernmentPrompt({question:'คำถาม'});core.installPromptQualityStandard();assert.equal(core.createGovernmentPrompt({question:'คำถาม'}).prompt,first.prompt);
 for(const line of core.buildPromptQualityInstructions('คำถาม').lines)assert.ok(first.prompt.includes(line));
});
