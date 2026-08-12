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

const cases = [
  ['วันนี้ทำอะไรบ้าง', 'GP011'],
  ['ช่วยร่างหนังสือแจ้งกำหนดการลงพื้นที่ตรวจงาน', 'GP001'],
  ['ช่วยร่าง TOR จัดซื้อโดรนดับไฟป่า', 'GP003'],
  ['แท็กซี่พะเยาเชียงรายเบิกได้ไหม', 'GP005'],
  ['น้ำท่วมถนนขาดขอใช้เงินสำรองจ่ายซ่อมชั่วคราว', 'GP004'],
  ['ผู้รับจ้างขอเปลี่ยนวัสดุในสัญญาเป็นเทียบเท่าได้ไหม', 'GP003'],
  ['ทำปกวิสัยทัศน์และผลงานสอบคัดเลือกผู้บริหาร', 'GP012'],
  ['ร่างคำกล่าวรายงานโครงการอบรมปุ๋ยอินทรีย์', 'GP011'],
  ['เบิกค่าใช้จ่ายกิจกรรม อสม. ใช้เงินอะไร', 'GP008'],
  ['ช่วยตรวจ TOR และระบุความเสี่ยง', 'GP003']
];

let pass = 0;
const failures = [];
for (const [query, expected] of cases) {
  const routed = routeRequest(query, { multiModule: false });
  if (routed.primaryModule === expected) pass += 1;
  else failures.push({ query, expected, actual: routed.primaryModule, confidence: routed.confidence });
}

console.log(`GovPrompt Pilot Real 10: ${pass}/${cases.length} passed`);
if (failures.length) {
  console.log('\nFailures:');
  for (const item of failures) console.log(`expected=${item.expected} actual=${item.actual} confidence=${Number(item.confidence).toFixed(3)} :: ${item.query}`);
}
assert.equal(cases.length, 10, 'pilot fixture must contain exactly 10 cases');
assert.equal(failures.length, 0, `${failures.length} of 10 pilot real-use cases failed`);
console.log('GovPrompt pilot real-use 10 verification passed.');
