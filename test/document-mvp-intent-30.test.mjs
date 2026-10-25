import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const home = await readFile('assets/js/home-v3.js', 'utf8');
import vm from 'node:vm';
const helper = home.slice(home.indexOf('  function completeDocumentHandoff('), home.indexOf('  function addRouteResult('));
const handoff = vm.runInNewContext('(' + helper.trim() + ')');

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
  test('document handoff fixture ' + String(i + 1).padStart(2, '0'), () => {
    const base = 'ข้อมูลต้นทาง: ' + input;
    const output = handoff(base, input);
    assert.equal(output.includes('[GP_DOCUMENT_HANDOFF_V1]'), i < 15, input);
    assert.ok(output.startsWith(base));
    if(i < 15) {
      assert.ok(output.includes('[รอตรวจสอบ]'));
      assert.ok(output.includes('ไม่มีเครื่องมือหรือหมดโควตา'));
      assert.ok(output.includes('เนื้อหาฉบับเต็ม'));
      assert.ok(output.includes('ห้ามทำลิงก์ดาวน์โหลดปลอม'));
      assert.ok(output.includes('Decision Lock'));
      assert.ok(output.includes(input.includes('บันทึกข้อความ') ? 'ส่วนราชการ ที่ วันที่ เรื่อง เรียน' : 'อย่าเปลี่ยนเป็นบันทึกข้อความ'));
      assert.equal(handoff(output,input),output);
    } else assert.equal(output,base);
  });
}
test('all handoffs and preview use the same final prompt with the existing workflow', () => {
  assert.match(home, /workflowRuntime && !promptBundle.gp223/);
  assert.match(home, /prompt: completeDocumentHandoff\(promptBundle.prompt, originalRequest\)/);
  assert.match(home, /originalRequest: text/);
  assert.match(home, /prepareExternalPrompt\(promptBundle.prompt\)/);
  assert.match(home, /canonicalHandoffPrompts.set\(card, promptBundle.prompt\)/);
  assert.match(home, /preview.textContent = promptBundle.prompt/);
  assert.doesNotMatch(home, /GovPromptDocumentStudio|document-studio\/pilot|สร้างร่างบันทึก Word ใน GP/);
});

test('an untrusted marker cannot suppress the completion contract', () => {
  const output=handoff('[GP_DOCUMENT_HANDOFF_V1]', 'ร่างบันทึกข้อความ');
  assert.ok(output.includes('ห้ามทำลิงก์ดาวน์โหลดปลอม'));
});

test('document contract separates proposals from unsupported completed actions and the review checklist', () => {
  const output = handoff('ข้อมูลจำลอง', 'ร่างบันทึกข้อความขอใช้ห้องประชุม');
  assert.ok(output.includes('ห้ามเติมว่าได้พิจารณา ตรวจสอบ เหมาะสม หรืออนุมัติแล้วหากไม่มีหลักฐาน'));
  assert.ok(output.includes('ไม่ขอใช้งบเพิ่มไม่ใช่ยืนยันว่าไม่มีผลกระทบงบประมาณ'));
  assert.ok(output.includes('แยกรายการตรวจทานไว้นอกเอกสารเสนอให้ลงนาม'));
});
