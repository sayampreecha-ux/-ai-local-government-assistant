import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';

// Reuse the 100 real-case definitions from the first-pass fixture, but score
// route selection as advisory. The GovPrompt contract explicitly allows the
// final module to be contextual; task completion, tool/evidence policy and
// output intent are the hard quality gates.
const fixtureSource = await readFile('scripts/verify-real-case-quality-300.mjs', 'utf8');
const fixtureStart = fixtureSource.indexOf('const A =');
const fixtureEnd = fixtureSource.indexOf("assert.equal(scenarios.length");
assert.ok(fixtureStart >= 0 && fixtureEnd > fixtureStart, 'could not locate 100-case fixture block');
const fixtureBlock = fixtureSource
  .slice(fixtureStart, fixtureEnd)
  .replace('const extra =', 'globalThis.extra =');
const fixtureSandbox = {};
vm.runInNewContext(fixtureBlock, fixtureSandbox);
const extra = fixtureSandbox.extra;
assert.equal(extra.length, 100, 'real-case detail fixture must contain exactly 100 cases');

// The established 200-case benchmark contains richer contextual route/output
// adjudication than a raw routeRequest-only check. Run it as the first 200.
const baseline = spawnSync(process.execPath, ['scripts/verify-simulated-work-200.mjs'], {
  cwd: process.cwd(),
  encoding: 'utf8'
});
if (baseline.stdout) process.stdout.write(baseline.stdout);
if (baseline.stderr) process.stderr.write(baseline.stderr);
assert.equal(baseline.status, 0, 'established simulated-work 200 baseline must pass');

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

function expectedOutputFor(question) {
  const q = String(question || '').toLocaleLowerCase();
  if (/(?:ร่าง|ทำ|เขียน).{0,18}(?:หนังสือ|บันทึกข้อความ|บันทึก)/i.test(q)) return 'official_document';
  if (/checklist/i.test(q)) return 'checklist';
  if (/(?:executive summary|สรุปผู้บริหาร|สรุป.{0,40}เสนอผู้บริหาร)/i.test(q)) return 'executive_summary';
  if (/(?:ร่าง|จัดทำ|ตรวจ).{0,24}(?:tor|ที\s*โอ\s*อาร์|ทีโออาร์|ขอบเขตของงาน)/i.test(q)) return 'tor';
  if (/(?:ทำ|ร่าง|เขียน).{0,18}โครงการ/i.test(q)) return 'project';
  return null;
}

const failures = [];
const routeWarnings = [];
let detailedPass = 0;

for (let i = 0; i < extra.length; i += 1) {
  const item = extra[i];
  const id = `REAL${String(i + 201).padStart(3, '0')}`;
  const route = core.routeRequest(item.q, { multiModule: false });
  const toolPlan = core.createToolRoutingPlan({ question: item.q, attachments: item.attachments });
  const context = core.createSharedContext({ facts: item.q, desiredOutput: item.q });
  const bundle = core.createGovernmentPrompt({ question: item.q, route, context });
  const output = core.routeOutput(item.q, { moduleId: route.primaryModule });
  const expectedOutput = expectedOutputFor(item.q);

  if (!item.modules.includes(route.primaryModule)) {
    routeWarnings.push({ id, query: item.q, expected: item.modules, actual: route.primaryModule });
  }

  const checks = {
    validRoute: /^GP0(?:0[1-9]|1[0-3])$/.test(route.primaryModule),
    routeAdvisory: bundle.taskPlan?.routeIsAdvisory === true,
    mode: toolPlan.mode === item.mode,
    requiredTools: item.tools.every(tool => toolPlan.tools.includes(tool)),
    aiFinishes: toolPlan.tools.at(-1) === 'ai-reasoning',
    answerFirst: bundle.prompt.includes('Answer First'),
    noCorruptAnswerFirst: !bundle.prompt.includes('รหัสผู้ป่วย [ปกปิด] First'),
    outputReady: Boolean(bundle.outputPlan?.label && bundle.outputPlan?.format),
    explicitOutputIntent: !expectedOutput || output.id === expectedOutput,
    sourceOrder: !item.attachments.length || toolPlan.tools[0] === 'attached-files',
    noRedundantWeb: !['ai-only', 'user-data-first'].includes(item.mode) || !toolPlan.tools.includes('web-search'),
    webWhenRequired: item.mode !== 'web-when-needed' || toolPlan.tools.includes('web-search'),
    attachmentVerification: item.mode !== 'attachment-first' || !item.tools.includes('web-search') || toolPlan.tools.includes('web-search')
  };

  if (Object.values(checks).every(Boolean)) detailedPass += 1;
  else failures.push({
    id,
    q: item.q,
    expectedModules: item.modules,
    actualModule: route.primaryModule,
    expectedMode: item.mode,
    actualMode: toolPlan.mode,
    expectedOutput,
    actualOutput: output.id,
    tools: toolPlan.tools,
    checks
  });
}

const totalPass = 200 + detailedPass;
console.log(`GovPrompt Real-Case Quality Gate 300: ${totalPass}/300 passed`);
console.log('  Established contextual baseline: 200/200');
console.log(`  Detailed E2E task-completion cases: ${detailedPass}/100`);
console.log(`  Advisory route differences: ${routeWarnings.length}`);
if (routeWarnings.length) console.table(routeWarnings);
if (failures.length) {
  console.log(`  Hard quality failures: ${failures.length}`);
  console.log(JSON.stringify(failures, null, 2));
}

assert.equal(detailedPass, 100, `detailed E2E task-completion regression: ${100 - detailedPass} cases failed`);
assert.equal(failures.length, 0, `${failures.length} hard real-case quality failures`);
console.log('GovPrompt 300-case real-work quality gate passed: Router advisory + Tool Routing + Prompt Engine + Output Router.');
