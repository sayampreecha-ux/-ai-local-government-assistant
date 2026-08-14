import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
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
      && document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '3'
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
  const privacyWarning = await page.locator('.privacy-submit-warning:not([hidden])').allInnerTexts();
  return [...dialogs, ...toast.filter(Boolean), ...privacyWarning.filter(Boolean)];
}

async function diagnosticState() {
  return page.evaluate(() => ({
    href: location.href,
    readyState: document.readyState,
    inputValue: document.getElementById('promptInput')?.value || '',
    submitGuardVersion: document.getElementById('chatForm')?.dataset?.privacySubmitGuard || '',
    userMessages: [...document.querySelectorAll('.message.user .message-body')].map(node => node.textContent || ''),
    toast: document.querySelector('.gp-toast')?.textContent || '',
    privacyWarning: document.querySelector('.privacy-submit-warning:not([hidden])')?.textContent || '',
    bodyText: document.body.innerText
  }));
}

async function submitMustBlock({ name, sample, forbidden = sample }) {
  const runtime = await loadFresh(name);
  const before = (await userMessages()).length;
  await page.locator('#promptInput').fill(sample);
  await page.locator('#chatForm .send-button').click();
  await page.waitForTimeout(300);

  const after = (await userMessages()).length;
  const inputValue = await page.locator('#promptInput').inputValue();
  const state = await diagnosticState();
  const warnings = await warningMessages();
  assert.equal(after, before, `${name}: blocked content created a user bubble; state=${JSON.stringify({ ...state, bodyText: state.bodyText.slice(0, 500), pageErrors })}`);
  assert.equal(inputValue, '', `${name}: blocked content remained in composer`);
  assert.equal(state.bodyText.includes(forbidden), false, `${name}: raw sensitive content remained anywhere in visible UI`);
  assert.ok(warnings.some(message => /บล็อกข้อมูลส่วนบุคคล\/ข้อมูลอ่อนไหวก่อนประมวลผล/.test(message)), `${name}: blocking warning was not shown; warnings=${JSON.stringify(warnings)}`);
  assert.match(state.privacyWarning, /บล็อกข้อมูลส่วนบุคคล\/ข้อมูลอ่อนไหวก่อนประมวลผล/, `${name}: dedicated blocking warning surface was not visible`);
  assert.equal(runtime.submitGuardVersion, '3', `${name}: production submit guard v3 was not active`);
  return { name, warnings, runtime };
}

const blockedCases = [
  { name: 'compact-hn', sample: 'ตรวจข้อมูล HN123456', forbidden: 'HN123456' },
  { name: 'compact-an', sample: 'ตรวจข้อมูล ANABC123', forbidden: 'ANABC123' },
  { name: 'thai-id', sample: 'เลขบัตรประชาชน 3560039645712', forbidden: '3560039645712' },
  { name: 'mobile-partial-thai-id-exact-regression', sample: 'เลขบัตรประชาชน12345678900', forbidden: '12345678900' },
  { name: 'email', sample: 'อีเมล test.person@example.com', forbidden: 'test.person@example.com' },
  { name: 'phone', sample: 'มือถือ 0812345678', forbidden: '0812345678' },
  { name: 'bank-account', sample: 'เลขบัญชี 1234567890', forbidden: '1234567890' },
  { name: 'passport', sample: 'passport AB1234567', forbidden: 'AB1234567' },
  { name: 'tax-id', sample: 'เลขประจำตัวผู้เสียภาษี 1234567890123', forbidden: '1234567890123' },
  { name: 'person-name', sample: 'นายสมชาย ใจดี ขอข้อมูล', forbidden: 'สมชาย ใจดี' },
  { name: 'birth-date', sample: 'วันเกิด 1 มกราคม 2530', forbidden: '1 มกราคม 2530' },
  { name: 'address', sample: 'ที่อยู่ 99 หมู่ 1 ตำบลตัวอย่าง', forbidden: '99 หมู่ 1' },
  { name: 'vehicle-registration', sample: 'ทะเบียนรถ กข 1234', forbidden: 'กข 1234' },
  { name: 'health-sensitive-category', sample: 'ผู้ป่วยมีผลเลือดผิดปกติ' },
  { name: 'genetic-sensitive-category', sample: 'ข้อมูลพันธุกรรม DNA' },
  { name: 'biometric-sensitive-category', sample: 'ข้อมูลชีวมิติ ลายนิ้วมือ' },
  { name: 'ethnicity-sensitive-category', sample: 'ข้อมูลชาติพันธุ์ของบุคคล' },
  { name: 'political-sensitive-category', sample: 'ความคิดเห็นทางการเมืองของบุคคล' },
  { name: 'religion-sensitive-category', sample: 'ข้อมูลศาสนา พุทธ' },
  { name: 'sexual-sensitive-category', sample: 'รสนิยมทางเพศของบุคคล' },
  { name: 'criminal-sensitive-category', sample: 'ประวัติอาชญากรรมของบุคคล' },
  { name: 'union-sensitive-category', sample: 'สมาชิกสหภาพแรงงาน' },
  { name: 'credential', sample: 'password=SuperSecret123' },
  { name: 'government-secret', sample: 'ข้อมูลลับของราชการ: เอกสารทดสอบ' },
  { name: 'private-key', sample: '-----BEGIN PRIVATE KEY-----\nTESTSECRET\n-----END PRIVATE KEY-----' }
];

