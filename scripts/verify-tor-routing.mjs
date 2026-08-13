import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const registry = Array.from({ length: 13 }, (_, i) => ({ moduleId: `GP${String(i + 1).padStart(3, '0')}`, title: `GP${String(i + 1).padStart(3, '0')}` }));
const sandbox = { window: { GovPromptCore: { PROMPT_REGISTRY: registry } } };
sandbox.window.GovPromptCore.routeRequest = request => Object.freeze({ primaryModule: 'GP011', moduleId: 'GP011', transactionType: 'executive', assistant: registry[10], modules: Object.freeze(['GP011']), confidence: 0.8, reason: `base:${request}` });
sandbox.window.GovPromptCore.routeTransaction = context => ({ ...sandbox.window.GovPromptCore.routeRequest(context?.facts || ''), context });
vm.runInNewContext(await readFile('assets/js/core/procurement-tor-routing-overrides.js', 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;
for (const query of [
  'ทีโออาร์',
  'ร่างทีโออาร์ซื้อรถส่วนกลาง',
  'ช่วยตรวจทีโออาร์ว่าล็อกสเปกไหม',
  'ทำ ที โอ อาร์ จ้างก่อสร้างถนน',
  'ร่าง TOR ซื้อคอมพิวเตอร์',
  'ช่วยร่างขอบเขตของงานจัดซื้อจัดจ้าง'
]) {
  const result = core.routeRequest(query);
  assert.equal(result.primaryModule, 'GP003', query);
  assert.equal(result.moduleId, 'GP003', query);
  assert.equal(result.transactionType, 'procurement', query);
}
assert.equal(core.routeRequest('คำกล่าวเปิดงาน').primaryModule, 'GP011');
console.log('GovPrompt TOR routing regression passed: Thai/English TOR requests -> GP003.');
