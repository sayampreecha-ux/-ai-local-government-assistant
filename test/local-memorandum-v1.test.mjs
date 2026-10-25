import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalMemoDraft,PLACEHOLDER} from '../assets/js/core/local-memorandum-v1.mjs';
const base = 'จัดทำบันทึกข้อความ\nส่วนราชการ: หน่วยงานจำลอง\nที่: ทดสอบ 002/2569\nวันที่: 25 ตุลาคม 2569\nเรื่อง: ขอใช้ห้องประชุม\nเรียน: หัวหน้าหน่วยงานตัวอย่าง\nข้อเท็จจริง: จัดกิจกรรมวันที่ 5 พฤศจิกายน 2569 เวลา 09.00 น.';
test('preserve all supplied facts',()=>{const d=makeLocalMemoDraft(base);assert.match(JSON.stringify(d),/ทดสอบ 002\/2569/);assert.match(JSON.stringify(d),/5 พฤศจิกายน 2569/);assert.equal(d.reviewRequired,true);});
test('missing values are never invented',()=>{const d=makeLocalMemoDraft('ร่างบันทึกข้อความ\nเรื่อง: ทดสอบ');assert.ok(d.missing.includes('ส่วนราชการ'));assert.ok(JSON.stringify(d).includes(PLACEHOLDER));});
test('reject unsupported completion claims',()=>assert.throws(()=>makeLocalMemoDraft(base+'\nได้รับอนุมัติแล้ว'),/หลักฐาน/));
test('reject other documents and oversized input',()=>{assert.throws(()=>makeLocalMemoDraft('เขียน TOR'));assert.throws(()=>makeLocalMemoDraft('บันทึกข้อความ'+'ก'.repeat(12001)));});


const fields = ['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน','ข้อเท็จจริง','ข้อพิจารณา','ข้อเสนอ'];
for (let index = 0; index < 30; index += 1) {
  test('synthetic memorandum field case '+String(index+1).padStart(2,'0'),()=>{
    const omitted = fields[index % fields.length];
    const lines = fields.filter(label => label !== omitted).map(label => label+': ข้อมูลจำลอง'+index);
    const result = makeLocalMemoDraft('ร่างบันทึกข้อความ\\n'+lines.join('\\n'));
    assert.equal(JSON.stringify(result).includes('ข้อมูลจำลอง'+index),true);
    if (['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน','ข้อเท็จจริง'].includes(omitted)) assert.ok(result.missing.includes(omitted));
    assert.equal(result.reviewRequired,true);
  });
}
