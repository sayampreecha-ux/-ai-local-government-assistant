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
  'assets/js/core/procurement-tor-routing-overrides.js',
  'assets/js/core/media-routing-overrides.js',
  'assets/js/core/router-real-query-hotfix.js',
  'assets/js/core/tool-routing-policy.js',
  'assets/js/core/agent-governance-policy.js',
  'assets/js/core/output-router.js',
  'assets/js/core/prompt-orchestrator.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;

const cases = [
  { q: 'ร่างหนังสือขอความอนุเคราะห์ใช้ห้องประชุม', route: 'GP001' },
  { q: 'ร่างบันทึกข้อความแจ้งกำหนดลงพื้นที่ตรวจงาน', route: 'GP001' },
  { q: 'วิเคราะห์ข้อกฎหมายว่า อบจ. มีอำนาจทำเรื่องนี้หรือไม่', route: 'GP002', fresh: true },
  { q: 'ระเบียบนี้ยังใช้บังคับอยู่ไหม', route: 'GP002', fresh: true },
  { q: 'ร่าง TOR ซื้อรถส่วนกลาง', route: 'GP003', fresh: true },
  { q: 'ร่างทีโออาร์จัดซื้อคอมพิวเตอร์', route: 'GP003', fresh: true },
  { q: 'ตรวจ ที โอ อาร์ ว่าล็อกสเปกหรือไม่', route: 'GP003', fresh: true },
  { q: 'จัดทำขอบเขตของงานจ้างปรับปรุงถนน', route: 'GP003', fresh: true },
  { q: 'ขอใช้เงินสำรองจ่ายซ่อมถนนน้ำท่วมฉุกเฉิน', route: 'GP004', fresh: true },
  { q: 'ทำโครงการอบรม AI เจ้าหน้าที่ งบ 300000 บาท', route: 'GP004' },
  { q: 'แท็กซี่พะเยาเชียงรายเบิกได้ไหม', route: 'GP005', fresh: true },
  { q: 'ตรวจเอกสารเบิกจ่ายก่อนเสนออนุมัติ', route: 'GP005', fresh: true },
  { q: 'ลาป่วยเกินสามวันต้องมีใบรับรองแพทย์ไหม', route: 'GP006' },
  { q: 'ร่างบันทึกขอเพิ่มอัตรากำลัง', route: 'GP006' },
  { q: 'ถนนคอนกรีตแตกร้าวระหว่างประกันทำอย่างไร', route: 'GP007' },
  { q: 'สรุปปัญหาหน้างานก่อสร้างเสนอผู้บริหาร', route: 'GP007' },
  { q: 'เงินบำรุง รพ.สต. ซื้อครุภัณฑ์ได้ไหม', route: 'GP008', fresh: true },
  { q: 'ทำโครงการส่งเสริมสุขภาพผู้สูงอายุ', route: 'GP008' },
  { q: 'จัดการแข่งขันกีฬาเยาวชน', route: 'GP009' },
  { q: 'โครงการบวชสามเณรภาคฤดูร้อน', route: 'GP009' },
  { q: 'โครงการสัปดาห์วิทยาศาสตร์', route: 'GP009' },
  { q: 'ตรวจสอบภายในเอกสารเบิกจ่ายมีความเสี่ยงอะไร', route: 'GP010', fresh: true },
  { q: 'ประเมินการควบคุมภายในงานพัสดุ', route: 'GP010', fresh: true },
  { q: 'ร่างคำกล่าวเปิดงานวันเด็ก', route: 'GP011' },
  { q: 'ทำ executive summary โครงการ 1 หน้าเสนอผู้บริหาร', route: 'GP011' },
  { q: 'ทำปกวิสัยทัศน์และผลงาน', route: 'GP012' },
  { q: 'ทำโพสต์ประชาสัมพันธ์การแข่งขันกีฬาเยาวชน', route: 'GP012' },
  { q: 'สรุปญัตติเสนอประชุมสภาท้องถิ่น', route: 'GP013' },
  { q: 'ประชุมสภาท้องถิ่นต้องมีองค์ประชุมกี่คน', route: 'GP013', fresh: true },
  { q: 'สมาชิกสภามีส่วนได้เสียลงมติได้ไหม', route: 'GP013', fresh: true }
];

const failures = [];
const routeWarnings = [];
for (const item of cases) {
  const route = core.routeRequest(item.q, { multiModule: false });
  const context = core.createSharedContext({ facts: item.q, desiredOutput: item.q });
  const bundle = core.createGovernmentPrompt({ question: item.q, route, context });
  const toolPlan = core.createToolRoutingPlan({ question: item.q });

  if (route.primaryModule !== item.route) {
    routeWarnings.push({ query: item.q, expectedRoute: item.route, actualRoute: route.primaryModule });
  }

  const checks = {
    routeProduced: /^GP0(?:0[1-9]|1[0-3])$/.test(route.primaryModule),
    routeAdvisory: bundle.taskPlan.routeIsAdvisory === true,
    promptHasQuestion: bundle.prompt.includes(item.q),
    answerFirst: bundle.prompt.includes('Answer First'),
    noCorruptAnswerFirst: !bundle.prompt.includes('รหัสผู้ป่วย [ปกปิด] First'),
    outputReady: Boolean(bundle.outputPlan?.label && bundle.outputPlan?.format),
    currentSourceWhenRequired: !item.fresh || (toolPlan.flags.needsPrimarySource && toolPlan.tools.includes('web-search'))
  };

  if (Object.values(checks).some(value => !value)) {
    failures.push({ query: item.q, route: route.primaryModule, checks, tools: toolPlan.tools, flags: toolPlan.flags });
  }
}

const passed = cases.length - failures.length;
const score = Math.round((passed / cases.length) * 100);
console.log(`GovPrompt Pilot Quality 30: ${passed}/${cases.length} passed (${score}%)`);
if (routeWarnings.length) {
  console.log(`Route advisory warnings: ${routeWarnings.length} (not task-completion failures)`);
  console.table(routeWarnings);
}
if (failures.length) {
  console.log('Task-quality failures:');
  console.log(JSON.stringify(failures, null, 2));
}

assert.equal(cases.length, 30, 'pilot quality fixture must contain exactly 30 cases');
assert.equal(routeWarnings.length, 0, `pilot quality routing should have no advisory warnings; got ${routeWarnings.length}`);
assert.ok(passed >= 27, `pilot quality must be at least 90%; got ${passed}/30 (${score}%)`);
console.log('GovPrompt real pilot quality benchmark accepted at >=90%: task completion + tool/evidence policy + output + Answer First integrity.');
