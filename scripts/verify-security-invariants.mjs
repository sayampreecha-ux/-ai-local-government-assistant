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
assert.match(submitGuard, /requestSubmit/);
assert.match(submitGuard, /terminated before Home\/UI\/router\/search\/history can observe it/);
assert.match(submitGuard, /\(HN\|AN\)/, 'Submit gate must explicitly normalize compact HN/AN identifiers');
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

// Issue #73 regression lock: the capture-phase submit gate must stop the raw
// event, mask redactable PII, warn, and only then create a brand-new safe submit.
function runSubmitGateScenario(rawValue) {
  let captureHandler;
  const microtasks = [];
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
    },
    requestSubmit() {
      dispatch();
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
    queueMicrotask(callback) { microtasks.push(callback); },
    console
  };

  vm.runInNewContext(submitGuard, submitSandbox);
  assert.equal(typeof captureHandler, 'function', 'submit privacy gate must install in capture phase');
  const firstEvent = dispatch();
  while (microtasks.length) microtasks.shift()();
  return { firstEvent, downstream, alerts, finalInput: input.value };
}

const hnScenario = runSubmitGateScenario('ตรวจข้อมูล HN123456');
assert.equal(hnScenario.firstEvent.immediateStopped, true, 'raw HN submit must be stopped before Home handler');
assert.equal(hnScenario.firstEvent.defaultPrevented, true, 'raw HN submit must be cancelled');
assert.equal(hnScenario.downstream.length, 1, 'only the sanitized re-submit may reach downstream');
assert.doesNotMatch(hnScenario.downstream[0], /HN123456|123456/, 'raw HN must never reach downstream/UI');
assert.match(hnScenario.downstream[0], /\[ปกปิด\]/, 'sanitized HN marker must reach downstream instead');
assert.ok(hnScenario.alerts.some(message => /ปกปิดให้อัตโนมัติ/.test(message)), 'PII masking warning must be shown');

for (const rawValue of [
  'เลขบัตรประชาชน 3560039645712',
  'อีเมล test.person@example.com',
  'มือถือ 0812345678',
  'เลขบัญชี 1234567890'
]) {
  const scenario = runSubmitGateScenario(rawValue);
  assert.equal(scenario.firstEvent.immediateStopped, true, `raw PII submit must be stopped: ${rawValue}`);
  assert.equal(scenario.downstream.length, 1, `sanitized re-submit expected: ${rawValue}`);
  assert.equal(scenario.downstream[0].includes(rawValue.replace(/^.*?\s/, '')), false, `raw value must not reach downstream: ${rawValue}`);
}

const sensitiveScenario = runSubmitGateScenario('ผู้ป่วยมีผลเลือดผิดปกติ');
assert.equal(sensitiveScenario.firstEvent.immediateStopped, true, 'special-category data must be stopped');
assert.equal(sensitiveScenario.downstream.length, 0, 'blocked sensitive context must never auto re-submit');
assert.equal(sensitiveScenario.finalInput, '', 'blocked sensitive context must be removed from composer');
assert.ok(sensitiveScenario.alerts.some(message => /บล็อกข้อมูลอ่อนไหว/.test(message)), 'blocking warning must be shown');

assert.doesNotMatch(home, /localStorage\.setItem\([^)]*(?:prompt|history|question)/i, 'Home must not persist raw prompt/history to localStorage');

console.log('GovPrompt Security Invariants: PASS');
