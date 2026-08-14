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
assert.match(submitGuard, /normalizeCompactPatientIds/);
assert.match(submitGuard, /applyFailSafeRedactions/);
assert.match(submitGuard, /replaced synchronously in capture phase/);
assert.match(submitGuard, /before Home\/UI\/router\/search\/history can observe the submit/);
assert.match(submitGuard, /\(HN\|AN\)/, 'Submit gate must explicitly normalize compact HN/AN identifiers');
assert.doesNotMatch(submitGuard, /requestSubmit\s*\(/, 'Redactable PII must not depend on native form re-submit');
assert.match(privacyGuard, /externalRequestSent: false/);
assert.match(privacyGuard, /protectMaskMarkers/);
assert.doesNotMatch(privacyGuard, /addEventListener\(\s*['"]submit['"]/, 'privacy-guard.js must never install a second submit boundary');
assert.doesNotMatch(privacyGuard, /requestSubmit\s*\(/, 'privacy-guard.js must never own native form resubmission');
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

// Issue #73: masking must be idempotent. The submit guard deliberately runs
// post-check/final-check passes, so canonical mask markers must survive byte-for-
// byte and never be interpreted as fresh PII on a later pass.
const idempotentPiiCases = [
  ['ตรวจข้อมูล HN 123456', /รหัสผู้ป่วย \[ปกปิด\]/],
  ['เลขบัตรประชาชน 3560039645712', /\[ปกปิดเลขประจำตัว\]/],
  ['อีเมล test.person@example.com', /\[ปกปิดอีเมล\]/],
  ['มือถือ 0812345678', /\[ปกปิดเบอร์โทร\]/],
  ['เลขบัญชี 1234567890', /เลขบัญชี \[ปกปิด\]/],
  ['passport AB1234567', /หนังสือเดินทาง \[ปกปิด\]/],
  ['เลขประจำตัวผู้เสียภาษี 1234567890123', /\[ปกปิด/],
  ['นายสมชาย ใจดี ขอข้อมูล', /\[ปกปิดชื่อบุคคล\]/],
  ['วันเกิด 1 มกราคม 2530', /วันเกิด \[ปกปิด\]/],
  ['ที่อยู่ 99 หมู่ 1 ตำบลตัวอย่าง', /ที่อยู่ \[ปกปิด\]/],
  ['ทะเบียนรถ กข 1234', /ทะเบียนรถ \[ปกปิด\]/],
  ['เลข 4111111111111111', /\[ปกปิดชุดตัวเลข\]/]
];
for (const [sample, expectedMask] of idempotentPiiCases) {
  const first = core.sanitizeExternalContent(sample);
  assert.equal(first.changed, true, `first pass must mask PII: ${sample}`);
  assert.equal(first.blocked, false, `redactable PII must remain processable after masking: ${sample}`);
  assert.match(first.safeText, expectedMask, `canonical mask missing after first pass: ${sample}`);
  const second = core.sanitizeExternalContent(first.safeText);
  assert.equal(second.safeText, first.safeText, `mask must be byte-stable on second pass: ${sample}`);
  assert.equal(second.changed, false, `mask must not be re-redacted on second pass: ${sample}`);
  assert.equal(second.blocked, false, `masked text must stay unblocked on second pass: ${sample}`);
}

const personName = core.sanitizeExternalContent('นายสมชาย ใจดี ขอข้อมูล');
assert.match(personName.safeText, /\[ปกปิดชื่อบุคคล\]/, 'person name must use canonical marker');
assert.doesNotMatch(personName.safeText, /สมชาย|ใจดี/, 'raw person name must not survive');
assert.doesNotMatch(personName.safeText, /\[ปกปิด\s+ชื่อ\s+\[ปกปิด\]/, 'mask marker must never redact itself');

const compactPatientIdPattern = /\b(HN|AN)\s*[:：#-]?\s*([A-Za-z0-9/-]{3,30})\b/gi;
for (const sample of ['HN123456', 'ANABC123', 'HN:123456', 'AN-ABC123']) {
  const normalized = sample.replace(compactPatientIdPattern, '$1 $2');
  const result = core.sanitizeExternalContent(normalized);
  assert.equal(result.changed, true, `Compact patient ID must be normalized then redacted: ${sample}`);
  assert.doesNotMatch(result.safeText, /123456|ABC123/, `Raw compact patient ID must not survive submit gate: ${sample}`);
  assert.match(result.safeText, /รหัสผู้ป่วย \[ปกปิด\]/);
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

// Issue #73 regression lock: the capture-phase submit gate must rewrite
// redactable PII before downstream Home/UI can read the input. Special-category
// sensitive data must cancel the event and never reach downstream at all.
function runSubmitGateScenario(rawValue) {
  let captureHandler;
  const downstream = [];
  const alerts = [];
  const input = {
    value: rawValue,
    dispatchEvent() {},
    focus() {}
  };
  const form = {
    dataset: {},
    addEventListener(type, handler, capture) {
      assert.equal(type, 'submit');
      assert.equal(capture, true);
      captureHandler = handler;
    }
  };

  function dispatch() {
    const event = {
      defaultPrevented: false,
      immediateStopped: false,
      preventDefault() { this.defaultPrevented = true; },
      stopImmediatePropagation() { this.immediateStopped = true; }
    };
    captureHandler(event);
    if (!event.immediateStopped) downstream.push(input.value.trim());
    return event;
  }

  const submitSandbox = {
    window: {
      GovPromptCore: core,
      alert(message) { alerts.push(String(message)); }
    },
    document: {
      readyState: 'complete',
      getElementById(id) {
        if (id === 'chatForm') return form;
        if (id === 'promptInput') return input;
        return null;
      },
      addEventListener() {}
    },
    Event: class Event {
      constructor(type, options = {}) { this.type = type; this.bubbles = Boolean(options.bubbles); }
    },
    console
  };

  vm.runInNewContext(submitGuard, submitSandbox);
  assert.equal(typeof captureHandler, 'function', 'submit privacy gate must install in capture phase');
  const firstEvent = dispatch();
  return { firstEvent, downstream, alerts, finalInput: input.value };
}

const hnScenario = runSubmitGateScenario('ตรวจข้อมูล HN123456');
assert.equal(hnScenario.firstEvent.immediateStopped, false, 'sanitized HN event may continue only after DOM value is rewritten');
assert.equal(hnScenario.firstEvent.defaultPrevented, false, 'sanitized HN event should continue to Home');
assert.equal(hnScenario.downstream.length, 1, 'exactly one sanitized submit may reach downstream');
assert.doesNotMatch(hnScenario.downstream[0], /HN123456|123456/, 'raw HN must never reach downstream/UI');
assert.match(hnScenario.downstream[0], /\[ปกปิด\]/, 'sanitized HN marker must reach downstream instead');
assert.ok(hnScenario.alerts.some(message => /ปกปิดให้อัตโนมัติ/.test(message)), 'PII masking warning must be shown');

for (const rawValue of [
  'เลขบัตรประชาชน 3560039645712',
  'อีเมล test.person@example.com',
  'มือถือ 0812345678',
  'เลขบัญชี 1234567890',
  'นายสมชาย ใจดี ขอข้อมูล'
]) {
  const scenario = runSubmitGateScenario(rawValue);
  assert.equal(scenario.firstEvent.immediateStopped, false, `redactable PII may continue only after rewrite: ${rawValue}`);
  assert.equal(scenario.downstream.length, 1, `one sanitized submit expected: ${rawValue}`);
  assert.equal(scenario.downstream[0].includes(rawValue.replace(/^.*?\s/, '')), false, `raw value must not reach downstream: ${rawValue}`);
  assert.ok(scenario.alerts.some(message => /ปกปิดให้อัตโนมัติ/.test(message)), `mask warning required: ${rawValue}`);
}
assert.match(runSubmitGateScenario('นายสมชาย ใจดี ขอข้อมูล').downstream[0], /\[ปกปิดชื่อบุคคล\]/, 'submit boundary must preserve canonical person-name marker');

const sensitiveScenario = runSubmitGateScenario('ผู้ป่วยมีผลเลือดผิดปกติ');
assert.equal(sensitiveScenario.firstEvent.immediateStopped, true, 'special-category data must be stopped');
assert.equal(sensitiveScenario.firstEvent.defaultPrevented, true, 'special-category data submit must be cancelled');
assert.equal(sensitiveScenario.downstream.length, 0, 'blocked sensitive context must never reach downstream');
assert.equal(sensitiveScenario.finalInput, '', 'blocked sensitive context must be removed from composer');
assert.ok(sensitiveScenario.alerts.some(message => /บล็อกข้อมูลอ่อนไหว/.test(message)), 'blocking warning must be shown');

assert.doesNotMatch(home, /localStorage\.setItem\([^)]*(?:prompt|history|question)/i, 'Home must not persist raw prompt/history to localStorage');

console.log('GovPrompt Security Invariants: PASS');
