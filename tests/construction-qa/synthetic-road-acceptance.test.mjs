import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyConstructionEstimate } from './official-rate-validator.mjs';

// SYNTHETIC DATA ONLY. Neither the unit prices nor Factor F are government-approved.
const evidence={pr4:'SYNTHETIC-PR4',pr5:'SYNTHETIC-PR5',factorFDocument:'SYNTHETIC-FACTOR-F',factorFConditions:'synthetic test only',officialRuleVersion:'SYNTHETIC',estimateDate:'2026-10-13'};
const base={quantity:150,materialUnitPrice:2200,laborUnitPrice:300,declaredAmount:375000,materialSource:{province:'SYNTHETIC',period:'SYNTHETIC',document:'SYNTHETIC-MATERIAL'},laborSource:{document:'SYNTHETIC-LABOR'},drawingReference:'SYNTHETIC-DRAWING'};
const run=(item=base,other={})=>verifyConstructionEstimate({items:[item],declaredDirectCost:375000,factorF:1.2,declaredTotal:450000,evidence,...other});

test('SYN01 correct arithmetic: 150 m3 x (2200+300) x 1.2',()=>{const r=run();assert.equal(r.directCost,375000);assert.equal(r.total,450000);assert.equal(r.arithmeticPass,true);assert.equal(r.decisionLock,false);});
test('SYN02 changed material price triggers mismatch',()=>{const r=run({...base,materialUnitPrice:2300});assert.ok(r.issues.some(i=>i.type==='ARITHMETIC_MISMATCH'));assert.equal(r.decisionLock,true);});
test('SYN03 changed concrete volume triggers mismatch',()=>{const r=run({...base,quantity:180});assert.ok(r.issues.some(i=>i.type==='ARITHMETIC_MISMATCH'));assert.equal(r.decisionLock,true);});
test('SYN04 changed Factor F triggers total mismatch',()=>{const r=run(base,{factorF:1.3});assert.ok(r.issues.some(i=>i.type==='TOTAL_MISMATCH'));assert.equal(r.decisionLock,true);});
test('SYN05 missing rate evidence triggers lock',()=>{const r=run({...base,materialSource:null});assert.ok(r.issues.some(i=>i.type==='MATERIAL_RATE_UNVERIFIED'));assert.equal(r.decisionLock,true);});
