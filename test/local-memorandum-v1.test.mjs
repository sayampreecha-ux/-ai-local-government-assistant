import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalMemoDraft,PLACEHOLDER} from '../assets/js/core/local-memorandum-v1.mjs';
const base = 'จัดทำบันทึกข้อความ\nส่วนราชการ: หน่วยงานจำลอง\nที่: ทดสอบ 002/2569\nวันที่: 25 ตุลาคม 2569\nเรื่อง: ขอใช้ห้องประชุม\nเรียน: หัวหน้าหน่วยงานตัวอย่าง\nข้อเท็จจริง: จัดกิจกรรมวันที่ 5 พฤศจิกายน 2569 เวลา 09.00 น.';
test('preserve all supplied facts',()=>{const d=makeLocalMemoDraft(base);assert.match(JSON.stringify(d),/ทดสอบ 002\/2569/);assert.match(JSON.stringify(d),/5 พฤศจิกายน 2569/);assert.equal(d.reviewRequired,true);});
test('missing values are never invented',()=>{const d=makeLocalMemoDraft('ร่างบันทึกข้อความ\nเรื่อง: ทดสอบ');assert.ok(d.missing.includes('ส่วนราชการ'));assert.ok(JSON.stringify(d).includes(PLACEHOLDER));});
test('reject unsupported completion claims',()=>assert.throws(()=>makeLocalMemoDraft(base+'\nได้รับอนุมัติแล้ว'),/หลักฐาน/));
test('reject other documents and oversized input',()=>{assert.throws(()=>makeLocalMemoDraft('เขียน TOR'));assert.throws(()=>makeLocalMemoDraft('บันทึกข้อความ'+'ก'.repeat(12001)));});
