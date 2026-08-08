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
assert.equal(result.prompt.includes('ค้นหาเอกสารที่เกี่ยวข้องทั้งหมด'), true);
assert.equal(result.prompt.includes('ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'), true);
assert.equal(result.prompt.includes('ห้ามสมมติเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา'), true);
assert.equal(result.prompt.includes('TOR.pdf'), true);
assert.equal(result.riskFlags.length > 0, true);

console.log('GovPrompt v7 Prompt Orchestrator verification passed.');
