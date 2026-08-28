import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await context.addInitScript(() => {
  for (const key of Object.keys(localStorage)) if (key.startsWith('govprompt.maintenanceFund')) localStorage.removeItem(key);
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(String(error?.stack || error?.message || error)));

const home = new URL(root);
home.searchParams.set('maintenance-fund-proof', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
await page.goto(home.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.locator('.work-catalog-open').waitFor({ state: 'visible', timeout: 15_000 });
await page.locator('.work-catalog-open').click();
const healthGroup = page.locator('.work-catalog-group').filter({ hasText: /สาธารณสุข|รพ\.สต/i }).first();
await healthGroup.waitFor({ state: 'visible', timeout: 15_000 });
await healthGroup.locator('.assistant-catalog-toggle').click();
const shortcut = healthGroup.locator('[data-health-shortcut="true"]').filter({ hasText: 'แผนและติดตามเงินบำรุง' }).first();
await shortcut.waitFor({ state: 'visible', timeout: 15_000 });
assert.match(await shortcut.innerText(), /แผนและติดตามเงินบำรุง/);
await shortcut.click();
await page.waitForURL(/maintenance-fund-plan\.html$/, { timeout: 15_000 });

await page.locator('#maintenanceFundApp .mfp-tabs').waitFor({ state: 'visible', timeout: 15_000 });
assert.equal(await page.locator('.mfp-tab').count(), 5);
assert.match((await page.locator('.mfp-tab').allTextContents()).join(' '), /จัดทำแผน.*ติดตามผล.*ปรับแผน.*Dashboard.*Audit Pack/);

await page.locator('#mfpFacility').fill('รพ.สต.ทดสอบระบบ');
await page.locator('#mfpFiscalYear').fill('2570');
await page.locator('#mfpOpening').fill('300000');
await page.locator('#mfpCommitments').fill('20000');
await page.locator('#mfpReserve').fill('30000');
let income = page.locator('[data-income-id]').first();
await income.locator('[data-income-field="source"]').fill('ค่าบริการสาธารณสุข');
await income.locator('[data-income-field="amount"]').fill('200000');

let expenses = page.locator('[data-expense-id]');
let first = expenses.first();
await first.locator('[data-expense-field="category"]').selectOption('2');
first = page.locator('[data-expense-id]').first();
await first.locator('[data-expense-field="item"]').fill('วัสดุการแพทย์และวัสดุสำนักงาน');
await first.locator('[data-expense-field="amount"]').fill('120000');
await first.locator('[data-expense-field="month"]').selectOption('nov');
await first.locator('[data-expense-check="procurementRequired"]').check();
await first.locator('[data-expense-check="procurementPlan"]').check();

await page.locator('#mfpAddExpense').click();
expenses = page.locator('[data-expense-id]');
assert.equal(await expenses.count(), 2);
let second = expenses.nth(1);
await second.locator('[data-expense-field="category"]').selectOption('8');
second = page.locator('[data-expense-id]').nth(1);
await second.locator('[data-expense-field="item"]').fill('ค่าจ้างลูกจ้างชั่วคราวตามแผนกำลังคน');
await second.locator('[data-expense-field="amount"]').fill('120000');
await second.locator('[data-expense-field="month"]').selectOption('oct');
await second.locator('[data-expense-check="linkedTempStaff"]').check();

await page.locator('#mfpSave').click();
assert.match(await page.locator('#mfpView').innerText(), /คาดการณ์ปลายปี/);
assert.match(await page.locator('#mfpView').innerText(), /210,000|210000/);

await page.locator('[data-view="tracking"]').click();
await page.locator('[data-track-id]').first().locator('[data-track-field="committed"]').fill('100000');
await page.locator('[data-track-id]').first().locator('[data-track-field="actual"]').fill('60000');
await page.locator('[data-track-id]').nth(1).locator('[data-track-field="committed"]').fill('120000');
await page.locator('[data-track-id]').nth(1).locator('[data-track-field="actual"]').fill('30000');
await page.locator('#mfpSaveTracking').click();
assert.match(await page.locator('#mfpView').innerText(), /จ่ายจริง/);

await page.locator('[data-view="adjust"]').click();
await page.locator('#mfpRevisionReason').fill('ปรับจังหวะการใช้จ่ายให้สอดคล้องกับแผนจัดหาและผลดำเนินงานจริง');
await page.locator('#mfpCreateRevision').click();
assert.equal(await page.locator('#mfpView input[disabled]').first().inputValue(), '2');

await page.locator('[data-view="audit"]').click();
const auditChecks = page.locator('[data-audit-key]');
assert.equal(await auditChecks.count(), 14);
for (let i = 0; i < 5; i += 1) await auditChecks.nth(i).check();
await page.locator('#mfpSaveAudit').click();
assert.match(await page.locator('#mfpView').innerText(), /ครบแล้ว 5\/14 รายการ/);

await page.locator('[data-view="dashboard"]').click();
assert.match(await page.locator('#mfpView').innerText(), /รพ\.สต\.ทดสอบระบบ/);
assert.match(await page.locator('#mfpView').innerText(), /จำนวนแผน/);
assert.deepEqual(errors, [], `page errors: ${JSON.stringify(errors)}`);

console.log(JSON.stringify({
  checks: {
    homeShortcutVisible: 'PASS',
    maintenanceFundWorkspaceVisible: 'PASS',
    elevenCategoryPlanFlow: 'PASS',
    financeForecast: 'PASS',
    planVsActual: 'PASS',
    versionControl: 'PASS',
    auditPack: 'PASS',
    dashboard: 'PASS',
    mobileViewport: '390x844 PASS'
  }
}, null, 2));

await browser.close();