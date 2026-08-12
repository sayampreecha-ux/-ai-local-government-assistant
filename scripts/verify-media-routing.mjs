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

const prCases = [
  'ทำการ์ดวันแม่',
  'ช่วยทำการ์ดอวยพรวันพ่อ',
  'สร้างการ์ดปีใหม่ให้หน่วยงาน',
  'ออกแบบโปสเตอร์วันเด็ก',
  'ทำภาพประชาสัมพันธ์วันสำคัญ',
  'ทำอินโฟกราฟิกประชาสัมพันธ์โครงการ',
  'เขียนโพสต์ประชาสัมพันธ์กิจกรรม',
  'ทำแคปชันวันแม่',
  'ทำข่าวประชาสัมพันธ์เปิดโครงการ',
  'สร้างภาพอวยพรวันสงกรานต์'
];

for (const query of prCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, 'GP012', `${query} should route to GP012`);
}

const negativeCases = [
  ['ช่วยร่างคำกล่าวเปิดโครงการ', 'GP011'],
  ['ช่วยร่างหนังสือราชการ', 'GP001'],
  ['ช่วยวิเคราะห์ข้อกฎหมาย', 'GP002']
];

for (const [query, expected] of negativeCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, expected, `${query} should remain ${expected}`);
}

console.log(`GovPrompt media routing regression passed: ${prCases.length} PR/media cases + ${negativeCases.length} negative controls.`);
