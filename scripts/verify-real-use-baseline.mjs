import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
  'assets/js/core/tool-routing-policy.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const core = sandbox.window.GovPromptCore;
const cases = [
  { q: 'ช่วยร่างหนังสือราชการแจ้งกำหนดการประชุม', moduleId: 'GP001', mode: 'ai-only', tools: ['ai-reasoning'] },
  { q: 'ช่วยร่าง TOR จัดซื้อครุภัณฑ์ พร้อมตรวจความเสี่ยงล็อกสเปก', moduleId: 'GP003', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ค่าแท็กซี่ไปราชการเบิกได้ไหม', moduleId: 'GP005', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ช่วยวิเคราะห์ข้อกฎหมายล่าสุดเรื่องอำนาจขององค์กรปกครองส่วนท้องถิ่น', moduleId: 'GP002', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] },
  { q: 'ช่วยตรวจขั้นตอน วิธีการ และเงื่อนไขการจัดซื้อจัดจ้างภาครัฐ', moduleId: 'GP003', mode: 'web-when-needed', tools: ['web-search', 'ai-reasoning'] }
];

for (const testCase of cases) {
  const routed = core.routeRequest(testCase.q, { multiModule: false });
  assert.equal(routed.primaryModule, testCase.moduleId, `${testCase.q}: wrong module`);

  const plan = core.createToolRoutingPlan({ question: testCase.q });
  assert.equal(plan.mode, testCase.mode, `${testCase.q}: wrong tool mode`);
  for (const tool of testCase.tools) assert.equal(plan.tools.includes(tool), true, `${testCase.q}: missing ${tool}`);
  assert.equal(plan.tools.at(-1), 'ai-reasoning', `${testCase.q}: AI reasoning must finish workflow`);
}

const [index, privacyGuard, home, statusCopy] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('assets/js/core/privacy-guard.js', 'utf8'),
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('assets/js/ui/status-copy.js', 'utf8')
]);

assert.match(index, /official-search-connector\.js/);
assert.match(index, /privacy-guard\.js/);
assert.match(index, /tool-routing-policy\.js/);
assert.match(index, /status-copy\.js/);
assert.match(privacyGuard, /sanitizeExternalContent/);
assert.doesNotMatch(home, /officialSearchConnector\.search/);
assert.match(home, /delegated-user-ai/);
assert.match(home, /ให้ AI ของผู้ใช้ค้นเว็บสด/);
assert.match(statusCopy, /เปิดใน ChatGPT/);
assert.match(statusCopy, /เปิดใน Gemini/);
assert.match(statusCopy, /hideTechnicalSearchStatus/);

console.log(`GovPrompt V7 real-use baseline verified: ${cases.length}/5 priority workflows, router + user-AI web-search delegation + privacy + handoff.`);
