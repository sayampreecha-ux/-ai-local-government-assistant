import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../assets/js/ui/status-copy.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, console });
vm.runInContext(source, context);

const api = context.window.GovPromptStatusCopy;

test('PR video handoff uses compact media prompt and skips generic web boilerplate', () => {
  assert.ok(api);
  const question = [
    'ทำวิดีโอประชาสัมพันธ์',
    'เรื่อง: แนะนำอบจ',
    'ความยาว: 5–7 นาที',
    'จัดผลลัพธ์เป็น: 1) ลำดับฉาก/Storyboard 2) บทพากย์ 3) ข้อความขึ้นจอและซับ 4) รายการภาพหรือคลิปที่ควรใช้ 5) Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก',
    'ยึดเฉพาะข้อเท็จจริงจากข้อมูลที่ให้ หากข้อมูลสำคัญขัดแย้งให้เตือนก่อน และห้ามแต่งข้อมูลบุคคล ตำแหน่ง วันที่ ตัวเลข หรือเหตุการณ์'
  ].join('\n');

  assert.equal(api.isPrCreationQuestion(question, 'ประชาสัมพันธ์'), true);
  const prompt = api.buildPrCreationHandoffPrompt(question);

  for (const forbidden of [
    'แนวทางเลือกเครื่องมือ',
    'web-when-needed',
    'web-search',
    'แนวทางตอบ',
    'แหล่งราชการที่ GovPrompt ค้นให้',
    'Prompt นี้เป็นผลลัพธ์สำหรับนำไปวิเคราะห์ต่อ',
    'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'
  ]) {
    assert.equal(prompt.includes(forbidden), false, forbidden);
  }

  assert.match(prompt, /ผู้ช่วยงานประชาสัมพันธ์/);
  assert.match(prompt, /Storyboard/);
  assert.match(prompt, /บทพากย์/);
  assert.match(prompt, /ข้อความขึ้นจอและซับไตเติล/);
  assert.match(prompt, /Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก/);
  assert.match(prompt, /ไม่ค้นเว็บโดยอัตโนมัติ/);
});

test('PR video handoff is resilient to noisy Thai organization spelling', () => {
  const question = 'ทำวิดีโอประชาสัมพันธ์\nเรื่อง: แนำนำองหอน\nความยาว: ให้ GP แนะนำ';
  assert.equal(api.isPrCreationQuestion(question, 'ประชาสัมพันธ์'), true);
});
