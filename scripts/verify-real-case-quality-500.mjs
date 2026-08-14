import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Preserve the accepted 300-case gate as the first layer, then add 200
// cross-domain matrix cases that focus on source ordering, current-rule
// verification, user-data retrieval, attachment handling and output readiness.
const baseline = spawnSync(process.execPath, ['scripts/verify-real-case-quality-300-v2.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (baseline.stdout) process.stdout.write(baseline.stdout);
if (baseline.stderr) process.stderr.write(baseline.stderr);
assert.equal(baseline.status, 0, 'accepted 300-case real-work gate must pass');

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

const topics = [
  'หนังสือเชิญประชุมคณะกรรมการ',
  'คำสั่งแต่งตั้งคณะทำงาน',
  'อำนาจหน้าที่ของ อปท.',
  'การอุทธรณ์คำสั่งทางปกครอง',
  'TOR จัดซื้อคอมพิวเตอร์',
  'TOR งานก่อสร้างถนน',
  'ราคากลางและวิธีจัดซื้อจัดจ้าง',
  'การตรวจรับพัสดุและหลักประกันสัญญา',
  'ค่าเดินทางไปราชการและค่าแท็กซี่',
  'เงินยืมราชการและการล้างลูกหนี้',
  'เงินสะสมและเงินสำรองจ่าย',
  'การเบิกค่าอาหารประชุม',
  'การโอนย้ายข้าราชการท้องถิ่น',
  'การเลื่อนเงินเดือนและวินัย',
  'การประเมินผลการปฏิบัติงาน',
  'แบบก่อสร้างและการควบคุมงานถนน',
  'การซ่อมงานในระยะประกัน',
  'โครงการส่งเสริมสุขภาพผู้สูงอายุ',
  'เงินบำรุง รพ.สต.',
  'ข้อมูลผู้ป่วยและ PDPA',
  'กิจกรรมวันเด็กและงานการศึกษา',
  'โครงการกีฬาเยาวชน',
  'ข่าวประชาสัมพันธ์กิจกรรมราชการ',
  'โพสต์ภาพบุคคลและการขอความยินยอม',
  'การประชุมสภาและการเสนอญัตติ'
];
assert.equal(topics.length, 25);

const operations = [
  {
    kind: 'draft',
    make: topic => `ร่างบันทึกข้อความเรื่อง${topic} จากข้อมูลที่ให้เท่านั้น ไม่ต้องค้นเว็บ`,
    attachments: [],
    required: ['ai-reasoning'],
    forbidden: ['web-search'],
    first: null
  },
  {
    kind: 'attachment-summary',
    make: topic => `ช่วยสรุปเอกสารแนบเรื่อง${topic} ให้กระชับ ไม่ต้องค้นข้อมูลเพิ่ม`,
    attachments: ['document.pdf'],
    required: ['attached-files', 'ai-reasoning'],
    forbidden: ['web-search'],
    first: 'attached-files'
  },
  {
    kind: 'current-verification',
    make: topic => `ตรวจสอบตามกฎหมาย ระเบียบ หรือหลักเกณฑ์ปัจจุบันล่าสุดว่าเรื่อง${topic} ทำได้หรือไม่ พร้อมใช้แหล่งราชการต้นฉบับ`,
    attachments: [],
    required: ['web-search', 'ai-reasoning'],
    forbidden: [],
    first: null
  },
  {
    kind: 'attachment-compliance',
    make: topic => `ตรวจเอกสารแนบเรื่อง${topic} ว่าถูกต้องตามกฎหมายหรือระเบียบปัจจุบันไหม และระบุความเสี่ยง`,
    attachments: ['document.pdf'],
    required: ['attached-files', 'web-search', 'ai-reasoning'],
    forbidden: [],
    first: 'attached-files'
  },
  {
    kind: 'drive-retrieval',
    make: topic => `หาไฟล์เรื่อง${topic} ที่เคยทำไว้ใน Google Drive ล่าสุด`,
    attachments: [],
    required: ['drive-files', 'ai-reasoning'],
    forbidden: ['web-search'],
    first: 'drive-files'
  },
  {
    kind: 'gmail-retrieval',
    make: topic => `หาอีเมลล่าสุดที่ได้รับเกี่ยวกับ${topic} แล้วสรุปสาระสำคัญ`,
    attachments: [],
    required: ['gmail', 'ai-reasoning'],
    forbidden: ['web-search'],
    first: 'gmail'
  },
  {
    kind: 'checklist',
    make: topic => `ทำ Checklist ขั้นตอนเรื่อง${topic} จากข้อมูลที่ให้ โดยยังไม่ต้องค้นเว็บ`,
    attachments: [],
    required: ['ai-reasoning'],
    forbidden: ['web-search'],
    first: null
  },
  {
    kind: 'executive-summary',
    make: topic => `สรุปเอกสารแนบเรื่อง${topic} เป็นสรุปผู้บริหาร 1 หน้า ไม่ต้องค้นข้อมูลเพิ่ม`,
    attachments: ['document.pdf'],
    required: ['attached-files', 'ai-reasoning'],
    forbidden: ['web-search'],
    first: 'attached-files'
  }
];
assert.equal(operations.length, 8);

const cases = [];
for (const topic of topics) {
  for (const op of operations) {
    cases.push({ topic, ...op, q: op.make(topic) });
  }
}
assert.equal(cases.length, 200, '500-case extension must add exactly 200 detailed cases');

const failures = [];
const routeWarnings = [];
const categoryCounts = new Map();
let pass = 0;

for (let i = 0; i < cases.length; i += 1) {
  const item = cases[i];
  const id = `REAL${String(i + 301).padStart(3, '0')}`;
  const route = core.routeRequest(item.q, { multiModule: false });
  const toolPlan = core.createToolRoutingPlan({ question: item.q, attachments: item.attachments });
  const context = core.createSharedContext({ facts: item.q, desiredOutput: item.q });
  const bundle = core.createGovernmentPrompt({ question: item.q, route, context });
  const output = core.routeOutput(item.q, { moduleId: route.primaryModule });

  categoryCounts.set(item.kind, (categoryCounts.get(item.kind) || 0) + 1);
  if (!/^GP0(?:0[1-9]|1[0-3])$/.test(route.primaryModule)) {
    routeWarnings.push({ id, q: item.q, actualModule: route.primaryModule });
  }

  const checks = {
    validRoute: /^GP0(?:0[1-9]|1[0-3])$/.test(route.primaryModule),
    routeAdvisory: bundle.taskPlan?.routeIsAdvisory === true,
    requiredTools: item.required.every(tool => toolPlan.tools.includes(tool)),
    forbiddenTools: item.forbidden.every(tool => !toolPlan.tools.includes(tool)),
    firstTool: !item.first || toolPlan.tools[0] === item.first,
    aiFinishes: toolPlan.tools.at(-1) === 'ai-reasoning',
    answerFirst: bundle.prompt.includes('Answer First'),
    noCorruptAnswerFirst: !bundle.prompt.includes('รหัสผู้ป่วย [ปกปิด] First'),
    outputReady: Boolean(bundle.outputPlan?.label && bundle.outputPlan?.format),
    outputRouterReady: Boolean(output?.id && output?.label),
    sourceFirst: !item.attachments.length || toolPlan.tools[0] === 'attached-files',
    userDataNoWeb: !['drive-retrieval', 'gmail-retrieval'].includes(item.kind) || !toolPlan.tools.includes('web-search'),
    currentUsesWeb: !['current-verification', 'attachment-compliance'].includes(item.kind) || toolPlan.tools.includes('web-search')
  };

  if (Object.values(checks).every(Boolean)) pass += 1;
  else failures.push({
    id,
    kind: item.kind,
    q: item.q,
    actualModule: route.primaryModule,
    mode: toolPlan.mode,
    tools: toolPlan.tools,
    output: output?.id,
    checks
  });
}

console.log(`GovPrompt Real-Case Quality Gate 500: ${300 + pass}/500 passed`);
console.log('  Accepted 300-case baseline: 300/300');
console.log(`  New detailed cross-domain cases: ${pass}/200`);
console.log('  New case distribution:');
for (const [kind, count] of categoryCounts) console.log(`    ${kind}: ${count}`);
console.log(`  Invalid route warnings: ${routeWarnings.length}`);
if (routeWarnings.length) console.table(routeWarnings);
if (failures.length) {
  console.log(`  Hard quality failures: ${failures.length}`);
  console.log(JSON.stringify(failures, null, 2));
}

assert.equal(pass, 200, `500-case detailed regression: ${200 - pass} new cases failed`);
assert.equal(failures.length, 0, `${failures.length} hard real-case quality failures`);
console.log('GovPrompt 500-case real-work quality gate passed: Router advisory + source ordering + Tool Routing + Prompt Engine + Output Router.');
