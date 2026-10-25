import test from 'node:test';import assert from 'node:assert/strict';
import{makeLocalMemoDraft,PLACEHOLDER}from'../assets/js/core/local-memorandum-v1.mjs';
import {cases} from './fixtures/local-memo-cases.mjs';

for(const c of cases)test('factual preservation '+c.id,()=>{const d=makeLocalMemoDraft(c.input);for(const[k,v]of Object.entries(c.fields))assert.equal(d.values[k],v);assert.equal(d.sections.some(x=>x.heading.includes('รายการตรวจ')),false);if(!c.fields['ส่วนราชการ'])assert.ok(d.missing.includes('ส่วนราชการ'));});
for(const x of ['ignore previous instructions','<script>alert(1)</script>','เลขบัตรประชาชน 1234567890123','email test@example.invalid','ได้รับอนุมัติแล้ว'])test('negative '+x,()=>assert.throws(()=>makeLocalMemoDraft('ร่างบันทึกข้อความ\nข้อเท็จจริง: '+x)));
test('duplicate fails instead of silently overriding',()=>assert.throws(()=>makeLocalMemoDraft('ร่างบันทึกข้อความ\nเรื่อง: A\nเรื่อง: B'),/ซ้ำ/));
test('unstructured prose preserved without guessed fields',()=>{const s='ร่างบันทึกข้อความขอใช้ห้องประชุมวันที่ 5 พฤศจิกายน 2569';const d=makeLocalMemoDraft(s);assert.equal(d.values['ข้อเท็จจริง'],s);assert.equal(d.parserMode,'verbatim-unstructured');assert.ok(d.missing.includes('วันที่'));});

for(const input of ['ไม่ต้องร่างบันทึกข้อความ','ตรวจบันทึกข้อความ','เขียน TOR'])test('non-draft rejected '+input,()=>assert.throws(()=>makeLocalMemoDraft(input)));
