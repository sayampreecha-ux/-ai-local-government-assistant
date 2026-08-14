import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/output-router.js',
  'assets/js/core/prompt-orchestrator.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const core = sandbox.window.GovPromptCore;

const CASES = [
  ['บรรจุ 1 ม.ค. 2569 ครบ 8 เดือน มีสิทธิโบนัสดไหม', 'HIGH', true, true],
  ['บรรจุใหม่ครบ 6 เดือนมีสิทธิได้เงินประโยชน์ตอบแทนอื่นไหม', 'HIGH', true, true],
  ['เลื่อนเงินเดือนแล้วมีสิทธิโบนัสดไหม', 'HIGH', true, true],
  ['ค่าทำปกเบิกได้ไหม', 'HIGH', true, true],
  ['ค่าแท็กซี่ไปราชการเบิกได้หรือไม่', 'HIGH', true, true],
  ['เงินบำรุง รพ.สต. ใช้จัดอบรมได้ไหม', 'HIGH', true, true],
  ['เงินสะสมใช้ทำโครงการนี้ได้หรือไม่', 'HIGH', true, true],
  ['TOR ระบุยี่ห้อได้ไหม', 'HIGH', true, true],
  ['TOR กำหนดประสบการณ์ผู้ขายแบบนี้ได้หรือไม่', 'HIGH', true, true],
  ['e-bidding ไม่มีผู้ยื่นต้องทำอย่างไร', 'HIGH', false, false],
  ['จัดซื้อวิธีเฉพาะเจาะจงได้ไหม', 'HIGH', true, true],
  ['ราคากลางต้องทบทวนเมื่อใด', 'HIGH', false, false],
  ['อบจ. มีอำนาจทำโครงการนี้หรือไม่', 'HIGH', true, true],
  ['ระเบียบฉบับนี้ยังมีผลใช้บังคับหรือไม่', 'HIGH', true, false],
  ['หนังสือสั่งการฉบับล่าสุดใช้กับกรณีนี้ไหม', 'HIGH', true, false],
  ['ประกาศหลักเกณฑ์ปี 2566 ใช้กับเหตุปี 2569 ได้ไหม', 'HIGH', true, false],
  ['คำพิพากษานี้ใช้เป็นแนวกับกรณีปัจจุบันได้ไหม', 'HIGH', true, false],
  ['ข้าราชการถูกตั้งกรรมการวินัยต้องทำอย่างไร', 'HIGH', false, false],
  ['แต่งตั้งรักษาราชการแทนได้ไหม', 'HIGH', true, true],
  ['เลื่อนเงินเดือนย้อนหลังได้ไหม', 'HIGH', true, true],
  ['พนักงานจ้างมีสิทธิค่าตอบแทนนี้ไหม', 'HIGH', true, true],
  ['อนุมัติจ่ายเงินก่อนตรวจรับได้ไหม', 'HIGH', true, true],
  ['สั่งจ่ายโดยไม่มีเอกสารครบได้ไหม', 'HIGH', true, true],
  ['ข้อมูลสุขภาพผู้ป่วยส่งในแชตได้ไหม', 'HIGH', true, false],
  ['เลขบัตรประชาชนควรใส่ในเอกสารประชาสัมพันธ์ไหม', 'HIGH', true, false],
  ['ช่วยร่างหนังสือราชการตอบหน่วยงาน', 'MEDIUM', false, false],
  ['ช่วยทำบันทึกข้อความเสนอผู้บริหาร', 'MEDIUM', false, false],
  ['ขอขั้นตอนจัดประชุมสภา', 'MEDIUM', false, false],
  ['ขอแนวทางจัดโครงการชุมชน', 'MEDIUM', false, false],
  ['ช่วยสรุปประชุมให้ผู้บริหาร', 'MEDIUM', false, false],
  ['ช่วยทำโครงการอบรม', 'MEDIUM', false, false],
  ['ช่วยเขียนข่าวประชาสัมพันธ์', 'LOW', false, false],
  ['ทำโพสต์ Facebook งานวันเด็ก', 'LOW', false, false],
  ['ทำอินโฟกราฟิกประชาสัมพันธ์', 'LOW', false, false],
  ['ช่วยสรุปรายงาน 1 หน้า', 'LOW', false, false],
  ['ทำตารางเปรียบเทียบข้อมูล', 'LOW', false, false],
  ['คำนวณร้อยละจากตัวเลขที่ให้', 'LOW', false, false],
  ['เขียนคำกล่าวเปิดงาน', 'LOW', false, false],
  ['ทำ checklist งานพิธี', 'LOW', false, false],
  ['สรุปข้อความนี้ให้สั้นลง', 'LOW', false, false],
  ['ช่วยวางแผนกิจกรรมประชาชน', 'MEDIUM', false, false],
  ['ตรวจหนังสือราชการให้หน่อย', 'MEDIUM', false, false],
  ['กฎหมายใหม่มีผลวันไหน', 'HIGH', false, false],
  ['หลักเกณฑ์นี้ฉบับล่าสุดหรือยัง', 'HIGH', false, false],
  ['พัสดุชิ้นนี้ต้องขึ้นทะเบียนไหม', 'HIGH', true, true],
  ['งบประมาณรายการนี้โอนได้ไหม', 'HIGH', true, true],
  ['มีสิทธิขอรับเงินนี้หรือไม่', 'HIGH', true, true],
  ['ผู้มีอำนาจอนุมัติเรื่องนี้คือใคร', 'HIGH', true, true],
  ['ป.ป.ช. มีแนววินิจฉัยเรื่องนี้อย่างไร', 'HIGH', false, false],
  ['ตรวจ TOR และสรุปความเสี่ยงก่อนประกาศ', 'HIGH', false, false]
];

