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
assert.match(submitGuard, /detectFailSafeRisks/);
assert.match(submitGuard, /EVERY detected PII\/sensitive signal fails closed in capture phase/);
assert.match(submitGuard, /Home\/UI\/history\/router\/search\/Worker\/API/);
assert.match(submitGuard, /\(HN\|AN\)/, 'Submit gate must explicitly normalize compact HN/AN identifiers');
assert.doesNotMatch(submitGuard, /requestSubmit\s*\(/, 'Privacy gate must not depend on form re-submit');
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
  assert.equal(result.changed, true, `PII must be detected and sanitized by core: ${sample}`);
  assert.doesNotMatch(result.safeText, rawPattern, `Raw PII must not survive core sanitization: ${sample}`);
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
  assert.equal(result.blocked, true, `Sensitive data must fail closed in core: ${sample}`);
}

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
  return { firstEvent, downstream, alerts, finalInput: input.value, guardVersion: form.dataset.privacySubmitGuard };
}

const blockedInputCases = [
  'ตรวจข้อมูล HN123456',
  'ANABC123',
  'เลขบัตรประชาชน 3560039645712',
  'เลขบัตรประชาชน12345678900',
  'อีเมล test.person@example.com',
  'มือถือ 0812345678',
  'เลขบัญชี 1234567890',
  'passport AB1234567',
  'เลขประจำตัวผู้เสียภาษี 1234567890123',
  'นายสมชาย ใจดี ขอข้อมูล',
  'วันเกิด 1 มกราคม 2530',
  'ที่อยู่ 99 หมู่ 1 ตำบลตัวอย่าง',
  'ทะเบียนรถ กข 1234',
  'ผู้ป่วยมีผลเลือดผิดปกติ',
  'ข้อมูลพันธุกรรม DNA',
  'ข้อมูลชีวมิติ ลายนิ้วมือ',
  'ความคิดเห็นทางการเมืองของบุคคล',
  'ข้อมูลศาสนา พุทธ',
  'รสนิยมทางเพศของบุคคล',
  'ประวัติอาชญากรรมของบุคคล',
  'สมาชิกสหภาพแรงงาน',
  'password=SuperSecret123',
  'ข้อมูลลับของราชการ: เอกสารทดสอบ'
];

for (const rawValue of blockedInputCases) {
  const scenario = runSubmitGateScenario(rawValue);
  assert.equal(scenario.guardVersion, '3', `privacy gate v3 must be active: ${rawValue}`);
  assert.equal(scenario.firstEvent.immediateStopped, true, `detected sensitive input must stop propagation: ${rawValue}`);
  assert.equal(scenario.firstEvent.defaultPrevented, true, `detected sensitive input must cancel submit: ${rawValue}`);
  assert.equal(scenario.downstream.length, 0, `detected sensitive input must never reach downstream: ${rawValue}`);
  assert.equal(scenario.finalInput, '', `detected sensitive input must be cleared from composer: ${rawValue}`);
  assert.ok(scenario.alerts.some(message => /บล็อกข้อมูลส่วนบุคคล\/ข้อมูลอ่อนไหวก่อนประมวลผล/.test(message)), `blocking warning required: ${rawValue}`);
}

const safeScenario = runSubmitGateScenario('ช่วยร่างหนังสือราชการเรื่องการประชุมประจำเดือน');
assert.equal(safeScenario.guardVersion, '3');
assert.equal(safeScenario.firstEvent.immediateStopped, false, 'safe input may continue');
assert.equal(safeScenario.firstEvent.defaultPrevented, false, 'safe input should not be cancelled');
assert.equal(safeScenario.downstream.length, 1, 'safe input should reach downstream exactly once');

assert.doesNotMatch(home, /localStorage\.setItem\([^)]*(?:prompt|history|question)/i, 'Home must not persist raw prompt/history to localStorage');

console.log('GovPrompt Security Invariants v3: PASS');
