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
  'assets/js/core/education-event-routing-overrides.js',
  'assets/js/core/media-routing-overrides.js'
]) {
  vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
}

const { routeRequest } = sandbox.window.GovPromptCore;

const educationCases = [
  'โครงการสัปดาห์วิทยาศาสตร์',
  'จัดกิจกรรมวันวิทยาศาสตร์แห่งชาติ',
  'โครงการบวชสามเณร',
  'จัดโครงการบรรพชาสามเณรภาคฤดูร้อน',
  'โครงการบรรพชาอุปสมบทเยาวชน',
  'จัดค่ายคุณธรรมเยาวชน',
  'โครงการอบรมคุณธรรมเยาวชน'
];

for (const query of educationCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, 'GP009', `${query} should route to GP009`);
}

const controls = [
  ['ร่างคำกล่าวเปิดโครงการบวชสามเณร', 'GP011'],
  ['ทำโปสเตอร์โครงการบวชสามเณร', 'GP012'],
  ['ทำโพสต์ประชาสัมพันธ์โครงการบวชสามเณร', 'GP012'],
  ['จัดซื้อของใช้สำหรับโครงการบวชสามเณร', 'GP003']
];

for (const [query, expected] of controls) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, expected, `${query} should remain ${expected}`);
}

console.log(`GovPrompt education event routing passed: ${educationCases.length} GP009 cases + ${controls.length} controls.`);
