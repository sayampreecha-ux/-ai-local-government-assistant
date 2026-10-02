import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';
import { requiredCases } from '../tests/fixtures/gp223-test-helper.mjs';

const root = resolve('.');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const target = resolve(root, `.${path === '/' ? '/index.html' : decodeURIComponent(path)}`);
  if (!target.startsWith(`${root}${sep}`)) return response.writeHead(403).end();
  try { const body = await readFile(target); response.writeHead(200, { 'Content-Type': `${types[extname(target)] || 'application/octet-stream'}; charset=utf-8` }).end(body); }
  catch { response.writeHead(404).end(); }
});
await new Promise(resolveServer => server.listen(0, '127.0.0.1', resolveServer));
const frontend = process.env.GOVPROMPT_FRONTEND_URL || `http://127.0.0.1:${server.address().port}/index.html`;
const frontendOrigin = new URL(frontend).origin;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.testCopiedPrompt = text; } } });
  });
  await page.route('**/*', route => new URL(route.request().url()).origin === frontendOrigin ? route.continue() : route.abort());
  await page.goto(frontend);
  await page.waitForFunction(() => window.GovPromptCore?.prepareGP223IntakeTurn && document.getElementById('chatForm')?.dataset.privacySubmitGuard);
  await page.evaluate(() => {
    window.testSearchCalls = 0;
    window.GovPromptCore.officialSearchConnector = { ...window.GovPromptCore.officialSearchConnector, search: async () => {
      window.testSearchCalls++;
      return { mode: 'disabled', results: [], evidence: { primaryResults: [] }, warning: 'TEST_SEARCH_SPY' };
    } };
  });
  async function resetCase() {
    await page.goto(frontend);
    await page.waitForFunction(() => document.readyState === 'complete' && window.GovPromptCore?.prepareGP223IntakeTurn);
  await page.evaluate(() => {
    window.testSearchCalls = 0;
    window.GovPromptCore.officialSearchConnector = { ...window.GovPromptCore.officialSearchConnector, search: async () => {
      window.testSearchCalls++;
      return { mode: 'disabled', results: [], evidence: { primaryResults: [] }, warning: 'TEST_SEARCH_SPY' };
    } };
  });
  }
  async function submit(question) {
    const before = await page.locator('.message:not(.guided-intake-message) .answer-card').count();
    await page.locator('#promptInput').fill(question);
    await page.locator('#chatForm .send-button').click();
    await page.waitForFunction(count => document.querySelectorAll('.message:not(.guided-intake-message) .answer-card').length > count, before);
    await page.waitForFunction(() => [...document.querySelectorAll('.message:not(.guided-intake-message) .answer-card')].at(-1)?.dataset.leanModeReady === 'true');
    return page.locator('.message:not(.guided-intake-message) .answer-card').last();
  }
  async function checkHandoff(card, expected) {
    const prompt = await card.locator('pre').textContent();
    assert.match(prompt, /SPECIALIZED WORKFLOW:.*GP223/);
    assert.match(prompt, expected);
    const privacy = await card.evaluate(element => {
      const result = window.GovPromptCore.sanitizeExternalContent(window.GovPromptCore.gp223HandoffPrompts.get(element));
      return { blocked: result.blocked, blocking: result.blockingRisks, sensitive: result.sensitiveContext, residual: result.residualRisks };
    });
    assert.equal(privacy.blocked, false, JSON.stringify(privacy));
    await page.evaluate(() => { window.testCopiedPrompt = undefined; });
    assert.equal(await card.locator('button.prompt-copy-secondary').count(), 1, JSON.stringify(await card.locator('button').allTextContents()));
    await card.locator('button.prompt-copy-secondary').click();
    await page.waitForFunction(() => typeof window.testCopiedPrompt === 'string');
    const copied = await page.evaluate(() => window.testCopiedPrompt);
    assert.match(copied, /SPECIALIZED WORKFLOW:.*GP223/);
    for (const gate of ['Travel Expense Gate', 'External-Person Training Gate', 'Five-Document Consistency Gate', 'Legacy Citation / Supersession Check']) {
      assert.equal(copied.includes(gate), true, `copied prompt lost ${gate}`);
    }
    assert.equal(expected.test(copied), true, copied.split('\n').filter(line => /Gate|ปกปิด|Decision Lock/.test(line)).join('\n'));
    assert.equal(await card.locator('.answer-actions a').count(), 0, 'GP223 must not offer a specialized form');
    assert.equal(await page.locator('dialog[open]').count(), 0, 'GP223 must not open a modal');
    assert.equal(await page.evaluate(() => window.testSearchCalls), 0, 'GP223 must never call the automatic connector');
    return copied;
  }
  for (const item of requiredCases) {
    await resetCase();
    const card = await submit(item.question);
    await checkHandoff(card, item.expect);
    console.log(`GP223 browser case ${item.id}: PASS (no search; complete copied prompt; no form)`);
  }
  await resetCase();
  await page.locator('#promptInput').fill('ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา');
  await page.locator('#chatForm .send-button').click();
  await page.getByText('จะจ้างเหมางานอะไร? บอกลักษณะงานสั้น ๆ ได้เลย', { exact: true }).waitFor();
  assert.equal(await page.locator('.message:not(.guided-intake-message) .answer-card').count(), 0);
  assert.equal(await page.locator('dialog[open]').count(), 0);
  let card = await submit('บัญชี');
  await checkHandoff(card, /ตาราง TOR งานบัญชี/);
  card = await submit('108000 บาท 12 เดือน');
  await checkHandoff(card, /108000 บาท 12 เดือน/);
  card = await submit('ค้นล่าสุด');
  await checkHandoff(card, /เจตนาผู้ใช้: ค้น\/ตรวจสด/);
  card = await submit('ร่างต่อ');
  await checkHandoff(card, /AI-only: ใช้ข้อมูลพิมพ์/);
  // A new topic must use the original workflow path rather than inherit GP223.
  card = await submit('ตรวจ TOR โครงการถนนล่าสุด');
  assert.equal(await page.evaluate(() => window.testSearchCalls), 1);
  assert.doesNotMatch(await card.locator('pre').textContent(), /SPECIALIZED WORKFLOW:.*GP223/);
  await resetCase();
  // AI-only must also work when the shared connector is unavailable.
  await page.evaluate(() => { window.GovPromptCore.officialSearchConnector = undefined; });
  card = await submit('ร่าง TOR จ้างเหมาบริการงานบัญชี');
  assert.match(await card.locator('pre').textContent(), /ตาราง TOR งานบัญชี/);
  assert.deepEqual(errors, []);
  console.log('GP223 Guided Intake / actual handoff / search isolation / connector-unavailable browser tests: PASS.');
} finally {
  await browser?.close();
  await new Promise(resolveServer => server.close(resolveServer));
}
