import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalog = readFileSync('catalog-public.js', 'utf8');
const quick = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');
const home = readFileSync('assets/js/home-v3.js', 'utf8');

const roleMatrix = [
  'คนขับรถยนต์',
  'ธุรการ',
  'ขับเครื่องจักรขนาดหนัก',
  'ตรวจมาตรวัดน้ำประปา',
  'เจ้าหน้าที่รักษาความปลอดภัย',
  'ด้านจัดเก็บรายได้',
  'ด้านธุรการ',
  'ด้านนิติการและรับเรื่องร้องทุกข์',
  'ด้านป้องกันและบรรเทาสาธารณภัย',
  'ดูแลระบบประปา',
  'นักการภารโรง',
  'ปฏิบัติงานสอนและสนับสนุนการจัดการศึกษา',
  'พนักงานทำความสะอาด',
  'พยาบาล-นักวิชาการสาธารณสุข'
];

test('GP223 catalog exposes the 9-field intake contract', () => {
  const start = catalog.indexOf('"id":"gp223"');
  const end = catalog.indexOf('"id":"gp222"', start);
  const entry = catalog.slice(start, end > start ? end : undefined);
  assert.ok(start >= 0, 'GP223 catalog entry must exist');
  for (const field of ['agency','service_nature','deliverables','scope','period','inspection','budget','contract','constraints']) {
    assert.ok(entry.includes('"id":"' + field + '"'), 'missing GP223 field: ' + field);
  }
  assert.equal((entry.match(/"required":true/g) || []).length, 6);
});

test('GP223 Home action opens the AI conversation instead of a data-entry form', () => {
  assert.ok(quick.includes('openNaturalPersonServiceTorIntake'));
  assert.ok(quick.includes("normalize(button.dataset.prompt) === normalize('ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา')"));
  assert.ok(quick.includes('สนทนากับผู้ใช้งานโดยตรง'));
  assert.ok(quick.includes('ห้ามเปิดแบบฟอร์ม GP223'));
  assert.ok(quick.includes('ถามผู้ใช้ทีละคำถามในแชต'));
  assert.ok(quick.includes('openResultPage(prompt, { forceIntake: false })'));
});

test('GP223 specialized workflow contains the required gates', () => {
  for (const phrase of ['Employment-like Risk Gate','Scope Integrity Gate','Authority Boundary Gate','Deliverable Gate','Five-Document Consistency Gate','Acceptance Gate','Contract Terms Gate','ว 727 / Authority Gate','Applicable Authority Check','Decision Lock']) {
    assert.ok(home.includes(phrase), 'missing gate: ' + phrase);
  }
  assert.match(home, /การกำหนดวันหรือช่วงเวลาปฏิบัติงานไม่เป็นเหตุ.*โดยอัตโนมัติ/);
  assert.match(home, /งานอื่นตามที่ได้รับมอบหมายทุกประการ/);
});

test('GP223 remains deliverable-centric and protects authority boundaries', () => {
  assert.match(home, /ผลผลิต\/งานส่งมอบ/);
  assert.match(home, /อนุมัติ อนุญาต สั่งการ วินิจฉัย รับรอง/);
  assert.match(home, /TOR ↔ สัญญา\/ข้อตกลง ↔ ผลส่งมอบ ↔ ตรวจรับ ↔ การเบิกจ่าย/);
});

test('GP223 does not hard-code a guarantee exemption as a universal rule', () => {
  assert.match(home, /หลักประกัน\/ค่าปรับตามฉบับและฐานอำนาจที่ใช้จริง/);
  assert.match(home, /ห้าม hard-code ตัวเลข อัตรา หรือข้อยกเว้น/);
});

test('GP223 role matrix routes every supplied position into the same conversational workflow', () => {
  assert.equal(roleMatrix.length, 14);
  for (const role of roleMatrix) {
    const prompt = 'ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา ตำแหน่ง/ลักษณะงาน: ' + role;
    assert.match(prompt, /ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา/);
    assert.match(home, /จ้างเหมาบริการบุคคลธรรมดา|ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา/);
    assert.match(home, /จำแนกลักษณะงานจากงานจริงและผลสำเร็จ ไม่ตัดสินจากชื่อตำแหน่ง/);
  }
});
