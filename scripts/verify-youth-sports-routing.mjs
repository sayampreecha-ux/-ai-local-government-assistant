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
  'assets/js/core/hybrid-real-world-overrides.js',
  'assets/js/core/media-routing-overrides.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const { routeRequest } = sandbox.window.GovPromptCore;

const educationCases = [
  'จัดการแข่งขันกีฬา',
  'จัดแข่งกีฬาเยาวชน',
  'จัดการแข่งขันกีฬาเยาวชน',
  'จัดกิจกรรมกีฬาเด็ก',
  'จัดกีฬานักเรียน',
  'จัดกีฬาประชาชน',
  'จัดงานวันเด็ก',
  'จัดกิจกรรมวันเด็กแห่งชาติ',
  'งานวันเด็ก',
  'กีฬาเยาวชน'
];

for (const query of educationCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, 'GP009', `${query} should route to GP009`);
}

const controls = [
  ['ร่างคำกล่าวเปิดการแข่งขันกีฬาเยาวชน', 'GP011'],
  ['ร่างคำกล่าวเปิดงานวันเด็ก', 'GP011'],
  ['ทำโปสเตอร์งานวันเด็ก', 'GP012'],
  ['ทำโพสต์ประชาสัมพันธ์การแข่งขันกีฬาเยาวชน', 'GP012'],
  ['จัดซื้ออุปกรณ์กีฬา', 'GP003']
];

for (const [query, expected] of controls) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, expected, `${query} should remain ${expected}`);
}

console.log(`GovPrompt youth/sports routing regression passed: ${educationCases.length} GP009 cases + ${controls.length} cross-domain controls.`);
