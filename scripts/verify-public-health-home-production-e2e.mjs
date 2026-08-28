import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  serviceWorkers: 'allow',
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error?.message || error)));

const url = new URL(frontend);
url.searchParams.set('public-health-shortcut-proof', `${Date.now()}-${Math.random().toString(16).slice(2)}`);
await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForFunction(
  () => document.readyState === 'complete'
    && [...document.scripts].some(script => /assets\/js\/mic\.js\?v=2\.3\.4/.test(script.src)),
  undefined,
  { timeout: 15_000 }
);

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
await page.waitForURL(/gp008\.html#tempStaffMaintenanceFundEntry$/, { timeout: 15_000 });
await page.locator('#tempStaffMaintenanceFundEntry').waitFor({ state: 'visible', timeout: 15_000 });
assert.match(await page.locator('#tempStaffMaintenanceFundEntry').innerText(), /แผนลูกจ้างเงินบำรุง/);
assert.deepEqual(pageErrors, [], `page errors: ${JSON.stringify(pageErrors)}`);

console.log(JSON.stringify({
  frontend,
  checks: {
    homeCatalogOpenerVisible: 'PASS',
    publicHealthGroupVisible: 'PASS',
    tempStaffShortcutVisible: 'PASS',
    threePublicHealthShortcutsPresent: 'PASS',
    shortcutNavigatesToGp008: 'PASS',
    gp008TempStaffEntryVisible: 'PASS',
    mobileViewport: '390x844 PASS',
    micLoaderCacheBust: '2.3.4 PASS'
  }
}, null, 2));

await browser.close();
