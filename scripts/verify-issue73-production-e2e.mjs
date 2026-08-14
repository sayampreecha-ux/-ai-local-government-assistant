import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'allow' });
const page = await context.newPage();
let dialogs = [];

page.on('dialog', async dialog => {
  dialogs.push(dialog.message());
  await dialog.accept();
});

async function loadFresh(caseName) {
  dialogs = [];
  const url = new URL(frontend);
  url.searchParams.set('issue', '73');
  url.searchParams.set('case', caseName);
  url.searchParams.set('nonce', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(
    () => document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '2',
    undefined,
    { timeout: 15_000 }
  );
  return page.evaluate(async () => ({
    submitGuardVersion: document.getElementById('chatForm')?.dataset?.privacySubmitGuard || '',
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

async function submitRedactable({ name, sample, forbidden, expectedMask }) {
  const runtime = await loadFresh(name);
  const before = (await userMessages()).length;
  await page.locator('#promptInput').fill(sample);
  await page.locator('#chatForm .send-button').click();
  await page.waitForFunction(
    previous => document.querySelectorAll('.message.user .message-body').length > previous,
    before,
    { timeout: 10_000 }
  );

  const messages = await userMessages();
  const rendered = messages.at(-1) || '';
  assert.equal(rendered.includes(forbidden), false, `${name}: raw sensitive marker leaked into user UI: ${rendered}`);
  assert.match(rendered, expectedMask, `${name}: masked marker missing from user UI: ${rendered}`);
  assert.ok(dialogs.some(message => /ปกปิดให้อัตโนมัติ/.test(message)), `${name}: automatic masking warning was not shown`);
  assert.equal(runtime.submitGuardVersion, '2', `${name}: production submit guard v2 was not active`);
  return { name, rendered, dialogs: [...dialogs], runtime };
}

async function submitBlocked({ name, sample }) {
  const runtime = await loadFresh(name);
  const before = (await userMessages()).length;
  await page.locator('#promptInput').fill(sample);
  await page.locator('#chatForm .send-button').click();
  await page.waitForTimeout(500);

  const after = (await userMessages()).length;
  const inputValue = await page.locator('#promptInput').inputValue();
  assert.equal(after, before, `${name}: blocked sensitive content created a user bubble`);
  assert.equal(inputValue, '', `${name}: blocked sensitive content remained in composer`);
  assert.ok(dialogs.some(message => /บล็อกข้อมูลอ่อนไหว|ยกเลิกการส่ง|หยุดการส่ง/.test(message)), `${name}: blocking warning was not shown`);
  assert.equal(runtime.submitGuardVersion, '2', `${name}: production submit guard v2 was not active`);
  return { name, dialogs: [...dialogs], runtime };
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

// Exercise a reload in the same browser context so an installed service worker or
// browser cache participates. HN must still never appear in the user bubble.
const cacheRuntimeBefore = await loadFresh('cache-reload-before');
await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForFunction(
  () => document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '2',
  undefined,
  { timeout: 15_000 }
);
dialogs = [];
const beforeReloadSubmit = (await userMessages()).length;
await page.locator('#promptInput').fill('ตรวจซ้ำ HN123456');
await page.locator('#chatForm .send-button').click();
await page.waitForFunction(
  previous => document.querySelectorAll('.message.user .message-body').length > previous,
  beforeReloadSubmit,
  { timeout: 10_000 }
);
const reloadRendered = (await userMessages()).at(-1) || '';
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
    automaticMaskingWarning: 'PASS',
    blockedDataCreatesNoUserBubble: 'PASS',
    cacheServiceWorkerReload: 'PASS'
  },
  cacheServiceWorkerEvidence: {
    beforeReload: cacheRuntimeBefore,
    afterReload: cacheRuntimeAfter
  },
  renderedSamples: redactableResults.map(result => ({ name: result.name, rendered: result.rendered })),
  blockedSamples: blockedResults.map(result => ({ name: result.name, warningCount: result.dialogs.length }))
}, null, 2));

await browser.close();
