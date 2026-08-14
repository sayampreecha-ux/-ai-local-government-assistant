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
const question = 'ช่วยตรวจ TOR การจัดซื้อจัดจ้างและระบุความเสี่ยง';
const context = core.createSharedContext({ facts: question, desiredOutput: 'วิเคราะห์ความเสี่ยงและข้อเสนอแนะ' });
const route = core.routeTransaction(context);
assert.equal(route.moduleId, 'GP003');

const result = core.createGovernmentPrompt({
  question,
  route,
  context,
  attachments: [{ name: 'TOR.pdf' }]
});

assert.equal(typeof result.prompt, 'string');
assert.equal(result.prompt.includes('Universal Task Reasoning'), true);
assert.equal(result.prompt.includes('GovPrompt Prompt Standard v7.1'), true);
assert.equal(result.prompt.includes('Quality Gates — ต้องผ่านก่อนฟันธง'), true);
assert.equal(result.prompt.includes('ตรวจฉบับแก้ไข/ยกเลิก/ฉบับใหม่กว่า'), true);
assert.equal(result.prompt.includes('ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'), true);
assert.equal(result.prompt.includes('ห้ามสมมติเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา'), true);
assert.equal(result.prompt.includes('TOR.pdf'), true);
assert.equal(result.prompt.includes('Router เป็นเพียงคำแนะนำ'), true);
assert.equal(result.outputPlan.id, 'tor');
assert.equal(result.prompt.includes('เกณฑ์ตรวจรับวัดได้จริง'), true);
assert.equal(result.prompt.includes('จำกัดการแข่งขัน'), true);
assert.equal(result.taskPlan.routeIsAdvisory, true);
assert.equal(result.taskPlan.evidenceMode, 'verify-current-primary-source');
assert.equal(result.taskPlan.riskLevel, 'HIGH');
assert.equal(result.qualityGates.evidenceRequired, true);
assert.equal(result.qualityGates.legalVersionRequired, true);
assert.equal(result.riskFlags.length > 0, true);

const financeQuestion = 'วิเคราะห์ว่าเบิกค่าทำปกได้ไหม';
const financeContext = core.createSharedContext({ facts: financeQuestion, desiredOutput: financeQuestion });
const financeRoute = Object.freeze({
  moduleId: 'GP005',
  assistant: core.PROMPT_REGISTRY_BY_ID.GP005,
  modules: Object.freeze(['GP005']),
  transactionType: 'finance'
});
const financePrompt = core.createGovernmentPrompt({ question: financeQuestion, route: financeRoute, context: financeContext });
assert.equal(financePrompt.outputPlan.id, 'analysis');
assert.equal(financePrompt.prompt.includes('เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข'), true);
assert.equal(financePrompt.prompt.includes('ฐานอำนาจ เงื่อนไข เอกสารประกอบ'), true);
assert.equal(financePrompt.qualityGates.decisionRequired, true);
assert.equal(financePrompt.qualityGates.multiConditionRequired, true);

const legalQuestion = 'วิเคราะห์ข้อกฎหมายว่า อบจ. มีอำนาจทำเรื่องนี้หรือไม่';
const legalContext = core.createSharedContext({ facts: legalQuestion, desiredOutput: legalQuestion });
const legalRoute = Object.freeze({
  moduleId: 'GP002',
  assistant: core.PROMPT_REGISTRY_BY_ID.GP002,
  modules: Object.freeze(['GP002']),
  transactionType: 'legal'
});
const legalPrompt = core.createGovernmentPrompt({ question: legalQuestion, route: legalRoute, context: legalContext });
assert.equal(legalPrompt.prompt.includes('ทำได้ / ทำไม่ได้ / ยังฟันธงไม่ได้'), true);
assert.equal(legalPrompt.prompt.includes('สถานะฉบับล่าสุด'), true);
assert.equal(legalPrompt.prompt.includes('Legal Version Gate: ตรวจวันมีผลใช้บังคับ'), true);

const bonusQuestion = 'บรรจุ 1 ม.ค. 2569 ครบ 8 เดือน มีสิทธิโบนัสดไหม';
const bonusContext = core.createSharedContext({ facts: bonusQuestion, desiredOutput: bonusQuestion });
const bonusPrompt = core.createGovernmentPrompt({ question: bonusQuestion, context: bonusContext });
assert.equal(bonusPrompt.taskPlan.riskLevel, 'HIGH');
assert.equal(bonusPrompt.qualityGates.decisionRequired, true);
assert.equal(bonusPrompt.qualityGates.multiConditionRequired, true);
assert.equal(bonusPrompt.prompt.includes('ห้ามสรุปสิทธิ อำนาจ การเบิกจ่าย การจัดซื้อจัดจ้าง หรือผลทางบุคคลจากเงื่อนไขเพียงข้อเดียว'), true);
assert.equal(bonusPrompt.prompt.includes('ต้องจับคู่ “วันที่ของข้อเท็จจริง” กับ “กฎที่มีผลในวันนั้น”'), true);

const noRoute = core.createGovernmentPrompt({
  question: 'ช่วยทำโครงการกิจกรรมชุมชนให้พร้อมใช้',
  context: core.createSharedContext({ facts: 'ช่วยทำโครงการกิจกรรมชุมชนให้พร้อมใช้' })
});
assert.equal(noRoute.route.moduleId, 'GENERAL');
assert.equal(noRoute.taskPlan.deliverable, 'project');
assert.equal(noRoute.prompt.includes('หมวดดังกล่าวมีไว้ช่วยเลือกบริบท/เครื่องมือเท่านั้น'), true);
assert.equal(noRoute.prompt.includes('ส่งชิ้นงานหรือข้อสรุปที่ใช้ต่อได้ก่อน'), true);

const intentionallyWrongRoute = core.createGovernmentPrompt({
  question: 'ทำโปสเตอร์วันเด็ก',
  route,
  context: core.createSharedContext({ facts: 'ทำโปสเตอร์วันเด็ก' })
});
assert.equal(intentionallyWrongRoute.taskPlan.deliverable, 'public-content');
assert.equal(intentionallyWrongRoute.taskPlan.disciplines.includes('education'), true);
assert.equal(intentionallyWrongRoute.taskPlan.disciplines.includes('public-relations'), true);
assert.equal(intentionallyWrongRoute.prompt.includes('หาก Route ขัดกับเจตนาของผู้ใช้'), true);
assert.equal(intentionallyWrongRoute.prompt.includes('ยึดเจตนา ชิ้นงาน และหลักฐานที่งานนั้นต้องใช้เป็นหลัก'), true);

console.log('GovPrompt v7 Prompt Orchestrator verification passed with Prompt Standard v7.1 quality gates.');
await import('./verify-prompt-standard-v7-1-50.mjs');
