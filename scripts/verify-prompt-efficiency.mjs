// Prompt efficiency guard. Measures fully assembled prompt strings, not source-file lengths.
// The "tokenEstimate" is a documented UTF-8 proxy, NOT a model-tokenizer count.
// Run on PRs against the unchanged base commit; do not hard-code legal rules or budgets.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const files = [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/output-router.js',
  'assets/js/core/prompt-orchestrator.js'
];
const cases = [
  ['GP001', 'ร่างหนังสือราชการขอข้อมูลการประชุม'],
  ['GP002', 'วิเคราะห์อำนาจ อบจ. ตามกฎหมายปัจจุบัน'],
  ['GP003', 'ตรวจ TOR จัดซื้อจัดจ้างและหลักเกณฑ์'],
  ['GP004', 'จัดทำโครงการและงบประมาณประจำปี'],
  ['GP005', 'ค่าอาหารและเครื่องดื่มในงานราชการเบิกได้หรือไม่'],
  ['GP006', 'ตรวจสิทธิการเลื่อนเงินเดือนข้าราชการท้องถิ่น'],
  ['GP007', 'ตรวจปริมาณงานซ่อมถนนคอนกรีตและราคากลาง'],
  ['GP008', 'จัดทำโครงการสาธารณสุข รพ.สต.'],
  ['GP009', 'ร่างกิจกรรมการศึกษาสำหรับนักเรียน'],
  ['GP010', 'ตรวจประเมินควบคุมภายใน ปค.5'],
  ['GP011', 'สรุปข้อเสนอเชิงนโยบายผู้บริหาร'],
  ['GP012', 'เขียนข่าวประชาสัมพันธ์กิจกรรมท้องถิ่น'],
  ['GP013', 'จัดทำวาระประชุมสภาท้องถิ่น'],
  ['HIGH-RISK-FINANCE', 'อบจ. ตั้งงบ 500000 บาท แสดงความจงรักภักดี เบิกค่าดอกไม้จันทน์และอาหารได้หรือไม่'],
  ['HIGH-RISK-LEGAL', 'อบจ. มีอำนาจจัดเก็บภาษีที่ดินและสิ่งปลูกสร้างหรือไม่'],
  ['HIGH-RISK-PROCUREMENT', 'ตรวจ TOR และการจัดซื้อจัดจ้างโดยวิธีเฉพาะเจาะจงถูกกฎหมายหรือไม่']
];
function source(path, ref) {
  return ref ? execFileSync('git', ['show', ref + ':' + path], { encoding: 'utf8' }) : readFileSync(path, 'utf8');
}
function metric(prompt) {
  const utf8Bytes = Buffer.byteLength(prompt, 'utf8');
  return { chars: [...prompt].length, utf8Bytes, tokenEstimate: Math.ceil(utf8Bytes / 4) };
}
function collect(ref) {
  const sandbox = { window: {}, location: { pathname: '/index.html' } };
  for (const file of files) vm.runInNewContext(source(file, ref), sandbox, { filename: file });
  const core = sandbox.window.GovPromptCore;
  assert.equal(typeof core.createGovernmentPrompt, 'function');
  if (typeof core.installPromptQualityStandard === 'function') core.installPromptQualityStandard();
  return Object.fromEntries(cases.map(([id, question]) => {
    const context = core.createSharedContext({ facts: question, desiredOutput: question });
    const entry = core.PROMPT_REGISTRY_BY_ID?.[id];
    const route = entry ? { moduleId: id, assistant: entry, modules: [id], transactionType: entry.transactionTypes?.[0] } : core.routeTransaction(context);
    const output = core.createGovernmentPrompt({ question, route, context });
    assert.ok(output.prompt.length > 0, id);
    for (const phrase of ['Answer First', 'Decision Lock']) {
      assert.ok(output.prompt.includes(phrase), id + ': missing ' + phrase);
    }
    return [id, metric(output.prompt)];
  }));
}
const current = collect();
const baseRef = process.env.PROMPT_BASE_REF || '';
const baseline = baseRef ? collect(baseRef) : null;
const failures = [];
const rows = cases.map(([id]) => {
  const now = current[id], before = baseline?.[id];
  const delta = before ? now.utf8Bytes - before.utf8Bytes : null;
  // No silent budget growth. Approved increases require an explicit PR follow-up
  // changing this checker with evidence and tests, not an environment bypass.
  if (before && delta > 0) failures.push(id + ': +' + delta + ' UTF-8 bytes');
  return { scenario: id, before, after: now, deltaUtf8Bytes: delta };
});
console.log(JSON.stringify({ description: 'Prompt assembly length regression; tokens are UTF-8 proxy estimates, not provider token counts', baseRef: baseRef || null, cases: rows }, null, 2));
if (failures.length) {
  console.error('PROMPT EFFICIENCY REGRESSION: ' + failures.join('; '));
  process.exitCode = 1;
}
