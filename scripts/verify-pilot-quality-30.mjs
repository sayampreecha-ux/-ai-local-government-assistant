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
  'assets/js/core/agent-governance-policy.js',
  'assets/js/core/output-router.js',
  'assets/js/core/prompt-orchestrator.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;

const cases = [
  { q: 'ร่างหนังสือขอความอนุเคราะห์ใช้ห้องประชุม', m: 'GP001' },
  { q: 'ร่างบันทึกข้อความแจ้งกำหนดลงพื้นที่ตรวจงาน', m: 'GP001' },
  { q: 'วิเคราะห์ข้อกฎหมายว่า อบจ. มีอำนาจทำเรื่องนี้หรือไม่', m: 'GP002', fresh: true },
  { q: 'ระเบียบนี้ยังใช้บังคับอยู่ไหม', m: 'GP002', fresh: true },
  { q: 'ร่าง TOR ซื้อรถส่วนกลาง', m: 'GP003', fresh: true },
  { q: 'ร่างทีโออาร์จัดซื้อคอมพิวเตอร์', m: 'GP003', fresh: true },
  { q: 'ตรวจ ที โอ อาร์ ว่าล็อกสเปกหรือไม่', m: 'GP003', fresh: true },
  { q: 'จัดทำขอบเขตของงานจ้างปรับปรุงถนน', m: 'GP003', fresh: true },
  { q: 'ขอใช้เงินสำรองจ่ายซ่อมถนนน้ำท่วมฉุกเฉิน', m: 'GP004', fresh: true },
  { q: 'ทำโครงการอบรม AI เจ้าหน้าที่ งบ 300000 บาท', m: 'GP004', fresh: true },
  { q: 'แท็กซี่พะเยาเชียงรายเบิกได้ไหม', m: 'GP005', fresh: true },
  { q: 'ตรวจเอกสารเบิกจ่ายก่อนเสนออนุมัติ', m: 'GP005', fresh: true },
  { q: 'ลาป่วยเกินสามวันต้องมีใบรับรองแพทย์ไหม', m: 'GP006' },
  { q: 'ร่างบันทึกขอเพิ่มอัตรากำลัง', m: 'GP006' },
  { q: 'ถนนคอนกรีตแตกร้าวระหว่างประกันทำอย่างไร', m: 'GP007' },
  { q: 'สรุปปัญหาหน้างานก่อสร้างเสนอผู้บริหาร', m: 'GP007' },
  { q: 'เงินบำรุง รพ.สต. ซื้อครุภัณฑ์ได้ไหม', m: 'GP008', fresh: true },
  { q: 'ทำโครงการส่งเสริมสุขภาพผู้สูงอายุ', m: 'GP008' },
  { q: 'จัดการแข่งขันกีฬาเยาวชน', m: 'GP009' },
  { q: 'โครงการบวชสามเณรภาคฤดูร้อน', m: 'GP009' },
  { q: 'โครงการสัปดาห์วิทยาศาสตร์', m: 'GP009' },
  { q: 'ตรวจสอบภายในเอกสารเบิกจ่ายมีความเสี่ยงอะไร', m: 'GP010', fresh: true },
  { q: 'ประเมินการควบคุมภายในงานพัสดุ', m: 'GP010', fresh: true },
  { q: 'ร่างคำกล่าวเปิดงานวันเด็ก', m: 'GP011' },
  { q: 'ทำ executive summary โครงการ 1 หน้าเสนอผู้บริหาร', m: 'GP011' },
  { q: 'ทำปกวิสัยทัศน์และผลงาน', m: 'GP012' },
  { q: 'ทำโพสต์ประชาสัมพันธ์การแข่งขันกีฬาเยาวชน', m: 'GP012' },
  { q: 'สรุปญัตติเสนอประชุมสภาท้องถิ่น', m: 'GP013' },
  { q: 'ประชุมสภาท้องถิ่นต้องมีองค์ประชุมกี่คน', m: 'GP013', fresh: true },
  { q: 'สมาชิกสภามีส่วนได้เสียลงมติได้ไหม', m: 'GP013', fresh: true }
];

const failures = [];
for (const item of cases) {
  const route = core.routeRequest(item.q, { multiModule: false });
  const context = core.createSharedContext({ facts: item.q, desiredOutput: item.q });
  const bundle = core.createGovernmentPrompt({ question: item.q, route, context });
  const checks = {
    route: route.primaryModule === item.m,
    advisory: bundle.taskPlan.routeIsAdvisory === true,
    promptHasQuestion: bundle.prompt.includes(item.q),
    answerFirst: bundle.prompt.includes('Answer First'),
    noCorruptAnswerFirst: !bundle.prompt.includes('รหัสผู้ป่วย [ปกปิด] First'),
    outputReady: Boolean(bundle.outputPlan?.label && bundle.outputPlan?.format),
    freshness: !item.fresh || bundle.taskPlan.evidenceMode === 'verify-current-primary-source'
  };
  if (Object.values(checks).some(value => !value)) failures.push({ query: item.q, expected: item.m, actual: route.primaryModule, checks });
}

console.log(`GovPrompt Pilot Quality 30: ${cases.length - failures.length}/${cases.length} passed`);
if (failures.length) console.table(failures);
assert.equal(cases.length, 30, 'pilot quality fixture must contain exactly 30 cases');
assert.equal(failures.length, 0, `${failures.length} of 30 real pilot quality cases failed`);
console.log('GovPrompt real pilot quality 30 verification passed: routing + Universal Task Reasoning + output + freshness + Answer First integrity.');
