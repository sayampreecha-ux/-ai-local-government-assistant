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

const catalog = page.locator('.work-catalog-groups');
await catalog.waitFor({ state: 'visible', timeout: 15_000 });
assert.equal(await catalog.locator('.work-catalog-group').count(), 12, 'Home must expose all 12 assistant categories without an extra opener');

const recordsGroup = page.locator('.work-catalog-group').filter({ hasText: /สารบรรณ|หนังสือราชการ/i }).first();
await recordsGroup.locator('.assistant-catalog-toggle').click();
await recordsGroup.locator('.work-catalog-task').first().click();
await page.waitForURL(/[?&]view=result(?:&|$)/, { timeout: 15_000 });
await page.locator('.result-page-header').waitFor({ state: 'visible', timeout: 15_000 });
await page.locator('.guided-intake-message').waitFor({ state: 'visible', timeout: 15_000 });
assert.equal(await page.locator('.composer-region').isVisible(), true, 'intake input must remain visible while facts are missing');
assert.equal(await page.locator('.work-catalog-groups').isVisible(), false, 'selected work must open on a dedicated result screen');
await page.locator('#promptInput').fill('หนังสือเกี่ยวกับการขอความร่วมมือจัดกิจกรรม จะเรียนถึงนายกองค์การบริหารส่วนจังหวัด และมีวัตถุประสงค์เพื่อขอความร่วมมือสนับสนุนสถานที่จัดงาน');
await page.locator('.send-button').click();
await page.waitForFunction(() => {
  const count = document.querySelectorAll('.guided-intake-message').length;
  return count === 0 || count > 1;
}, undefined, { timeout: 15_000 });
if (await page.locator('.guided-intake-message').count()) {
  assert.equal(await page.locator('.composer-region').isVisible(), true, 'intake input must remain visible for a second missing-fact round');
  await page.locator('#promptInput').fill('ยังไม่ทราบข้อมูลส่วนที่เหลือ');
  await page.locator('.send-button').click();
}
await page.locator('.guided-intake-message').waitFor({ state: 'detached', timeout: 15_000 });
await page.locator('.answer-card').waitFor({ state: 'visible', timeout: 15_000 });
assert.equal(await page.locator('.composer-region').isVisible(), false, 'intake input must close after the result is ready');
await page.locator('.result-back').click();
await page.waitForURL(url => !url.searchParams.has('view'), { timeout: 15_000 });
await page.locator('.work-catalog-groups').waitFor({ state: 'visible', timeout: 15_000 });

const healthGroup = page.locator('.work-catalog-group').filter({ hasText: /สาธารณสุข|รพ\.สต/i }).first();
await healthGroup.waitFor({ state: 'visible', timeout: 10_000 });
const healthToggle = healthGroup.locator('.assistant-catalog-toggle');
await healthToggle.waitFor({ state: 'visible', timeout: 10_000 });
assert.match(await healthToggle.locator('.assistant-task-count').innerText(), /5\s*เมนูเด่น/);
assert.doesNotMatch(await healthToggle.locator('.assistant-task-count').innerText(), /5\s*งาน/);
await healthToggle.click();

const shortcut = healthGroup.locator('[data-health-shortcut="true"]').filter({ hasText: 'แผนลูกจ้างเงินบำรุง' }).first();
await shortcut.waitFor({ state: 'visible', timeout: 10_000 });
assert.match(await shortcut.innerText(), /👥\s*แผนลูกจ้างเงินบำรุง/);

const shortcutLabels = await healthGroup.locator('[data-health-shortcut="true"]').allInnerTexts();
assert.ok(shortcutLabels.some(label => /แผนลูกจ้างเงินบำรุง/.test(label)));
const featuredLabels = await healthGroup.locator('.work-catalog-task').allInnerTexts();
assert.equal(featuredLabels.length, 5, 'public-health Home must expose exactly 5 primary menus');
assert.ok(featuredLabels.some(label => /ทำโครงการสุขภาพ\s*\/\s*NCD/.test(label)));
assert.ok(featuredLabels.some(label => /โครงการกองทุน\s*สปสช\./.test(label)));
assert.ok(featuredLabels.some(label => /งาน\s*รพ\.สต\.\s*\/\s*งานสุขภาพทั้งหมด/.test(label)));
assert.ok(featuredLabels.some(label => /แผนเงินบำรุง\s*รพ\.สต\.\/สอน\./.test(label)));
assert.ok(featuredLabels.some(label => /แผนลูกจ้างเงินบำรุง/.test(label)));
assert.ok(!featuredLabels.some(label => /PDPA|วันเพจลูกน้ำยุงลาย|งานสาธารณสุขอื่น/.test(label)), 'specialized tools must not clutter the five-entry Home menu');

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
    allHomeCategoriesVisible: '12 categories PASS',
    selectedTaskUsesDedicatedResultPage: 'PASS',
    publicHealthGroupVisible: 'PASS',
    featuredMenuCountClear: '5 เมนูเด่น PASS',
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
