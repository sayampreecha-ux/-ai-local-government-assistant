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
  'สร้างภาพอวยพรวันสงกรานต์',
  'ทำปกวิสัยทัศน์',
  'ทำปกผลงาน',
  'ทำปกวิสัยทัศน์และผลงาน',
  'ออกแบบหน้าปกวิสัยทัศน์และผลงาน',
  'ทำปกสอบคัดเลือกผู้บริหาร',
  'ทำปกคัดเลือกตำแหน่งผู้บริหารท้องถิ่น',
  'สร้างปกนำเสนอวิสัยทัศน์องค์กร',
  'ออกแบบหน้าปกแนะนำตัวผู้สมัคร',
  'ทำโปรไฟล์ผลงานผู้บริหาร',
  'ทำภาพแนะนำตัวพร้อมผลงาน',
  'ทำโปสเตอร์แนะนำตัวผู้สมัคร',
  'ทำอินโฟผลงานเด่นของผู้บริหาร',
  'ทำหน้าปกประวัติและผลงาน',
  'ออกแบบปกผลงานสำหรับสอบสัมภาษณ์',
  'จัดทำปกวิสัยทัศน์สำหรับคัดเลือกผู้บริหาร',
  'สร้างหน้าปกนำเสนอผลงาน',
  'ทำปกแนะนำตัวและวิสัยทัศน์',
  'ออกแบบปกสอบพร้อมผลงานเด่น',
  'ทำปกผู้สมัครพร้อมวิสัยทัศน์องค์กร',
  'ทำหน้าปกผลงานแบบทันสมัย'
];

for (const query of prCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, 'GP012', `${query} should route to GP012`);
}

const fixedNegativeCases = [
  ['ช่วยร่างคำกล่าวเปิดโครงการ', 'GP011'],
  ['ช่วยร่างหนังสือราชการ', 'GP001'],
  ['ช่วยวิเคราะห์ข้อกฎหมาย', 'GP002'],
  ['เบิกค่าทำปกหนังสือได้ไหม', 'GP005'],
  ['ค่าทำอินโฟกราฟิกเบิกได้หรือไม่', 'GP005'],
  ['ค่าออกแบบโปสเตอร์จ่ายได้ไหม', 'GP005']
];

for (const [query, expected] of fixedNegativeCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.equal(routed.primaryModule, expected, `${query} should remain ${expected}`);
}

const mediaOnlyNegativeCases = [
  'ช่วยเขียนวิสัยทัศน์องค์กร',
  'วิเคราะห์วิสัยทัศน์องค์กร',
  'ร่างคำกล่าวนำเสนอวิสัยทัศน์'
];

for (const query of mediaOnlyNegativeCases) {
  const routed = routeRequest(query, { multiModule: false });
  assert.notEqual(routed.primaryModule, 'GP012', `${query} should not be forced to GP012`);
}

const negativeCount = fixedNegativeCases.length + mediaOnlyNegativeCases.length;
console.log(`GovPrompt media routing regression passed: ${prCases.length} PR/media cases + ${negativeCount} negative controls.`);
