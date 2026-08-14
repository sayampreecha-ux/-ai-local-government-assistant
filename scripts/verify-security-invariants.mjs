import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [index, privacyGuard, submitGuard, home, worker, policy] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('assets/js/core/privacy-guard.js', 'utf8'),
  readFile('assets/js/core/privacy-submit-guard.js', 'utf8'),
  readFile('assets/js/home-v3.js', 'utf8'),
  readFile('src/search-worker.js', 'utf8'),
  readFile('docs/security-invariants.md', 'utf8')
]);

assert.match(policy, /Security before convenience/);
assert.match(policy, /Privacy First/);
assert.match(policy, /Sensitive Data Fail Closed/);
assert.match(policy, /Regression Lock/);
assert.match(policy, /Release Gate/);

const privacyPos = index.indexOf('assets/js/core/privacy-guard.js');
const submitPos = index.indexOf('assets/js/core/privacy-submit-guard.js');
const homePos = index.indexOf('assets/js/home-v3.js');
assert.ok(privacyPos >= 0 && submitPos > privacyPos && homePos > submitPos, 'Privacy guards must load before home workflow');

assert.match(submitGuard, /stopImmediatePropagation/);
assert.match(submitGuard, /sanitizeExternalContent/);
assert.match(privacyGuard, /externalRequestSent: false/);
assert.match(worker, /SENSITIVE_QUERY_BLOCKED/);
assert.match(worker, /include_raw_content: false/);
assert.match(worker, /include_answer: false/);

const sandbox = {
  window: {},
  document: {
    readyState: 'loading',
    addEventListener() {},
    getElementById() { return null; },
    querySelector() { return null; }
  },
  console
};
vm.runInNewContext(privacyGuard, sandbox);
const core = sandbox.window.GovPromptCore;
assert.equal(typeof core?.sanitizeExternalContent, 'function');

const piiCases = [
  ['เลขบัตรประชาชน 3560039645712', /3560039645712/],
  ['อีเมล test.person@example.com', /test\.person@example\.com/],
  ['มือถือ 0812345678', /0812345678/],
  ['เลขบัญชี 1234567890', /1234567890/],
  ['HN 123456', /123456/],
  ['ที่อยู่ 99 หมู่ 1 ตำบลตัวอย่าง', /99 หมู่ 1/]
];
for (const [sample, rawPattern] of piiCases) {
  const result = core.sanitizeExternalContent(sample);
  assert.equal(result.changed, true, `PII must be changed before processing: ${sample}`);
  assert.doesNotMatch(result.safeText, rawPattern, `Raw PII must not survive sanitization: ${sample}`);
}

const sensitiveCases = [
  'ผู้ป่วยมีผลเลือดผิดปกติ',
  'ข้อมูลความพิการของบุคคล',
  'ข้อมูลพันธุกรรม DNA',
  'ข้อมูลชีวมิติ ลายนิ้วมือ',
  'ข้อมูลชาติพันธุ์ของบุคคล',
  'ความคิดเห็นทางการเมืองของบุคคล',
  'ข้อมูลศาสนา พุทธ',
  'รสนิยมทางเพศของบุคคล',
  'ประวัติอาชญากรรมของบุคคล',
  'สมาชิกสหภาพแรงงาน'
];
for (const sample of sensitiveCases) {
  const result = core.sanitizeExternalContent(sample);
  assert.equal(result.blocked, true, `Sensitive data must fail closed: ${sample}`);
}

assert.doesNotMatch(home, /localStorage\.setItem\([^)]*(?:prompt|history|question)/i, 'Home must not persist raw prompt/history to localStorage');

console.log('GovPrompt Security Invariants: PASS');
