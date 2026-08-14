import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'allow' });
const page = await context.newPage();
let dialogs = [];
let pageErrors = [];

page.on('dialog', async dialog => {
  dialogs.push(dialog.message());
  await dialog.accept();
});
page.on('pageerror', error => pageErrors.push(String(error?.stack || error?.message || error)));

async function loadFresh(caseName) {
  dialogs = [];
  pageErrors = [];
  const url = new URL(frontend);
  url.searchParams.set('issue', '73');
  url.searchParams.set('case', caseName);
  url.searchParams.set('nonce', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(
    () => document.readyState === 'complete'
      && document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '2'
      && typeof window.GovPromptCore?.sanitizeExternalContent === 'function'
      && typeof window.GovPrompt?.toast === 'function',
    undefined,
    { timeout: 15_000 }
  );
  return page.evaluate(async () => ({
    readyState: document.readyState,
    submitGuardVersion: document.getElementById('chatForm')?.dataset?.privacySubmitGuard || '',
    scriptSources: [...document.scripts].map(script => script.src).filter(Boolean),
    serviceWorkers: 'serviceWorker' in navigator
      ? (await navigator.serviceWorker.getRegistrations()).map(registration => ({
          scope: registration.scope,
          active: registration.active?.scriptURL || null,
          waiting: registration.waiting?.scriptURL || null,
          installing: registration.installing?.scriptURL || null
        }))
      : [],
    cacheKeys: 'caches' in globalThis ? await caches.keys() : []
  }));
}

async function userMessages() {
  return page.locator('.message.user .message-body').allInnerTexts();
}

async function warningMessages() {
  const toast = await page.locator('.gp-toast').allInnerTexts();
  return [...dialogs, ...toast.filter(Boolean)];
}

async function diagnosticState() {
  return page.evaluate(() => ({
    href: location.href,
    readyState: document.readyState,
    inputValue: document.getElementById('promptInput')?.value || '',
    submitGuardVersion: document.getElementById('chatForm')?.dataset?.privacySubmitGuard || '',
    userMessages: [...document.querySelectorAll('.message.user .message-body')].map(node => node.textContent || ''),
    toast: document.querySelector('.gp-toast')?.textContent || '',
    bodyText: document.body.innerText
  }));
}

async function submitRedactable({ name, sample, forbidden, expectedMask }) {
  const runtime = await loadFresh(name);
  const before = (await userMessages()).length;
  await page.locator('#promptInput').fill(sample);
  await page.locator('#chatForm .send-button').click();
  await page.waitForTimeout(300);

  const messages = await userMessages();
  const state = await diagnosticState();
  const warnings = await warningMessages();
  assert.ok(messages.length > before, `${name}: sanitized submit did not reach Home/UI; state=${JSON.stringify({ ...state, bodyText: state.bodyText.slice(0, 500), pageErrors })}`);
  const rendered = messages.at(-1) || '';
  assert.equal(rendered.includes(forbidden), false, `${name}: raw sensitive marker leaked into user UI: ${rendered}`);
  assert.match(rendered, expectedMask, `${name}: masked marker missing from user UI: ${rendered}`);
  assert.equal(state.bodyText.includes(forbidden), false, `${name}: raw sensitive marker remained anywhere in visible UI`);
  assert.ok(warnings.some(message => /ปกปิดให้อัตโนมัติ/.test(message)), `${name}: automatic masking warning was not shown; warnings=${JSON.stringify(warnings)}`);
  assert.equal(runtime.submitGuardVersion, '2', `${name}: production submit guard v2 was not active`);
  assert.ok(runtime.scriptSources.some(src => /privacy-submit-guard\.js\?v=1\.0\.2(?:$|&)/.test(src)), `${name}: production browser did not load submit guard cache key v1.0.2`);
  return { name, rendered, warnings, runtime };
}

async function submitBlocked({ name, sample }) {
  const runtime = await loadFresh(name);
  const before = (await userMessages()).length;
  await page.locator('#promptInput').fill(sample);
  await page.locator('#chatForm .send-button').click();
  await page.waitForTimeout(300);

  const after = (await userMessages()).length;
  const inputValue = await page.locator('#promptInput').inputValue();
  const state = await diagnosticState();
  const warnings = await warningMessages();
  assert.equal(after, before, `${name}: blocked sensitive content created a user bubble; state=${JSON.stringify({ ...state, bodyText: state.bodyText.slice(0, 500), pageErrors })}`);
  assert.equal(inputValue, '', `${name}: blocked sensitive content remained in composer`);
  assert.equal(state.bodyText.includes(sample), false, `${name}: blocked raw sensitive content remained anywhere in visible UI`);
  assert.ok(warnings.some(message => /บล็อกข้อมูลอ่อนไหว|ยกเลิกการส่ง|หยุดการส่ง/.test(message)), `${name}: blocking warning was not shown; warnings=${JSON.stringify(warnings)}`);
  assert.equal(runtime.submitGuardVersion, '2', `${name}: production submit guard v2 was not active`);
  return { name, warnings, runtime };
}

const redactableCases = [
  { name: 'compact-hn', sample: 'ตรวจข้อมูล HN123456', forbidden: 'HN123456', expectedMask: /รหัสผู้ป่วย \[ปกปิด\]/ },
  { name: 'compact-an', sample: 'ตรวจข้อมูล ANABC123', forbidden: 'ANABC123', expectedMask: /รหัสผู้ป่วย \[ปกปิด\]/ },
  { name: 'thai-id', sample: 'เลขบัตรประชาชน 3560039645712', forbidden: '3560039645712', expectedMask: /\[ปกปิดเลขประจำตัว\]/ },
  { name: 'email', sample: 'อีเมล test.person@example.com', forbidden: 'test.person@example.com', expectedMask: /\[ปกปิดอีเมล\]/ },
  { name: 'phone', sample: 'มือถือ 0812345678', forbidden: '0812345678', expectedMask: /\[ปกปิดเบอร์โทร\]/ },
  { name: 'bank-account', sample: 'เลขบัญชี 1234567890', forbidden: '1234567890', expectedMask: /เลขบัญชี \[ปกปิด\]/ },
  { name: 'passport', sample: 'passport AB1234567', forbidden: 'AB1234567', expectedMask: /หนังสือเดินทาง \[ปกปิด\]/ },
  { name: 'tax-id', sample: 'เลขประจำตัวผู้เสียภาษี 1234567890123', forbidden: '1234567890123', expectedMask: /\[ปกปิด/ },
  { name: 'person-name', sample: 'นายสมชาย ใจดี ขอข้อมูล', forbidden: 'สมชาย ใจดี', expectedMask: /\[ปกปิดชื่อบุคคล\]/ },
  { name: 'birth-date', sample: 'วันเกิด 1 มกราคม 2530', forbidden: '1 มกราคม 2530', expectedMask: /วันเกิด \[ปกปิด\]/ },
  { name: 'address', sample: 'ที่อยู่ 99 หมู่ 1 ตำบลตัวอย่าง', forbidden: '99 หมู่ 1', expectedMask: /ที่อยู่ \[ปกปิด\]/ },
  { name: 'vehicle-registration', sample: 'ทะเบียนรถ กข 1234', forbidden: 'กข 1234', expectedMask: /ทะเบียนรถ \[ปกปิด\]/ },
  { name: 'long-number', sample: 'เลข 4111111111111111', forbidden: '4111111111111111', expectedMask: /\[ปกปิดชุดตัวเลข\]/ }
];

const blockedCases = [
  { name: 'health-sensitive-category', sample: 'ผู้ป่วยมีผลเลือดผิดปกติ' },
  { name: 'credential', sample: 'password=SuperSecret123' },
  { name: 'government-secret', sample: 'ข้อมูลลับของราชการ: เอกสารทดสอบ' },
  { name: 'private-key', sample: '-----BEGIN PRIVATE KEY-----\nTESTSECRET\n-----END PRIVATE KEY-----' }
];

const redactableResults = [];
for (const testCase of redactableCases) redactableResults.push(await submitRedactable(testCase));

const blockedResults = [];
for (const testCase of blockedCases) blockedResults.push(await submitBlocked(testCase));

const cacheRuntimeBefore = await loadFresh('cache-reload-before');
await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForFunction(
  () => document.readyState === 'complete'
    && document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '2'
    && typeof window.GovPrompt?.toast === 'function',
  undefined,
  { timeout: 15_000 }
);
dialogs = [];
const beforeReloadSubmit = (await userMessages()).length;
await page.locator('#promptInput').fill('ตรวจซ้ำ HN123456');
await page.locator('#chatForm .send-button').click();
await page.waitForTimeout(300);
const reloadMessages = await userMessages();
assert.ok(reloadMessages.length > beforeReloadSubmit, `cache/service-worker reload did not create sanitized user bubble; state=${JSON.stringify(await diagnosticState())}`);
const reloadRendered = reloadMessages.at(-1) || '';
assert.equal(/HN123456|123456/.test(reloadRendered), false, `cache/service-worker reload leaked HN: ${reloadRendered}`);
assert.match(reloadRendered, /รหัสผู้ป่วย \[ปกปิด\]/);
const cacheRuntimeAfter = await page.evaluate(async () => ({
  submitGuardVersion: document.getElementById('chatForm')?.dataset?.privacySubmitGuard || '',
  serviceWorkers: 'serviceWorker' in navigator
    ? (await navigator.serviceWorker.getRegistrations()).map(registration => ({ scope: registration.scope, active: registration.active?.scriptURL || null }))
    : [],
  cacheKeys: 'caches' in globalThis ? await caches.keys() : []
}));
assert.equal(cacheRuntimeAfter.submitGuardVersion, '2', 'cache/service-worker reload activated a stale submit guard');

console.log(JSON.stringify({
  frontend,
  checks: {
    redactablePiiCases: `${redactableResults.length} PASS`,
    blockedSensitiveCases: `${blockedResults.length} PASS`,
    rawHnAbsentFromUi: 'PASS',
    rawPiiAbsentFromVisibleUi: 'PASS',
    automaticMaskingWarning: 'PASS',
    blockedDataCreatesNoUserBubble: 'PASS',
    cacheServiceWorkerReload: 'PASS'
  },
  cacheServiceWorkerEvidence: {
    beforeReload: cacheRuntimeBefore,
    afterReload: cacheRuntimeAfter
  },
  renderedSamples: redactableResults.map(result => ({ name: result.name, rendered: result.rendered })),
  blockedSamples: blockedResults.map(result => ({ name: result.name, warningCount: result.warnings.length }))
}, null, 2));

await browser.close();
