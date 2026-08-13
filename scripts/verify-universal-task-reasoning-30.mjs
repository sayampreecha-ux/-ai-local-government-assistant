import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-orchestrator.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;
assert.equal(core.UNIVERSAL_TASK_REASONING_VERSION, '7.1');
assert.equal(typeof core.planUniversalTask, 'function');

const cases = [
  ['ร่างหนังสือขอความร่วมมือประชาสัมพันธ์โครงการ', 'draft', 'official-document', 'records'],
  ['ทำโครงการวันเด็ก', 'draft', 'project', 'education'],
  ['ทำโครงการบวชสามเณรภาคฤดูร้อน', 'draft', 'project', 'education'],
  ['ทำโครงการสัปดาห์วิทยาศาสตร์', 'draft', 'project', 'education'],
  ['จัดการแข่งขันกีฬาเยาวชน', 'answer', 'general-answer', 'education'],
  ['ร่าง TOR ซื้อรถส่วนกลาง', 'draft', 'procurement', 'procurement'],
  ['ตรวจ TOR ว่าล็อกสเปกไหม', 'verify', 'procurement', 'procurement'],
  ['วิเคราะห์ระเบียบเบิกค่าเดินทางล่าสุด', 'analyze', 'finance', 'finance'],
  ['เบิกค่าแท็กซี่ได้ไหม', 'analyze', 'finance', 'finance'],
  ['สรุปงบประมาณแต่ละโครงการเป็นตาราง', 'summarize', 'project', 'planning-budget'],
  ['ทำตารางรายการเบิกจ่าย', 'create', 'finance', 'finance'],
  ['ร่างคำกล่าวเปิดงานวันเด็ก', 'draft', 'speech', 'education'],
  ['ทำโปสเตอร์งานวันเด็ก', 'create', 'public-content', 'public-relations'],
  ['ทำปกวิสัยทัศน์ผู้บริหาร', 'create', 'public-content', 'public-relations'],
  ['เขียนวิสัยทัศน์ผู้บริหาร', 'answer', 'general-answer', 'executive'],
  ['วิเคราะห์ข้อกฎหมายการใช้เงินสะสม', 'analyze', 'finance', 'legal'],
  ['ตรวจเอกสารเบิกจ่ายก่อนเสนออนุมัติ', 'verify', 'finance', 'finance'],
  ['วางแผนซ่อมถนนหลังน้ำท่วม', 'plan', 'general-answer', 'engineering'],
  ['สรุปปัญหาหน้างานก่อสร้างเสนอผู้บริหาร', 'summarize', 'general-answer', 'engineering'],
  ['ร่างบันทึกขอเพิ่มอัตรากำลัง', 'draft', 'official-document', 'human-resources'],
  ['วิเคราะห์กรณีลาป่วยไม่มีใบรับรองแพทย์', 'analyze', 'general-answer', 'human-resources'],
  ['ทำโครงการส่งเสริมสุขภาพผู้สูงอายุ', 'draft', 'project', 'public-health'],
  ['ตรวจการจัดซื้อยาและเวชภัณฑ์', 'verify', 'procurement', 'public-health'],
  ['สรุปญัตติประชุมสภาท้องถิ่น', 'summarize', 'general-answer', 'council'],
  ['ร่างข่าวประชาสัมพันธ์เปิดศูนย์บริการ', 'draft', 'public-content', 'public-relations'],
  ['ตรวจสอบภายในเอกสารเบิกจ่ายมีความเสี่ยงอะไร', 'verify', 'finance', 'audit'],
  ['ทำ executive summary โครงการ 1 หน้า', 'draft', 'project', 'executive'],
  ['คำนวณร้อยละผลการดำเนินงาน', 'calculate', 'general-answer', null],
  ['ระเบียบนี้ยังใช้ได้หรือไม่', 'analyze', 'legal-analysis', 'legal'],
  ['วันนี้ทำอะไรบ้าง', 'answer', 'general-answer', null]
];

for (const [question, action, deliverable, discipline] of cases) {
  const plan = core.planUniversalTask(question);
  assert.equal(plan.action, action, `${question}: action`);
  assert.equal(plan.deliverable, deliverable, `${question}: deliverable`);
  assert.equal(plan.routeIsAdvisory, true, `${question}: route advisory`);
  if (discipline) assert.ok(plan.disciplines.includes(discipline), `${question}: discipline ${discipline}`);
}

for (const question of ['ระเบียบนี้ยังใช้ได้หรือไม่', 'วิเคราะห์ระเบียบเบิกค่าเดินทางล่าสุด', 'ร่าง TOR ซื้อรถส่วนกลาง']) {
  assert.equal(core.planUniversalTask(question).evidenceMode, 'verify-current-primary-source', `${question}: evidence freshness`);
}

const context = core.createSharedContext({ facts: 'ทำโครงการบวชสามเณร', desiredOutput: 'ร่างโครงการพร้อมใช้' });
const bundle = core.createGovernmentPrompt({ question: 'ทำโครงการบวชสามเณร', route: null, context });
assert.equal(bundle.route.moduleId, 'GENERAL');
assert.equal(bundle.taskPlan.deliverable, 'project');
assert.ok(bundle.prompt.includes('Universal Task Reasoning v7.1'));
assert.ok(bundle.prompt.includes('Router เป็นเพียงคำแนะนำ'));
assert.ok(bundle.prompt.includes('ส่งชิ้นงานหรือข้อสรุปที่ใช้ต่อได้ก่อน'));
assert.ok(bundle.prompt.includes('ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'));

console.log(`GovPrompt Universal Task Reasoning v7.1 passed: ${cases.length} real-work cases.`);
