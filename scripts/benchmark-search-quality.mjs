import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL, Date, console, globalThis: {} };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;

const cases = [
  ['ร่างหนังสือราชการตามระเบียบสารบรรณ', 'GP001', ['moi.go.th','dla.go.th']],
  ['หนังสือเวียนงานสารบรรณล่าสุด', 'GP001', ['moi.go.th','dla.go.th']],
  ['หน่วยงานมีอำนาจทำโครงการนี้ไหม', 'GP002', ['krisdika.go.th','ratchakitcha.soc.go.th','moi.go.th']],
  ['กฎหมายท้องถิ่นฉบับล่าสุด', 'GP002', ['krisdika.go.th','ratchakitcha.soc.go.th']],
  ['ซื้อคอมต้องใช้วิธีไหน', 'GP003', ['cgd.go.th','dla.go.th']],
  ['ตรวจ TOR งานก่อสร้าง', 'GP003', ['cgd.go.th','dla.go.th']],
  ['ราคากลางพัสดุล่าสุด', 'GP003', ['cgd.go.th']],
  ['โอนงบทำยังไง', 'GP004', ['dla.go.th','moi.go.th','bb.go.th']],
  ['ทำโครงการ 5 แสน', 'GP004', ['dla.go.th','moi.go.th','bb.go.th']],
  ['ข้อบัญญัติงบประมาณท้องถิ่น', 'GP004', ['dla.go.th','moi.go.th','bb.go.th']],
  ['รถเสียเบิกได้ไหม', 'GP005', ['dla.go.th','moi.go.th','cgd.go.th']],
  ['เบิกค่าเครื่องบิน', 'GP005', ['dla.go.th','moi.go.th','cgd.go.th']],
  ['ค่าโรงแรมเบิกไหม', 'GP005', ['dla.go.th','moi.go.th','cgd.go.th']],
  ['ขาดงาน 16 วันทำไง', 'GP006', ['dla.go.th','moi.go.th']],
  ['เลื่อนเงินเดือนท้องถิ่นล่าสุด', 'GP006', ['dla.go.th','moi.go.th']],
  ['สอบแข่งขันท้องถิ่น', 'GP006', ['dla.go.th','moi.go.th']],
  ['ถนนพังตรวจยังไง', 'GP007', ['dla.go.th','moi.go.th']],
  ['ตรวจความหนาแน่นชั้นทาง', 'GP007', ['dla.go.th','moi.go.th']],
  ['เงินบำรุงซื้อของได้ไหม', 'GP008', ['dla.go.th','moi.go.th']],
  ['รพ.สต.ทำโครงการได้ไหม', 'GP008', ['dla.go.th','moi.go.th']],
  ['ศพด.จัดงานวันเด็ก', 'GP009', ['dla.go.th','moi.go.th']],
  ['ครูเบิกค่าอาหารเด็ก', 'GP009', ['dla.go.th','moi.go.th']],
  ['ตรวจการเบิกเงิน', 'GP010', ['audit.go.th','dla.go.th']],
  ['audit พัสดุ', 'GP010', ['audit.go.th','cgd.go.th','dla.go.th']],
  ['เปิดงานวันเด็กพูดว่าไง', 'GP011', ['dla.go.th','moi.go.th']],
  ['กล่าวปิดแข่งกีฬา', 'GP011', ['dla.go.th','moi.go.th']],
  ['ทำอินโฟกฎหมาย', 'GP012', ['dla.go.th','moi.go.th','ratchakitcha.soc.go.th']],
  ['โพสต์ข่าวให้หน่อย', 'GP012', ['dla.go.th','moi.go.th']],
  ['ญัตติงบ', 'GP013', ['dla.go.th','moi.go.th']],
  ['มติสภาเรื่องเงินบำรุง', 'GP013', ['dla.go.th','moi.go.th']]
];

let passed = 0;
const failures = [];
for (const [query, expectedModule, acceptableHosts] of cases) {
  const plan = core.createOfficialSearchPlan(query, { limitSources: 6 });
  const top3 = plan.plans.slice(0, 3).map(item => item.host);
  const moduleOk = plan.routedModules.includes(expectedModule);
  const sourceOk = acceptableHosts.some(host => top3.includes(host));
  if (moduleOk && sourceOk) passed += 1;
  else failures.push({ query, expectedModule, routedModules: plan.routedModules, acceptableHosts, top3, rewritten: plan.query });
}

console.log(JSON.stringify({ passed, total: cases.length, accuracy: passed / cases.length, failures }, null, 2));
assert.equal(passed, cases.length, `Search benchmark failed ${cases.length - passed}/${cases.length} cases`);
