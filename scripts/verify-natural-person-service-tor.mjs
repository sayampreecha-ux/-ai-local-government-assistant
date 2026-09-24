import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const catalog = readFileSync('catalog-public.js', 'utf8');
const quick = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');
const home = readFileSync('assets/js/home-v3.js', 'utf8');

test('GP223 catalog keeps the 9-field intake contract', () => {
  const start = catalog.indexOf('"id":"gp223"');
  const end = catalog.indexOf('"id":"gp222"', start);
  const entry = catalog.slice(start, end > start ? end : undefined);
  assert.ok(start >= 0, 'GP223 catalog entry must exist');
  const fieldsMatch = entry.match(/"formFields":(\[.*?\]),"status":"APPROVED","version":"1.0"/);
  assert.ok(fieldsMatch, 'GP223 catalog version 1.1 must expose formFields');
  const fields = JSON.parse(fieldsMatch[1]);
  assert.deepEqual(fields.map(field => field.id), ['agency','service_nature','deliverables','scope','period','inspection','budget','contract','constraints']);
  assert.equal(fields.filter(field => field.required).length, 6);
});

test('GP223 Home action opens the structured intake', () => {
  assert.match(quick, /openNaturalPersonServiceTorIntake/);
  assert.match(quick, /normalize\(button\.dataset\.prompt\).*ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา/);
  assert.match(quick, /window\.GOVPROMPT_CATALOG/);
  assert.match(quick, /openResultPage\(lines, \{ forceIntake: false \}\)/);
});

test('GP223 specialized workflow contains the required gates', () => {
  for (const phrase of ['Employment-like Risk Gate','Scope Integrity Gate','Authority Boundary Gate','Deliverable Gate','Five-Document Consistency Gate','Acceptance Gate','Contract Terms Gate','ว 727 / Authority Gate','Applicable Authority Check','Decision Lock']) {
    assert.ok(home.includes(phrase), `missing gate: ${phrase}`);
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
