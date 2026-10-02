import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'allow',
  permissions: ['clipboard-read', 'clipboard-write']
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error?.message || error)));

try {
  const url = new URL(frontend);
  url.searchParams.set('handoff-copy-e2e', String(Date.now()));
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(
    () => document.readyState === 'complete'
      && document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '3'
      && typeof window.GovPrompt?.toast === 'function',
    undefined,
    { timeout: 20_000 }
  );

  const prompt = 'วิเคราะห์กฎหมายสาธารณสุข';
  await page.locator('#promptInput').fill(prompt);
  await page.locator('#chatForm .send-button').click();

  const copyButton = page.getByRole('button', { name: 'คัดลอกไปใช้กับ AI', exact: true }).last();
  await copyButton.waitFor({ state: 'visible', timeout: 20_000 });
  await copyButton.click();
  await page.waitForTimeout(250);

  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  const toast = await page.locator('.gp-toast').allInnerTexts();

  assert.match(clipboard, /วิเคราะห์กฎหมายสาธารณสุข/, 'copied prompt does not contain the user request');
  assert.match(clipboard, /ค้นเว็บสด|web-search|แหล่งราชการ/, 'copied prompt is missing live-search guidance for the user AI');
  assert.doesNotMatch(toast.join('\n'), /หยุดคัดลอก|Prompt ยังมีข้อมูลเสี่ยง/, 'safe generated prompt was falsely blocked');
  assert.ok(clipboard.length > 100, 'copied prompt is unexpectedly short');
  assert.deepEqual(pageErrors, [], `browser page errors: ${JSON.stringify(pageErrors)}`);

  console.log(JSON.stringify({
    frontend,
    checks: {
      copyButtonVisible: 'PASS',
      clipboardWrite: 'PASS',
      generatedHealthLegalPromptAllowed: 'PASS',
      noPrivacyFalsePositive: 'PASS',
      userAiLiveSearchGuidance: 'PASS',
      browserErrors: 'PASS'
    },
    clipboardLength: clipboard.length
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
