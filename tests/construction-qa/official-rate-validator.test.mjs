import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyConstructionEstimate} from './official-rate-validator.mjs';
const item={quantity:10,materialUnitPrice:100,laborUnitPrice:20,declaredAmount:1200};
test('arithmetic is checked but official rates remain locked without citations',()=>{
 const r=verifyConstructionEstimate({items:[item],declaredDirectCost:1200,factorF:1.2,declaredTotal:1440});
 assert.equal(r.directCost,1200);assert.equal(r.total,1440);
 assert.equal(r.arithmeticPass,true);assert.equal(r.officialRateVerified,false);assert.equal(r.decisionLock,true);
 assert.ok(r.issues.some(i=>i.type==='MATERIAL_RATE_UNVERIFIED'));
});
test('detects wrong Pr4 line, Pr4 subtotal and Pr5 total',()=>{
 const r=verifyConstructionEstimate({items:[{...item,declaredAmount:1300}],declaredDirectCost:1300,factorF:1.2,declaredTotal:1500});
 for(const type of ['ARITHMETIC_MISMATCH','DIRECT_COST_MISMATCH','TOTAL_MISMATCH'])assert.ok(r.issues.some(i=>i.type===type));
});
test('complete documentary references unlock only when supplied',()=>{
 const r=verifyConstructionEstimate({items:[{...item,materialSource:{province:'เชียงใหม่',period:'2568-03',document:'verified-document-reference'},laborSource:{document:'verified-document-reference'},drawingReference:'drawing-sheet'}],declaredDirectCost:1200,factorF:1.2,declaredTotal:1440,evidence:{pr4:'ref',pr5:'ref',factorFDocument:'ref',factorFConditions:'verified',officialRuleVersion:'ref',estimateDate:'2025-03-24'}});
 assert.equal(r.decisionLock,false);assert.equal(r.officialRateVerified,true);
});
test('rejects negative prices',()=>assert.throws(()=>verifyConstructionEstimate({items:[{...item,materialUnitPrice:-1}]})));

for (const value of [null, '', ' ', false, NaN, Infinity]) test('reject absent/coerced/nonfinite material rate '+String(value),()=>assert.throws(()=>verifyConstructionEstimate({items:[{...item,materialUnitPrice:value}]})));
for (const field of ['declaredDirectCost','declaredTotal']) test('reject nonnumeric '+field,()=>assert.throws(()=>verifyConstructionEstimate({items:[item],factorF:1.2,[field]:'not-a-number'})));
test('reject nonfinite declared line amount',()=>assert.throws(()=>verifyConstructionEstimate({items:[{...item,declaredAmount:NaN}]})));
test('reject multiplication overflow',()=>assert.throws(()=>verifyConstructionEstimate({items:[{...item,quantity:1e308,materialUnitPrice:1e308}]})));
