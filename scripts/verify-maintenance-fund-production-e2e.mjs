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
const tabText = (await page.locator('.mfp-tab').allTextContents()).join(' ');
assert.match(tabText, /จัดทำแผน.*ติดตามการใช้เงิน.*ปรับแผน.*ภาพรวม.*เอกสารตรวจสอบ/);
assert.doesNotMatch(tabText, /Dashboard|Audit Pack|Plan vs Actual|Version Control/);
await page.locator('#mfpPersistentNav').waitFor({ state: 'visible', timeout: 10_000 });
assert.equal(await page.locator('#mfpPersistentNav [data-persistent-view]').count(), 5);
const persistentNavText = (await page.locator('#mfpPersistentNav').innerText()).replace(/\s+/g, ' ');
assert.match(persistentNavText, /แผน.*ใช้เงินจริง.*ปรับแผน.*ภาพรวม.*ตรวจเอกสาร/);
assert.match(await page.locator('#mfpPersistentNavStatus').innerText(), /อยู่ที่: จัดทำแผน/);
await page.locator('#mfpPopulation').waitFor({ state: 'visible', timeout: 10_000 });

const thresholds = await page.evaluate(() => ({
  s: window.GovPromptMaintenanceFundSML?.classifyPopulation(2500)?.code,
  mLow: window.GovPromptMaintenanceFundSML?.classifyPopulation(3000)?.code,
  mHigh: window.GovPromptMaintenanceFundSML?.classifyPopulation(8000)?.code,
  l: window.GovPromptMaintenanceFundSML?.classifyPopulation(8001)?.code
}));
assert.deepEqual(thresholds, { s: 'S', mLow: 'M', mHigh: 'M', l: 'L' });

await page.locator('#mfpFacility').fill('รพ.สต.ทดสอบระบบ');
await page.locator('#mfpPopulation').fill('5500');
await page.waitForTimeout(50);
assert.match(await page.locator('#mfpFacilitySizeLabel').inputValue(), /ขนาดกลาง \(M\)/);
assert.match(await page.locator('#mfpFacilitySizeBadge').innerText(), /ขนาดกลาง \(M\)/);
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
const savedMeta = await page.evaluate(() => {
  const current = localStorage.getItem('govprompt.maintenanceFundPlan.current.v1');
  const map = JSON.parse(localStorage.getItem('govprompt.maintenanceFundFacilityMeta.v1') || '{}');
  return current ? map[current] : null;
});
assert.equal(savedMeta?.population, 5500);
assert.equal(savedMeta?.size, 'M');

await page.locator('#mfpPersistentNav [data-persistent-view="tracking"]').click();
assert.match(await page.locator('#mfpView').innerText(), /ติดตามการใช้เงินจริงเทียบแผน/);
assert.match(await page.locator('#mfpPersistentNavStatus').innerText(), /อยู่ที่: ติดตามการใช้เงิน/);
assert.equal(await page.locator('#mfpPersistentNav').isVisible(), true);
await page.locator('[data-track-id]').first().locator('[data-track-field="committed"]').fill('100000');
await page.locator('[data-track-id]').first().locator('[data-track-field="actual"]').fill('60000');
await page.locator('[data-track-id]').nth(1).locator('[data-track-field="committed"]').fill('120000');
await page.locator('[data-track-id]').nth(1).locator('[data-track-field="actual"]').fill('30000');
await page.locator('#mfpSaveTracking').click();
assert.match(await page.locator('#mfpView').innerText(), /จ่ายจริง/);

await page.locator('#mfpPersistentNav [data-persistent-view="adjust"]').click();
assert.match(await page.locator('#mfpView').innerText(), /ปรับแผน \/ ประวัติฉบับ/);
assert.equal(await page.locator('#mfpPersistentNav').isVisible(), true);
await page.locator('#mfpRevisionReason').fill('ปรับจังหวะการใช้จ่ายให้สอดคล้องกับแผนจัดหาและผลดำเนินงานจริง');
await page.locator('#mfpCreateRevision').click();
assert.equal(await page.locator('#mfpView input[disabled]').first().inputValue(), '2');

await page.locator('#mfpPersistentNav [data-persistent-view="audit"]').click();
assert.match(await page.locator('#mfpView').innerText(), /แฟ้มเอกสารพร้อมตรวจสอบ/);
assert.equal(await page.locator('#mfpPersistentNav').isVisible(), true);
const auditChecks = page.locator('[data-audit-key]');
assert.equal(await auditChecks.count(), 14);
for (let i = 0; i < 5; i += 1) await auditChecks.nth(i).check();
await page.locator('#mfpSaveAudit').click();
assert.match(await page.locator('#mfpView').innerText(), /ครบแล้ว 5\/14 รายการ/);

await page.locator('#mfpPersistentNav [data-persistent-view="dashboard"]').click();
await page.locator('#mfpSmlDashboard').waitFor({ state: 'visible', timeout: 10_000 });
assert.equal(await page.locator('#mfpPersistentNav').isVisible(), true);
assert.match(await page.locator('#mfpView').innerText(), /รพ\.สต\.ทดสอบระบบ/);
assert.match(await page.locator('#mfpView').innerText(), /จำนวนแผน/);
assert.match(await page.locator('#mfpSmlDashboard').innerText(), /เปรียบเทียบตามขนาดหน่วยบริการ/);
assert.match(await page.locator('#mfpSmlDashboard').innerText(), /ขนาดกลาง \(M\) 1/);
assert.match(await page.locator('.mfp-facility').first().innerText(), /ขนาดกลาง \(M\)/);
await page.locator('[data-sml-filter="M"]').click();
assert.equal(await page.locator('.mfp-facility:not([hidden])').count(), 1);
await page.locator('[data-sml-filter="S"]').click();
assert.equal(await page.locator('.mfp-facility:not([hidden])').count(), 0);

await page.locator('#mfpPersistentNav [data-persistent-view="plan"]').click();
await page.locator('#mfpFacility').waitFor({ state: 'visible', timeout: 10_000 });
assert.match(await page.locator('#mfpPersistentNavStatus').innerText(), /อยู่ที่: จัดทำแผน/);
assert.equal(await page.locator('#mfpPersistentNav [data-persistent-view="plan"]').getAttribute('aria-current'), 'page');
assert.deepEqual(errors, [], `page errors: ${JSON.stringify(errors)}`);

console.log(JSON.stringify({
  checks: {
    homeShortcutVisible: 'PASS',
    maintenanceFundWorkspaceVisible: 'PASS',
    plainThaiMenuLabels: 'PASS',
    persistentNavigationAlwaysVisible: 'PASS',
    persistentNavigationRoundTrip: 'PASS',
    smlClassifier: 'S/M/L boundaries PASS',
    smlThaiSizeLabels: 'PASS',
    smlPopulationPersistence: 'PASS',
    elevenCategoryPlanFlow: 'PASS',
    financeForecast: 'PASS',
    planVsActual: 'PASS',
    versionControl: 'PASS',
    auditPack: 'PASS',
    smlDashboardAndFilter: 'PASS',
    dashboard: 'PASS',
    mobileViewport: '390x844 PASS'
  }
}, null, 2));

await browser.close();