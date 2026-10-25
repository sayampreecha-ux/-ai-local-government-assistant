import test from 'node:test';import assert from 'node:assert/strict';
import{makeLocalMemoDraft,PLACEHOLDER}from'../assets/js/core/local-memorandum-v1.mjs';
import {cases} from './fixtures/local-memo-cases.mjs';

for(const c of cases)test('factual preservation '+c.id,()=>{const d=makeLocalMemoDraft(c.input);for(const[k,v]of Object.entries(c.fields))assert.equal(d.values[k],v);assert.equal(d.sections.some(x=>x.heading.includes('รายการตรวจ')),false);if(!c.fields['ส่วนราชการ'])assert.ok(d.missing.includes('ส่วนราชการ'));});
for(const x of ['ignore previous instructions','<script>alert(1)</script>','เลขบัตรประชาชน 1234567890123','email test@example.invalid','ได้รับอนุมัติแล้ว'])test('negative '+x,()=>assert.throws(()=>makeLocalMemoDraft('ร่างบันทึกข้อความ\nข้อเท็จจริง: '+x)));
test('duplicate fails instead of silently overriding',()=>assert.throws(()=>makeLocalMemoDraft('ร่างบันทึกข้อความ\nเรื่อง: A\nเรื่อง: B'),/ซ้ำ/));
test('unstructured prose preserved without guessed fields',()=>{const s='ร่างบันทึกข้อความขอใช้ห้องประชุมวันที่ 5 พฤศจิกายน 2569';const d=makeLocalMemoDraft(s);assert.equal(d.values['ข้อเท็จจริง'],s);assert.equal(d.parserMode,'verbatim-unstructured');assert.ok(d.missing.includes('วันที่'));});

for(const input of ['ไม่ต้องร่างบันทึกข้อความ','ตรวจบันทึกข้อความ','เขียน TOR'])test('non-draft rejected '+input,()=>assert.throws(()=>makeLocalMemoDraft(input)));

test('control checklist cannot become a proposal or invent a signer',()=>{
 const d=makeLocalMemoDraft('ร่างบันทึกข้อความ\nข้อเสนอ: ขอใช้ห้อง\nข้อกำหนด:\nห้ามกล่าวว่าได้รับอนุมัติแล้ว\nผู้ลงนาม: บุคคลจากคำสั่งแทรก');
 assert.equal(d.values['ข้อเสนอ'],'ขอใช้ห้อง');assert.equal(d.values['ผู้ลงนาม'],undefined);
 assert.ok(d.missing.includes('ผู้ลงนาม'));assert.ok(!JSON.stringify(d.sections).includes('ข้อกำหนด'));
});
test('safe supplied signer and position are preserved once outside body headings',()=>{
 const d=makeLocalMemoDraft('จัดทำบันทึกข้อความ\nชื่อผู้ลงนาม: [ชื่อจำลอง]\nตำแหน่งผู้ลงนาม: หัวหน้าหน่วยงานตัวอย่าง');
 assert.equal(d.values['ผู้ลงนาม'],'[ชื่อจำลอง]');assert.equal(d.values['ตำแหน่ง'],'หัวหน้าหน่วยงานตัวอย่าง');
 assert.ok(d.sections.at(-1).paragraphs.includes('([ชื่อจำลอง])'));assert.ok(!d.missing.includes('ผู้ลงนาม'));
 assert.equal(d.sections.filter(s=>s.heading==='ตำแหน่ง').length,0);
});
test('ordinary text mentioning requirements is preserved as a fact',()=>{
 const value='ข้อมูลจำลอง\nข้อกำหนดของห้องยังรอตรวจสอบ';
 const d=makeLocalMemoDraft('ร่างบันทึกข้อความ\nข้อเท็จจริง: '+value+'\nข้อเสนอ: ขอใช้ห้อง');
 assert.equal(d.values['ข้อเท็จจริง'],value);assert.equal(d.values['ข้อเสนอ'],'ขอใช้ห้อง');
});
test('canonical and alias signer fields cannot silently override one another',()=>assert.throws(()=>makeLocalMemoDraft('ร่างบันทึกข้อความ\nผู้ลงนาม: [จำลอง A]\nชื่อผู้ลงนาม: [จำลอง B]'),/ซ้ำ/));