assert.equal(CASES.length, 50);

for (const [question, riskLevel, decisionRequired, multiConditionRequired] of CASES) {
  const context = core.createSharedContext({ facts: question, desiredOutput: question });
  const route = core.routeTransaction(context);
  const result = core.createGovernmentPrompt({ question, route, context });

  assert.equal(result.taskPlan.riskLevel, riskLevel, question);
  assert.equal(result.qualityGates.decisionRequired, decisionRequired, `${question} decision`);
  assert.equal(result.qualityGates.multiConditionRequired, multiConditionRequired, `${question} multi`);
  assert.equal(result.prompt.includes('GovPrompt Prompt Standard v7.1'), true, question);
  assert.equal(result.prompt.includes('Quality Gates — ต้องผ่านก่อนฟันธง'), true, question);

  if (riskLevel === 'HIGH') {
    assert.equal(result.qualityGates.evidenceRequired, true, `${question} evidence`);
    assert.equal(result.qualityGates.legalVersionRequired, true, `${question} version`);
    assert.equal(result.taskPlan.evidenceMode, 'verify-current-primary-source', `${question} evidenceMode`);
    assert.equal(result.prompt.includes('Evidence Gate: ก่อนฟันธงต้องยืนยันแหล่งปฐมภูมิ/ราชการ'), true, question);
    assert.equal(result.prompt.includes('Legal Version Gate: ตรวจวันมีผลใช้บังคับ'), true, question);
  }

  if (decisionRequired) {
    assert.equal(result.prompt.includes('✅ ได้ / ❌ ไม่ได้ / ⚠️ ได้โดยมีเงื่อนไข / 🔎 หลักฐานยังไม่พอที่จะฟันธง'), true, question);
  }

  if (multiConditionRequired) {
    assert.equal(result.prompt.includes('ห้ามสรุปสิทธิ อำนาจ การเบิกจ่าย การจัดซื้อจัดจ้าง หรือผลทางบุคคลจากเงื่อนไขเพียงข้อเดียว'), true, question);
  }
}

const bonus = (() => {
  const question = 'บรรจุ 1 ม.ค. 2569 ครบ 8 เดือน มีสิทธิโบนัสดไหม';
  const context = core.createSharedContext({ facts: question, desiredOutput: question });
  return core.createGovernmentPrompt({ question, route: core.routeTransaction(context), context });
})();

assert.equal(bonus.taskPlan.disciplines.includes('human-resources'), true);
assert.equal(bonus.taskPlan.riskLevel, 'HIGH');
assert.equal(bonus.qualityGates.decisionRequired, true);
assert.equal(bonus.qualityGates.multiConditionRequired, true);
assert.equal(bonus.qualityGates.legalVersionRequired, true);
assert.equal(bonus.qualityGates.evidenceRequired, true);
assert.equal(bonus.prompt.includes('ระบุเงื่อนไขที่มีสาระสำคัญทั้งหมดที่ค้นพบ'), true);
assert.equal(bonus.prompt.includes('ต้องจับคู่ “วันที่ของข้อเท็จจริง” กับ “กฎที่มีผลในวันนั้น”'), true);
assert.equal(bonus.prompt.includes('ห้ามใช้คำว่า “ได้แน่นอน/ไม่มีสิทธิแน่นอน”'), true);

console.log('GovPrompt Prompt Standard v7.1 Golden 50 passed.');
