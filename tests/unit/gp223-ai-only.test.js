import test from 'node:test';
import assert from 'node:assert/strict';
import { loadGP223Core, requiredCases, verifyCase } from '../fixtures/gp223-test-helper.mjs';
const core = await loadGP223Core();
for (const item of requiredCases) test(`GP223 acceptance ${item.id}: ${item.question}`, () => verifyCase(core, item));

test('explicit workflow scope preserves other workflows even with service vocabulary', () => {
  assert.equal(core.isGP223Request({ question: 'จ้างเหมาบริการ', workflowId: 'GP003' }), false);
  assert.equal(core.createToolRoutingPlan({ question: 'TOR งานจ้างเหมาบริการ', workflowId: 'GP003' }).mode, 'web-when-needed');
  assert.equal(core.createToolRoutingPlan({ question: 'ค้นล่าสุด', workflowId: 'GP223' }).mode, 'ai-only');
});

test('destination search requires current explicit intent, not freshness or job duties', () => {
  for (const question of ['ค้น', 'ค้นล่าสุด', 'ตรวจสด', 'ช่วยค้นเว็บ ว 727', 'จ้างเหมาบัญชี ค้นข้อมูลล่าสุด']) {
    assert.equal(core.requestsGP223DestinationSearch(question), true, question);
  }
  for (const question of ['ล่าสุด', 'ยังมีผลไหม', 'ไม่ต้องค้น', 'ห้ามค้นล่าสุด', 'อย่าค้น', 'ค้นในเอกสารแนบ', 'ค้นคำในไฟล์', 'หน้าที่ค้นหาเอกสาร']) {
    assert.equal(core.requestsGP223DestinationSearch(question), false, question);
  }
});

test('generic intake asks one scope question, then reuses facts without requiring files', () => {
  const first = core.prepareGP223IntakeTurn({ text: 'ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา' });
  assert.ok(first.intakeQuestion);
  const second = core.prepareGP223IntakeTurn({ text: 'บัญชี', state: first.state });
  assert.equal(second.workflowId, 'GP223'); assert.equal(second.intakeQuestion, '');
  assert.match(second.caseFacts, /บัญชี/);
  const third = core.prepareGP223IntakeTurn({ text: '108000 บาท 12 เดือน', state: second.state });
  assert.equal(third.workflowId, 'GP223'); assert.equal(third.intakeQuestion, '');
  assert.match(third.caseFacts, /108000/);
});

test('topic changes end GP223 intake rather than disabling another workflow search', () => {
  const first = core.prepareGP223IntakeTurn({ text: 'จ้างเหมา' });
  for (const text of ['จัดซื้อคอมพิวเตอร์', 'ค่าเช่าบ้านล่าสุด', 'เงินบำรุง รพ.สต.', 'ทำลายเอกสาร', 'จ้างก่อสร้างถนน']) {
    const next = core.prepareGP223IntakeTurn({ text, state: first.state });
    assert.equal(next.workflowId, null, text); assert.equal(next.state, null);
  }
});

test('search command in earlier history does not authorize later destination search', () => {
  const context = core.createSharedContext({ facts: 'จ้างเหมาบัญชี ค้นล่าสุด\nร่างต่อ' });
  const result = core.createGovernmentPrompt({ question: 'ร่างต่อ', context, workflowId: 'GP223' });
  assert.equal(result.gp223.destinationSearchRequested, false);
  assert.match(result.prompt, /AI-only: ใช้ข้อมูลพิมพ์/);
});

test('travel and training lock only their respective rights; drafts remain available', () => {
  const travel = core.createGP223WorkflowPlan({ question: 'ผู้รับจ้างไปประชุมต่างจังหวัดเบิกได้ไหม' });
  assert.equal(travel.expenseKind, 'travel');
  assert.equal(travel.decisionLocks.some(lock => lock.issue === 'training-eligibility'), false);
  const training = core.createGP223WorkflowPlan({ question: 'ผู้รับจ้างเดินทางไปอบรม' });
  assert.equal(training.expenseKind, 'training');
  assert.equal(training.decisionLocks.some(lock => lock.issue === 'travel-expense'), false);
  const mixed = core.createGP223WorkflowPlan({ question: 'ผู้รับจ้างเดินทางไปประชุมแล้วอบรม' });
  assert.equal(mixed.expenseKind, 'mixed-separate-assessment');
  assert.equal(core.createGP223WorkflowPlan({ question: 'ผู้รับจ้างเดินทางไปประชุม ไม่ใช่ฝึกอบรม' }).expenseKind, 'travel');
  assert.equal(core.createGP223WorkflowPlan({ question: 'ผู้รับจ้างไปปฏิบัติงานเบิกได้ไหม' }).expenseKind, 'travel');
  for (const plan of [travel, training, mixed]) {
    assert.equal(plan.canDraft, true); assert.equal(plan.decisionLocks.every(lock => !lock.blocksDraft), true);
  }
});
