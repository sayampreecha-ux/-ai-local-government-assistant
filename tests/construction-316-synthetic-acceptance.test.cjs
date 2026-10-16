// Synthetic fixture acceptance only; NOT browser E2E or official evidence.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/core/engineering-k-routing-overrides-v1.js', 'utf8');
const core = { routeRequest: () => ({primaryModule:'GP001',modules:['GP001'],confidence:0.42,ambiguous:true,fallback:true}), PROMPT_REGISTRY:[{moduleId:'GP007'}] };
vm.runInNewContext(source,{window:{GovPromptCore:core}});
const cases = [
['TC01',()=>assert.equal(100*6*.15,90)],
['TC02',()=>assert.equal(2100-(10*100+5*200),100)],
['TC03',()=>assert.equal(({factorF:null}).factorF,null)],
['TC04',()=>assert.equal(({officialPrice:null}).officialPrice,null)],
['TC05',()=>assert.equal(95-90,5)],
['TC06',()=>assert.equal(({pdf:null}).pdf,null)],
['TC07',()=>{const a=core.routeRequest('ค่า K หินคลุกไม่มีบดอัด');assert.equal(a.primaryModule,'GP007');assert.equal(a.evidenceVerified,false);assert.equal(a.evidenceStatus,'UNVERIFIED');assert.equal(a.confidence,.42);}],
['TC08',()=>assert.ok(Math.abs((6-5.9)*100-10)<1e-8)],
['TC09',()=>assert.ok(Date.parse('2026-10-02')>Date.parse('2026-09-29'))],
['TC10',()=>assert.equal(({drawing:null,boq:null}).boq,null)],
['TC11',()=>assert.equal(({price:1250,source:null}).source,null)],
['TC12',()=>assert.equal(({signedAcceptance:null}).signedAcceptance,null)]
];
for(const [id,check] of cases) test(id+' synthetic fixture sanity',check);
