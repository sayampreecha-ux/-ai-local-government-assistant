import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Layer 1: preserve the accepted 500-case real-work gate.
const baseline = spawnSync(process.execPath, ['scripts/verify-real-case-quality-500.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (baseline.stdout) process.stdout.write(baseline.stdout);
if (baseline.stderr) process.stderr.write(baseline.stderr);
assert.equal(baseline.status, 0, 'accepted 500-case real-work gate must pass');

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

// 50 concrete local-government scenarios derived from common field workflows.
// Each scenario is exercised through ten natural user behaviors, producing
// 500 additional real-use utterances without weakening the accepted baseline.
const scenarios = [
  'หนังสือขอความอนุเคราะห์ใช้ห้องประชุม',
  'หนังสือเชิญประชุมคณะกรรมการ',
  'บันทึกเสนอผู้บริหารขออนุมัติโครงการ',
  'คำสั่งแต่งตั้งคณะทำงาน',
  'ประกาศผลการดำเนินงานของหน่วยงาน',
  'อำนาจหน้าที่ของ อบจ. ในการทำโครงการ',
  'อุทธรณ์คำสั่งทางปกครอง',
  'เปิดเผยข้อมูลผู้ร้องเรียน',
  'มอบอำนาจให้รองหรือหัวหน้าส่วนราชการ',
  'การใช้ดุลพินิจของผู้มีอำนาจอนุมัติ',
  'TOR จัดซื้อคอมพิวเตอร์',
  'TOR จัดซื้อเครื่องจักรกล',
  'TOR งานก่อสร้างถนน',
  'ราคากลางงานก่อสร้าง',
  'กำหนดยี่ห้อหรือคุณลักษณะเฉพาะใน TOR',
  'แบ่งซื้อแบ่งจ้าง',
  'วิธีเฉพาะเจาะจง',
  'e-bidding ไม่มีผู้ยื่นข้อเสนอ',
  'กรรมการตรวจรับพัสดุ',
  'แก้ไขสัญญาและขยายเวลาสัญญา',
  'ค่าเดินทางไปราชการ',
  'ค่าแท็กซี่ไปราชการ',
  'ค่าอาหารประชุม',
  'ค่าเช่าที่พักไปราชการ',
  'เงินยืมราชการและการล้างลูกหนี้',
  'เงินสะสม',
  'เงินสำรองจ่ายกรณีฉุกเฉิน',
  'เงินบำรุง รพ.สต.',
  'ค่าซ่อมรถราชการ',
  'ค่าใช้จ่ายโครงการฝึกอบรม',
  'โอนย้ายข้าราชการท้องถิ่น',
  'เลื่อนเงินเดือน',
  'ลาป่วยและใบรับรองแพทย์',
  'สอบสวนวินัย',
  'ประเมินผลการปฏิบัติงาน',
  'ถนนชำรุดและการซ่อมฉุกเฉิน',
  'ตรวจรับถนนคอนกรีต',
  'แบบก่อสร้างและวิศวกรลงนาม',
  'งานซ่อมในระยะประกัน',
  'ขยายสัญญางานก่อสร้าง',
  'โครงการส่งเสริมสุขภาพผู้สูงอายุ',
  'การใช้ข้อมูลผู้ป่วยและ PDPA',
  'การถ่ายโอน รพ.สต.',
  'โครงการกีฬาเยาวชน',
  'กิจกรรมวันเด็ก',
  'ข่าวประชาสัมพันธ์กิจกรรมราชการ',
  'โพสต์ภาพบุคคลลงเพจหน่วยงาน',
  'ทำอินโฟกราฟิกสรุปผลงาน',
  'ประชุมสภาท้องถิ่นและองค์ประชุม',
  'เสนอญัตติและลงมติในสภา'
];
assert.equal(scenarios.length, 50);

const behaviors = [
  {
    kind: 'short-current-question',
    make: s => `${s} ทำได้ไหม ขอเช็กกฎหมายหรือระเบียบล่าสุดให้ด้วย`,
    attachments: [], required: ['web-search', 'ai-reasoning'], forbidden: [], first: null
  },
  {
    kind: 'ready-draft-no-web',
    make: s => `ช่วยร่างเรื่อง${s}ให้พร้อมใช้ จากข้อมูลที่มี ไม่ต้องค้นเว็บ`,
    attachments: [], required: ['ai-reasoning'], forbidden: ['web-search'], first: null
  },
  {
    kind: 'attachment-summary',
    make: s => `สรุปไฟล์แนบเรื่อง${s}ให้เข้าใจง่ายก่อน ไม่ต้องค้นข้อมูลเพิ่ม`,
    attachments: ['input.pdf'], required: ['attached-files', 'ai-reasoning'], forbidden: ['web-search'], first: 'attached-files'
  },
  {
    kind: 'attachment-current-check',
    make: s => `ดูเอกสารแนบเรื่อง${s} แล้วตรวจว่าถูกต้องตามหลักเกณฑ์ปัจจุบันหรือไม่ พร้อมบอกจุดเสี่ยง`,
    attachments: ['input.pdf'], required: ['attached-files', 'web-search', 'ai-reasoning'], forbidden: [], first: 'attached-files'
  },
  {
    kind: 'drive-find',
    make: s => `หาไฟล์เรื่อง${s}ที่เคยทำไว้ใน Google Drive ให้หน่อย แล้วสรุปว่าไฟล์ไหนน่าจะใช่`,
    attachments: [], required: ['drive-files', 'ai-reasoning'], forbidden: ['web-search'], first: 'drive-files'
  },
  {
    kind: 'gmail-find',
    make: s => `หาเมลล่าสุดที่ได้รับเกี่ยวกับ${s} แล้วสรุปว่าต้องทำอะไรต่อ`,
    attachments: [], required: ['gmail', 'ai-reasoning'], forbidden: ['web-search'], first: 'gmail'
  },
  {
    kind: 'checklist-no-web',
    make: s => `ทำเช็กลิสต์เรื่อง${s} แบบเจ้าหน้าที่เอาไปทำงานต่อได้เลย ยังไม่ต้องค้นเว็บ`,
    attachments: [], required: ['ai-reasoning'], forbidden: ['web-search'], first: null
  },
  {
    kind: 'executive-brief',
    make: s => `สรุปเอกสารแนบเรื่อง${s} เป็นประเด็นเสนอผู้บริหาร 5 ข้อ ไม่ต้องค้นภายนอก`,
    attachments: ['input.docx'], required: ['attached-files', 'ai-reasoning'], forbidden: ['web-search'], first: 'attached-files'
  },
  {
    kind: 'current-risk-answer-first',
    make: s => `เรื่อง${s} ตอนนี้มีความเสี่ยงอะไรบ้าง ตรวจแหล่งราชการล่าสุดแล้วตอบสั้นๆก่อน`,
    attachments: [], required: ['web-search', 'ai-reasoning'], forbidden: [], first: null
  },
  {
    kind: 'mixed-file-then-verify',
    make: s => `เปิดไฟล์แนบเรื่อง${s}ก่อน แล้วค่อยเทียบกับกฎหมายหรือระเบียบปัจจุบันและเสนอทางแก้`,
    attachments: ['input.pdf'], required: ['attached-files', 'web-search', 'ai-reasoning'], forbidden: [], first: 'attached-files'
  }
];
assert.equal(behaviors.length, 10);

const cases = [];
for (const scenario of scenarios) {
  for (const behavior of behaviors) cases.push({ scenario, ...behavior, q: behavior.make(scenario) });
}
assert.equal(cases.length, 500, '1000-case extension must add exactly 500 real-use cases');

const failures = [];
const routeWarnings = [];
const kindCounts = new Map();
const moduleCounts = new Map();
let pass = 0;

for (let i = 0; i < cases.length; i += 1) {
  const item = cases[i];
  const id = `USE${String(i + 501).padStart(4, '0')}`;
  const route = core.routeRequest(item.q, { multiModule: false });
  const toolPlan = core.createToolRoutingPlan({ question: item.q, attachments: item.attachments });
  const context = core.createSharedContext({ facts: item.q, desiredOutput: item.q });
  const bundle = core.createGovernmentPrompt({ question: item.q, route, context });
  const output = core.routeOutput(item.q, { moduleId: route.primaryModule });

  kindCounts.set(item.kind, (kindCounts.get(item.kind) || 0) + 1);
  moduleCounts.set(route.primaryModule, (moduleCounts.get(route.primaryModule) || 0) + 1);
  const validRoute = /^GP0(?:0[1-9]|1[0-3])$/.test(route.primaryModule);
  if (!validRoute) routeWarnings.push({ id, q: item.q, actualModule: route.primaryModule });

  const checks = {
    validRoute,
    routeAdvisory: bundle.taskPlan?.routeIsAdvisory === true,
    requiredTools: item.required.every(tool => toolPlan.tools.includes(tool)),
    forbiddenTools: item.forbidden.every(tool => !toolPlan.tools.includes(tool)),
    firstTool: !item.first || toolPlan.tools[0] === item.first,
    aiFinishes: toolPlan.tools.at(-1) === 'ai-reasoning',
    answerFirst: bundle.prompt.includes('Answer First'),
    noCorruptAnswerFirst: !bundle.prompt.includes('รหัสผู้ป่วย [ปกปิด] First'),
    promptHasQuestion: bundle.prompt.includes(item.q),
    outputReady: Boolean(bundle.outputPlan?.label && bundle.outputPlan?.format),
    outputRouterReady: Boolean(output?.id && output?.label),
    attachmentSourceFirst: !item.attachments.length || toolPlan.tools[0] === 'attached-files',
    retrievalNoWeb: !['drive-find', 'gmail-find'].includes(item.kind) || !toolPlan.tools.includes('web-search'),
    currentWeb: !['short-current-question', 'attachment-current-check', 'current-risk-answer-first', 'mixed-file-then-verify'].includes(item.kind) || toolPlan.tools.includes('web-search'),
    explicitNoWebHonored: !['ready-draft-no-web', 'attachment-summary', 'checklist-no-web', 'executive-brief'].includes(item.kind) || !toolPlan.tools.includes('web-search')
  };

  if (Object.values(checks).every(Boolean)) pass += 1;
  else failures.push({
    id, kind: item.kind, q: item.q, actualModule: route.primaryModule,
    mode: toolPlan.mode, tools: toolPlan.tools, output: output?.id, checks
  });
}

console.log(`GovPrompt Real-Use Quality Gate 1000: ${500 + pass}/1000 passed`);
console.log('  Accepted real-work baseline: 500/500');
console.log(`  New field-language cases: ${pass}/500`);
console.log('  New case distribution:');
for (const [kind, count] of kindCounts) console.log(`    ${kind}: ${count}`);
console.log('  Routed module distribution:');
for (const [moduleId, count] of [...moduleCounts].sort()) console.log(`    ${moduleId}: ${count}`);
console.log(`  Invalid route warnings: ${routeWarnings.length}`);
if (routeWarnings.length) console.table(routeWarnings);
if (failures.length) {
  console.log(`  Hard quality failures: ${failures.length}`);
  console.log(JSON.stringify(failures, null, 2));
}

assert.equal(pass, 500, `1000-case real-use regression: ${500 - pass} new cases failed`);
assert.equal(failures.length, 0, `${failures.length} hard real-use quality failures`);
console.log('GovPrompt 1000-case real-use quality gate passed: Router + source ordering + Tool Routing + Prompt Engine + Output Router.');
