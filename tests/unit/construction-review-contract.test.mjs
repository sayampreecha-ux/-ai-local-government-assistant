import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const path of ['shared-context', 'prompt-registry', 'transaction-router', 'output-router', 'prompt-orchestrator']) {
  vm.runInNewContext(await readFile(`assets/js/core/${path}.js`, 'utf8'), sandbox);
}
const core = sandbox.window.GovPromptCore;
const cases = JSON.parse(await readFile('tests/fixtures/construction-qa/acceptance-cases.json', 'utf8'));
const make = question => core.createGovernmentPrompt({ question, context: core.createSharedContext({ facts: question, desiredOutput: question }) });

for (const entry of cases.filter(entry => entry.id.startsWith('TC'))) {
  test(`${entry.id}: construction evidence and calculation contract`, () => {
    const result = make(entry.question);
    assert.equal(result.taskPlan.action, 'verify');
    assert.equal(result.taskPlan.constructionReview, true);
    assert.ok(result.taskPlan.disciplines.includes('engineering'));
    assert.ok(result.taskPlan.disciplines.includes('procurement'));
    assert.ok(['MEDIUM', 'HIGH'].includes(result.taskPlan.riskLevel));
    assert.equal(result.qualityGates.evidenceRequired, true);
    assert.equal(result.qualityGates.decisionRequired, true);
    assert.equal(result.qualityGates.legalVersionRequired, true);
    for (const part of ['Answer First', 'GovPrompt Prompt Standard v7.1', 'Evidence Gate: ON', 'Decision Gate: ON', 'Legal Version Gate: ON', 'Official Source / Authority / Version', 'Partial Decision Lock: ON', 'Human Review', 'Audit Trace', 'ผลต่างมูลค่า = ผลต่างปริมาณ × ราคาต่อหน่วย', 'คำนวณ ปร.4 ใหม่', 'การคูณถูกไม่ได้แปลว่าเลือกอัตราถูก', 'ห้ามรับรองราคากลางหรือวินิจฉัยความผิดแทนคณะกรรมการ', 'ให้ AI ปลายทางค้นและอ่านต้นฉบับ', 'ห้ามอ้างว่าถอดแบบหรือตรวจหลักฐานแล้ว']) {
      assert.ok(result.prompt.includes(part), part);
    }
    assert.ok(result.prompt.includes(entry.question));
    assert.ok(result.prompt.includes('ห้ามรวมปริมาณต่างหน่วย'));
    assert.ok(result.prompt.includes('ตาราง C ต้องมีตัวเลขสองคอลัมน์แยก'));
    assert.ok(result.prompt.includes('ยอดรวม ปร.4 คำนวณตรงเดิมจึงต่าง 0 บาทไม่ได้ทำให้ผลต่างมูลค่าปริมาณเป็น 0 บาท'));
  });
}

for (const entry of cases.filter(entry => entry.id.startsWith('RG'))) {
  test(`${entry.id}: existing workflow remains outside construction review`, () => {
    const result = make(entry.question);
    assert.equal(result.taskPlan.constructionReview, undefined);
    assert.ok(result.prompt.includes(entry.question));
    assert.ok(!result.prompt.includes('Construction QA —'));
  });
}

test('quantity-only checks are MEDIUM; official rates and allegations are HIGH', () => {
  assert.equal(make(cases.find(entry => entry.id === 'TC02').question).taskPlan.riskLevel, 'MEDIUM');
  assert.equal(make(cases.find(entry => entry.id === 'TC09').question).taskPlan.riskLevel, 'HIGH');
  assert.equal(make(cases.find(entry => entry.id === 'TC12').question).taskPlan.riskLevel, 'HIGH');
});

test('universal task planner and supplied router decision are preserved', () => {
  const question = cases.find(entry => entry.id === 'TC02').question;
  const original = core.planUniversalTask(question);
  const route = Object.freeze({ moduleId: 'GP006', assistant: core.PROMPT_REGISTRY_BY_ID.GP006, modules: ['GP006'], transactionType: 'engineering' });
  const result = core.createGovernmentPrompt({ question, route });
  assert.equal(core.planUniversalTask(question).riskLevel, original.riskLevel);
  assert.equal(result.route, route);
});

test('unrelated materials, HR labor and construction PR do not gain construction locks', () => {
  for (const question of ['ตรวจราคาวัสดุสำนักงาน', 'ตรวจค่าแรงลูกจ้างสาธารณสุข', 'ร่างโปสเตอร์ประชาสัมพันธ์งานก่อสร้างถนน', 'ตรวจโครงการเรียนรู้เรื่องคอนกรีต']) {
    assert.equal(make(question).taskPlan.constructionReview, undefined, question);
  }
});
