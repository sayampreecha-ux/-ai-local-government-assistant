import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile('assets/js/home-v3.js', 'utf8');
const studio = await readFile('assets/js/core/document-studio-v1.js', 'utf8');
const worker = await readFile('src/search-worker-v2.js', 'utf8');
const regexLiteral = home.match(/const memoIntent = (\/.*?\/i)\.test\(originalRequest\);/);
assert.ok(regexLiteral, 'chat must use a narrowly scoped memorandum intent');
const intent = new RegExp(regexLiteral[1].slice(1, -2), 'i');

const fixtures = [
  "จัดทำบันทึกข้อความขออนุมัติโครงการอบรมบุคลากร วงเงินสมมุติ 30,000 บาท ระยะเวลา 1 วัน",
  "ร่างบันทึกข้อความขออนุมัติเดินทางไปอบรม",
  "ทำบันทึกข้อความขออนุมัติใช้ห้องประชุม",
  "เขียนบันทึกข้อความเสนอผู้บริหาร",
  "จัดทำหนังสือราชการเรื่องรายงานผล",
  "ร่างหนังสือราชการขอส่งเอกสาร",
  "ทำหนังสือราชการตอบข้อซักถาม",
  "เขียนหนังสือราชการแจ้งกำหนดการ",
  "จัดทำบันทึกข้อความเรื่องค่าใช้จ่าย",
  "ร่างบันทึกข้อความเสนอขอความเห็นชอบ",
  "ทำบันทึกข้อความรายงานตรวจสอบ",
  "เขียนบันทึกข้อความขออนุมัติแผน",
  "จัดทำหนังสือราชการตอบรับ",
  "ร่างหนังสือราชการส่งรายงาน",
  "ทำหนังสือราชการแจ้งเวียน",
  "ตรวจข้อกฎหมายได้ไหม",
  "คำนวณค่าเบี้ยเลี้ยง",
  "จัดทำ TOR ซื้อคอมพิวเตอร์",
  "แสดงราคากลาง",
  "วิเคราะห์ BOQ งานถนน",
  "สร้างอินโฟกราฟิก",
  "ทำสไลด์ประชาสัมพันธ์",
  "สรุปข่าววันนี้",
  "ขอรายงานความก้าวหน้าโครงการ",
  "วิเคราะห์ข้อทักท้วง สตง.",
  "ร่างรายงานการประชุม",
  "ทำรายงานการเงิน",
  "จัดทำงบประมาณ",
  "อยากรู้ระเบียบงานบุคคล",
  "ต้องการแนวทางขออนุมัติ"
];
for (const [i, input] of fixtures.entries()) {
  test('memorandum intent fixture ' + String(i + 1).padStart(2, '0'), () => {
    assert.equal(intent.test(input), i < 15, input);
  });
}

test('chat reuses the existing workflow rather than bypassing it', () => {
  assert.match(home, /memoIntent && workflowRuntime/);
  assert.match(home, /GovPromptDocumentStudio\?\.openWithText/);
  assert.match(home, /originalRequest: text/);
});
test('source and file are mutually exclusive and privacy is reconfirmed', () => {
  assert.match(studio, /if \(file && sourceText\)/);
  assert.match(studio, /querySelector\('\[data-privacy\]'\)\.checked = false/);
  assert.match(studio, /if \(!privacy\)/);
});
test('DOCX generation is through existing studio and stays human review', () => {
  assert.match(studio, /function makeDocx\(doc\)/);
  assert.match(studio, /\.docx/);
  assert.match(studio, /ไม่ใช่หนังสือที่ได้รับอนุมัติ/);
  assert.match(studio, /\[รอตรวจสอบ\]/);
});
test('server retains Cloudflare AI and consent/security gates', () => {
  assert.match(worker, /env\.AI\.run\(DOCUMENT_AI_MODEL/);
  assert.match(worker, /PRIVACY_CONFIRMATION_REQUIRED/);
  assert.match(worker, /SENSITIVE_DOCUMENT_BLOCKED/);
  assert.match(worker, /humanReviewRequired: true/);
});
