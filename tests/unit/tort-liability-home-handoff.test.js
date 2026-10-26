import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../../assets/js/home-v3.js',import.meta.url),'utf8');
const start=src.indexOf('  function completeTortLevel1Handoff(');
const end=src.indexOf('  function addRouteResult(',start);
assert.ok(start!==-1 && end>start,'handoff must exist in actual home rendering source');
const snippet=src.slice(start,end);
function handoff(prompt,request){
 const ctx={};vm.runInNewContext(snippet+';this.applyTort=completeTortLevel1Handoff;',ctx);
 return ctx.applyTort(prompt,request);
}
const scenarios=[
'สอบละเมิดเจ้าหน้าที่','ความรับผิดทางละเมิดของเจ้าหน้าที่','รถราชการชนเสียหาย',
'คำสั่งเรียกชดใช้','แต่งตั้งกรรมการสอบสวนละเมิด',
];
for(const q of scenarios)test('home output handoff '+q,()=>{
 const v=handoff('BASE',q);
 assert.match(v,/GP_TORT_LEVEL1_HANDOFF_V1/);
 assert.match(v,/ว66\/ว141/);
 assert.match(v,/NOT VERIFIED/);
 assert.equal(handoff(v,q),v,'must not append handoff twice');
 assert.ok(v.includes('\n[GP_TORT_LEVEL1_HANDOFF_V1]'));
});
test('unrelated domain unchanged',()=>assert.equal(handoff('BASE','ร่างหนังสือเชิญประชุม'),'BASE'));
test('home actually invokes new handoff before rendering card',()=>{
 assert.match(src.slice(end,end+700),/promptBundle\.prompt, originalRequest/);
});
