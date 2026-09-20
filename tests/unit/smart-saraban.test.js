import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSarabanContext,
  inspectSarabanInput,
  classifySarabanRisk,
  buildSarabanPrompt,
  runSarabanQualityGate
} from '../../assets/js/features/smart-saraban.js';

test('creates a normalized Saraban context without mutating input arrays', () => {
  const attachments = ['doc-1'];
  const context = createSarabanContext({ subject: 'รายงานผล', attachments });
  assert.equal(context.taskId, 'GP-SB001');
  assert.deepEqual(context.attachments, ['doc-1']);
  assert.notEqual(context.attachments, attachments);
});

test('detects incomplete input and preserves missing fields', () => {
  const result = inspectSarabanInput(createSarabanContext({ subject: 'เรื่อง', purpose: 'เพื่อทราบ', facts: 'ข้อเท็จจริง' }));
  assert.equal(result.status, 'incomplete');
  assert.ok(result.missingFields.includes('owningUnit'));
  assert.equal(result.canDraft, true);
});

test('raises authority check for elevated administrative content without enabling GP live search', () => {
  const result = classifySarabanRisk(createSarabanContext({ subject: 'ขออนุมัติงบประมาณ' }));
  assert.equal(result.level, 'elevated');
  assert.equal(result.authorityCheckRequired, true);
  assert.equal(result.liveSearchRequired, false);
  assert.equal(result.userAISearchRecommended, true);
});

test('prompt routes all live official-source search to the user AI only', () => {
  const prompt = buildSarabanPrompt(createSarabanContext({ subject: 'ขออนุมัติจัดซื้อวัสดุสำนักงาน', purpose: 'เพื่อพิจารณา', facts: 'มีความจำเป็นต้องจัดซื้อ' }));
  assert.match(prompt, /GP นี้ไม่ค้นเว็บสด/u);
  assert.match(prompt, /AI ฝั่งผู้ใช้เป็นผู้ค้นสดทั้งหมด/u);
  assert.match(prompt, /เปิดอ่านเอกสารต้นฉบับจริง/u);
  assert.match(prompt, /Rule → Case → Later Rule → Conflict Check → Applicable Rule → Answer/u);
  assert.match(prompt, /ห้ามอ้างว่า GP หรือผู้ช่วยได้ค้นสดแล้ว/u);
  assert.doesNotMatch(prompt, /ให้ใช้ Web Search ของแพลตฟอร์มนี้ทันที/u);
  assert.match(prompt, /ผลลัพธ์ที่ต้องส่งกลับ/u);
});

test('quality gate requires human review and locks elevated decisions', () => {
  const context = createSarabanContext({ subject: 'ขออนุมัติจัดซื้อ', purpose: 'เพื่อพิจารณา', facts: 'ข้อเท็จจริง' });
  const result = runSarabanQualityGate(context, 'ร่างบันทึกข้อความ');
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.decisionLock, true);
  assert.equal(result.status, 'yellow');
});
