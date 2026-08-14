import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Preserve the accepted 1,000-case gate as the regression baseline.
const baseline = spawnSync(process.execPath, ['scripts/verify-real-use-quality-1000.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (baseline.stdout) process.stdout.write(baseline.stdout);
if (baseline.stderr) process.stderr.write(baseline.stderr);
assert.equal(baseline.status, 0, 'accepted 1,000-case real-use gate must pass');

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

// Fifty concrete workflows already proven useful in the 1,000-case gate.
// We keep them stable and multiply natural user behavior, not random tokens.
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

// Ten neutral field-language wrappers. They intentionally include terse,
// conversational and role-framed phrasing while preserving the task contract.
const languageStyles = [
  q => `ช่วย${q}`,
  q => `ขอ${q}`,
  q => `รบกวน${q}หน่อยครับ`,
  q => `${q} ทำให้ที`,
  q => `งานนี้ ${q}`,
  q => `เอาแบบใช้งานจริง ${q}`,
  q => `ขอสั้นๆก่อน ${q}`,
  q => `เจ้าหน้าที่ถามว่า ${q}`,
  q => `ผู้บริหารถามว่า ${q}`,
  q => `${q} ด่วนหน่อย`
];
assert.equal(languageStyles.length, 10);

const behaviors = [
  {
    kind: 'current-decision',
    make: s => `${s} ทำได้ไหม ตรวจระเบียบหรือกฎหมายปัจจุบันให้ด้วย`,
    attachments: [], required: ['web-search', 'ai-reasoning'], forbidden: [], first: null, current: true
  },
  {
    kind: 'current-rule-status',
    make: s => `${s} ตอนนี้ใช้หลักเกณฑ์ไหน ขอฉบับล่าสุดจากแหล่งราชการ`,
    attachments: [], required: ['web-search', 'ai-reasoning'], forbidden: [], first: null, current: true
  },
  {
    kind: 'current-risk',
    make: s => `วิเคราะห์ความเสี่ยงของ${s} และเช็กกฎหมายหรือระเบียบล่าสุดก่อนตอบ`,
    attachments: [], required: ['web-search', 'ai-reasoning'], forbidden: [], first: null, current: true
  },
  {
    kind: 'ready-draft-no-web',
    make: s => `ร่างเรื่อง${s}ให้พร้อมใช้ จากข้อมูลที่มี ไม่ต้องค้นเว็บ`,
    attachments: [], required: ['ai-reasoning'], forbidden: ['web-search'], first: null, noWeb: true
  },
  {
    kind: 'checklist-no-web',
    make: s => `ทำเช็กลิสต์เรื่อง${s} ให้เจ้าหน้าที่ทำตามได้เลย ยังไม่ต้องค้นเว็บ`,
    attachments: [], required: ['ai-reasoning'], forbidden: ['web-search'], first: null, noWeb: true
  },
  {
    kind: 'explain-no-web',
    make: s => `อธิบายเรื่อง${s} จากข้อมูลที่ให้เท่านั้น ไม่ต้องค้นภายนอก`,
    attachments: [], required: ['ai-reasoning'], forbidden: ['web-search'], first: null, noWeb: true
  },
  {
    kind: 'attachment-summary',
    make: s => `สรุปไฟล์แนบเรื่อง${s} ให้เข้าใจง่าย ไม่ต้องค้นข้อมูลเพิ่ม`,
    attachments: ['input.pdf'], required: ['attached-files', 'ai-reasoning'], forbidden: ['web-search', 'drive-files'], first: 'attached-files', noWeb: true
  },
  {
    kind: 'attachment-extract',
    make: s => `ดึงประเด็นสำคัญจากเอกสารแนบเรื่อง${s} 5 ข้อ ใช้เอกสารนี้อย่างเดียว`,
    attachments: ['input.docx'], required: ['attached-files', 'ai-reasoning'], forbidden: ['web-search', 'drive-files'], first: 'attached-files', noWeb: true
  },
  {
    kind: 'attachment-current-check',
    make: s => `อ่านไฟล์แนบเรื่อง${s}ก่อน แล้วตรวจว่าถูกต้องตามหลักเกณฑ์ปัจจุบันหรือไม่`,
    attachments: ['input.pdf'], required: ['attached-files', 'web-search', 'ai-reasoning'], forbidden: ['drive-files'], first: 'attached-files', current: true
  },
  {
    kind: 'attachment-risk-current',
    make: s => `เปิดเอกสารแนบเรื่อง${s} แล้วเทียบกับกฎหมายหรือระเบียบล่าสุด พร้อมชี้จุดเสี่ยง`,
    attachments: ['input.pdf'], required: ['attached-files', 'web-search', 'ai-reasoning'], forbidden: ['drive-files'], first: 'attached-files', current: true
  },
  {
    kind: 'drive-find',
    make: s => `หาไฟล์เรื่อง${s} ที่เคยทำไว้ใน Google Drive แล้วบอกว่าไฟล์ไหนน่าจะใช่`,
    attachments: [], required: ['drive-files', 'ai-reasoning'], forbidden: ['web-search'], first: 'drive-files', retrieval: true
  },
  {
    kind: 'drive-summary',
    make: s => `เปิดเอกสารเดิมใน Drive เรื่อง${s} แล้วสรุปเนื้อหาให้หน่อย`,
    attachments: [], required: ['drive-files', 'ai-reasoning'], forbidden: ['web-search'], first: 'drive-files', retrieval: true
  },
  {
    kind: 'gmail-find',
    make: s => `หาอีเมลล่าสุดที่ได้รับเกี่ยวกับ${s} แล้วสรุปสาระสำคัญ`,
    attachments: [], required: ['gmail', 'ai-reasoning'], forbidden: ['web-search'], first: 'gmail', retrieval: true
  },
  {
    kind: 'gmail-next-action',
    make: s => `ค้นเมลเดิมเรื่อง${s} แล้วบอกว่าจากเมลนั้นต้องทำอะไรต่อ`,
    attachments: [], required: ['gmail', 'ai-reasoning'], forbidden: ['web-search'], first: 'gmail', retrieval: true
  },
  {
    kind: 'answer-first-current',
    make: s => `${s} สรุปคำตอบก่อนว่าได้หรือไม่ได้ แล้วตรวจแหล่งราชการล่าสุดประกอบ`,
    attachments: [], required: ['web-search', 'ai-reasoning'], forbidden: [], first: null, current: true
  },
  {
    kind: 'attachment-draft-no-web',
    make: s => `ใช้ไฟล์แนบเรื่อง${s} ร่างฉบับพร้อมใช้ให้เลย ไม่ต้องค้นเว็บ`,
    attachments: ['input.docx'], required: ['attached-files', 'ai-reasoning'], forbidden: ['web-search', 'drive-files'], first: 'attached-files', noWeb: true
  },
  {
    kind: 'attachment-executive-brief',
    make: s => `จากเอกสารแนบเรื่อง${s} ทำสรุปเสนอผู้บริหาร 5 ข้อ ไม่ค้นภายนอก`,
    attachments: ['input.pdf'], required: ['attached-files', 'ai-reasoning'], forbidden: ['web-search', 'drive-files'], first: 'attached-files', noWeb: true
  },
  {
    kind: 'attachment-verify-and-fix',
    make: s => `ตรวจไฟล์แนบเรื่อง${s} เทียบระเบียบปัจจุบัน แล้วเสนอข้อความแก้ที่นำไปใช้ได้`,
    attachments: ['input.pdf'], required: ['attached-files', 'web-search', 'ai-reasoning'], forbidden: ['drive-files'], first: 'attached-files', current: true
  }
];
assert.equal(behaviors.length, 18);

const cases = [];
for (const scenario of scenarios) {
  for (const behavior of behaviors) {
    for (let styleIndex = 0; styleIndex < languageStyles.length; styleIndex += 1) {
      const baseQuestion = behavior.make(scenario);
      cases.push({
        scenario,
        ...behavior,
        styleIndex,
        q: languageStyles[styleIndex](baseQuestion)
      });
    }
  }
}
assert.equal(cases.length, 9000, '10,000-case extension must add exactly 9,000 real-use cases');

const failures = [];
const routeWarnings = [];
const kindCounts = new Map();
const moduleCounts = new Map();
let pass = 0;

for (let i = 0; i < cases.length; i += 1) {
  const item = cases[i];
  const id = `USE${String(i + 1001).padStart(5, '0')}`;
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
    retrievalNoWeb: !item.retrieval || !toolPlan.tools.includes('web-search'),
    currentWeb: !item.current || toolPlan.tools.includes('web-search'),
    explicitNoWebHonored: !item.noWeb || !toolPlan.tools.includes('web-search'),
    attachedNotDrive: !item.attachments.length || !toolPlan.tools.includes('drive-files')
  };

  if (Object.values(checks).every(Boolean)) pass += 1;
  else failures.push({
    id,
    kind: item.kind,
    styleIndex: item.styleIndex,
    q: item.q,
    actualModule: route.primaryModule,
    mode: toolPlan.mode,
    tools: toolPlan.tools,
    output: output?.id,
    checks
  });
}

console.log(`GovPrompt Real-Use Quality Gate 10000: ${1000 + pass}/10000 passed`);
console.log('  Accepted real-use baseline: 1000/1000');
console.log(`  New field-language cases: ${pass}/9000`);
console.log('  New case distribution:');
for (const [kind, count] of kindCounts) console.log(`    ${kind}: ${count}`);
console.log('  Routed module distribution:');
for (const [moduleId, count] of [...moduleCounts].sort()) console.log(`    ${moduleId}: ${count}`);
console.log(`  Invalid route warnings: ${routeWarnings.length}`);
if (routeWarnings.length) console.table(routeWarnings.slice(0, 50));
if (failures.length) {
  console.log(`  Hard quality failures: ${failures.length}`);
  console.log(JSON.stringify(failures.slice(0, 100), null, 2));
  if (failures.length > 100) console.log(`  ... ${failures.length - 100} additional failures omitted from log`);
}

assert.equal(pass, 9000, `10,000-case real-use regression: ${9000 - pass} new cases failed`);
assert.equal(failures.length, 0, `${failures.length} hard real-use quality failures`);
assert.equal(routeWarnings.length, 0, `${routeWarnings.length} invalid route warnings`);
console.log('GovPrompt 10,000-case real-use quality gate passed: Router + source ordering + Tool Routing + Prompt Engine + Output Router.');