const blockedResults = [];
for (const testCase of blockedCases) blockedResults.push(await submitMustBlock(testCase));

const cacheRuntimeBefore = await loadFresh('cache-reload-before');
await page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForFunction(
  () => document.readyState === 'complete'
    && document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '3'
    && typeof window.GovPrompt?.toast === 'function',
  undefined,
  { timeout: 15_000 }
);
dialogs = [];
const beforeReloadSubmit = (await userMessages()).length;
await page.locator('#promptInput').fill('เลขบัตรประชาชน12345678900');
await page.locator('#chatForm .send-button').click();
await page.waitForTimeout(300);
const afterReloadSubmit = (await userMessages()).length;
const reloadState = await diagnosticState();
assert.equal(afterReloadSubmit, beforeReloadSubmit, 'cache/service-worker reload allowed sensitive content to create a user bubble');
assert.equal(reloadState.inputValue, '', 'cache/service-worker reload left sensitive content in composer');
assert.equal(reloadState.bodyText.includes('12345678900'), false, 'cache/service-worker reload leaked partial Thai ID');
const cacheRuntimeAfter = await page.evaluate(async () => ({
  submitGuardVersion: document.getElementById('chatForm')?.dataset?.privacySubmitGuard || '',
  serviceWorkers: 'serviceWorker' in navigator
    ? (await navigator.serviceWorker.getRegistrations()).map(registration => ({ scope: registration.scope, active: registration.active?.scriptURL || null }))
    : [],
  cacheKeys: 'caches' in globalThis ? await caches.keys() : []
}));
assert.equal(cacheRuntimeAfter.submitGuardVersion, '3', 'cache/service-worker reload activated a stale submit guard');

console.log(JSON.stringify({
  frontend,
  checks: {
    allDetectedSensitiveInputsBlocked: `${blockedResults.length} PASS`,
    exactMobilePartialThaiIdRegression: 'PASS',
    rawHnAbsentFromUi: 'PASS',
    rawPiiAbsentFromVisibleUi: 'PASS',
    noSensitiveUserBubble: 'PASS',
    composerClearedOnBlock: 'PASS',
    blockingWarning: 'PASS',
    cacheServiceWorkerReload: 'PASS'
  },
  cacheServiceWorkerEvidence: {
    beforeReload: cacheRuntimeBefore,
    afterReload: cacheRuntimeAfter
  },
  blockedSamples: blockedResults.map(result => ({ name: result.name, warningCount: result.warnings.length }))
}, null, 2));

await browser.close();
