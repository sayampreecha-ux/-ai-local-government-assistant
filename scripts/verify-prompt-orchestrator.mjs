import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
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
assert.equal(result.prompt.includes('Universal Task Reasoning v7.1'), true);
assert.equal(result.prompt.includes('ตรวจฉบับแก้ไข/ยกเลิก/ฉบับใหม่กว่า'), true);
assert.equal(result.prompt.includes('ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'), true);
assert.equal(result.prompt.includes('ห้ามสมมติเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา'), true);
assert.equal(result.prompt.includes('TOR.pdf'), true);
assert.equal(result.prompt.includes('Router เป็นเพียงคำแนะนำ'), true);
assert.equal(result.taskPlan.routeIsAdvisory, true);
assert.equal(result.taskPlan.evidenceMode, 'verify-current-primary-source');
assert.equal(result.riskFlags.length > 0, true);

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

console.log('GovPrompt v7 Prompt Orchestrator verification passed with Universal Task Reasoning v7.1.');
