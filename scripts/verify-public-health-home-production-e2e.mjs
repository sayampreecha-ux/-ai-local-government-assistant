import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ serviceWorkers: 'allow', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error?.message || error)));

const url = new URL(frontend);
url.searchParams.set('public-health-shortcut-proof', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForFunction(() => document.readyState === 'complete', undefined, { timeout: 15_000 });

const opener = page.locator('.work-catalog-open');
await opener.waitFor({ state: 'visible', timeout: 15_000 });
assert.match(await opener.innerText(), /ผู้ช่วยงานราชการทั้งหมด/);
await opener.click();

const healthGroup = page.locator('.work-catalog-group').filter({ hasText: /สาธารณสุข|รพ\.สต/i }).first();
await healthGroup.waitFor({ state: 'visible', timeout: 10_000 });
const healthToggle = healthGroup.locator('.assistant-catalog-toggle');
await healthToggle.waitFor({ state: 'visible', timeout: 10_000 });
await healthToggle.click();

const shortcut = healthGroup.locator('[data-health-shortcut="true"]').filter({ hasText: 'แผนลูกจ้างเงินบำรุง' }).first();
await shortcut.waitFor({ state: 'visible', timeout: 10_000 });
assert.match(await shortcut.innerText(), /👥\s*แผนลูกจ้างเงินบำรุง/);

const shortcutLabels = await healthGroup.locator('[data-health-shortcut="true"]').allInnerTexts();
assert.ok(shortcutLabels.some(label => /เครื่องมือหมออนามัย/.test(label)));
assert.ok(shortcutLabels.some(label => /แผนลูกจ้างเงินบำรุง/.test(label)));
assert.ok(shortcutLabels.some(label => /วันเพจลูกน้ำยุงลาย/.test(label)));

await shortcut.click();
await page.waitForURL(/temp-staff-wizard\.html$/, { timeout: 15_000 });
await page.locator('#tempStaffGuidedWizardTab').waitFor({ state: 'visible', timeout: 15_000 });
await page.locator('[data-step="1"]').waitFor({ state: 'visible', timeout: 15_000 });
const stepPills = page.locator('[data-step-pill]');
assert.equal(await stepPills.count(), 5);
const stepLabels = await stepPills.allTextContents();
assert.ok(stepLabels.some(label => /หน่วยบริการ/.test(label)));
assert.ok(stepLabels.some(label => /ภาระงาน/.test(label)));
assert.ok(stepLabels.some(label => /ตรวจและสร้างเอกสาร/.test(label)));

await page.locator('#tsgwAgency').fill('รพ.สต.ทดสอบ');
await page.locator('#tsgwFiscalYear').fill('2570');
await page.locator('#tsgwPopulation').fill('5000');
await page.locator('#tsgwAnnualServices').fill('12000');
await page.locator('#tsgwNext').click();
await page.locator('.tsgw-activity').first().fill('เยี่ยมบ้าน');
await page.locator('.tsgw-unit').first().fill('ครั้ง');
await page.locator('.tsgw-quantity').first().fill('1000');
await page.locator('.tsgw-minutes').first().fill('60');
await page.locator('#tsgwNext').click();
await page.locator('#tsgwActualFte').fill('0.5');
await page.locator('#tsgwNetHours').fill('1000');
await page.locator('#tsgwNext').click();
await page.locator('#tsgwProposedHeadcount').fill('1');
await page.locator('#tsgwRate').fill('10000');
await page.locator('#tsgwUnits').fill('12');
await page.locator('#tsgwFundBalance').fill('300000');
await page.locator('#tsgwAvgIncome').fill('100000');
await page.locator('#tsgwEssentialExpense').fill('120000');
await page.locator('#tsgwInPlan').check();
await page.locator('#tsgwNext').click();
await page.locator('#tsgwGenerate').click();
assert.match(await page.locator('#tsgwAnalysis').innerText(), /สรุปวิเคราะห์ค่างาน/);
assert.match(await page.locator('#tsgwMemo').innerText(), /บันทึกข้อความ/);
assert.match(await page.locator('#tsgwDecision').innerText(), /มีเหตุผลเสนอพิจารณาจ้าง/);
assert.deepEqual(pageErrors, [], `page errors: ${JSON.stringify(pageErrors)}`);

console.log(JSON.stringify({
  frontend,
  checks: {
    homeCatalogOpenerVisible: 'PASS',
    publicHealthGroupVisible: 'PASS',
    tempStaffShortcutVisible: 'PASS',
    shortcutNavigatesToGuidedWizard: 'PASS',
    guidedWizardVisible: '5 steps PASS',
    workloadEntryWorks: 'PASS',
    fteCalculationWorks: 'PASS',
    fundPlanCheckWorks: 'PASS',
    analysisGenerated: 'PASS',
    memoGenerated: 'PASS',
    mobileViewport: '390x844 PASS'
  }
}, null, 2));

await browser.close();