import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const contentTypes = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
});

function safeFilePath(requestPath) {
  const pathname = decodeURIComponent(requestPath === '/' ? '/index.html' : requestPath);
  const target = resolve(root, `.${pathname}`);
  return target === root || target.startsWith(`${root}${sep}`) ? target : null;
}

const server = createServer(async (request, response) => {
  const target = safeFilePath(new URL(request.url || '/', 'http://127.0.0.1').pathname);
  if (!target) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(target);
    response.writeHead(200, { 'content-type': contentTypes[extname(target)] || 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const frontend = `${origin}/index.html`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'allow' });
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(String(error?.stack || error?.message || error)));

async function verifyPRImageStudio(targetPage, expectedViewport, label) {
  const errors = [];
  targetPage.on('pageerror', (error) => errors.push(String(error?.stack || error?.message || error)));
  await targetPage.goto(`${origin}/gp012.html`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await targetPage.locator('[data-gp-pr-image-task="true"]').click();
  await targetPage.locator('#gpPrImageInput').setInputFiles({
    name: 'ชื่อบุคคล-ข้อมูลส่วนตัว.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  });
  await targetPage.locator('#gpPrImageRequest').fill('ทำภาพเกษียณให้สวยที่สุด อบอุ่น ภูมิฐาน');
  await targetPage.locator('#gpPrMakeImage').click();
  await targetPage.locator('#gpPrImageResult.visible').waitFor({ state: 'visible', timeout: 10_000 });

  const state = await targetPage.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    status: document.getElementById('gpPrImageResultStatus')?.textContent || '',
    note: document.getElementById('gpPrImageResultNote')?.textContent || '',
    prompt: document.getElementById('gpPrImagePrompt')?.textContent || '',
    thaiText: document.getElementById('gpPrThaiText')?.textContent || '',
    size: document.getElementById('gpPrSizeNote')?.textContent || '',
    quickActions: document.querySelectorAll('.gp-pr-image-quick button').length,
    hasTechnicalSettings: Boolean(document.querySelector('[name="font"],[name="color"],[name="layout"],[name="aspectRatio"],[name="promptStyle"]')),
    imageVisible: document.getElementById('gpPrImagePreview')?.classList.contains('visible') || false,
    legacyTaskCount: document.querySelectorAll('#tasks .task:not([data-gp-pr-image-task])').length
  }));

  assert.ok(Math.abs(state.viewportWidth - expectedViewport) <= 2, `${label} viewport mismatch: ${state.viewportWidth}`);
  assert.ok(state.scrollWidth <= state.viewportWidth, `${label} has horizontal overflow: ${JSON.stringify(state)}`);
  assert.match(state.status, /เตรียมงานภาพให้พร้อมส่งต่อ/, `${label} must use fallback without an image provider`);
  assert.match(state.note, /fallback/, `${label} must explain image fallback briefly`);
  assert.match(state.prompt, /รักษาใบหน้า/, `${label} prompt must preserve important source-image facts`);
  assert.match(state.prompt, /ห้ามแต่งชื่อ ตำแหน่ง หน่วยงาน วันที่ ตัวเลข/, `${label} prompt must prohibit invented official facts`);
  assert.equal(state.prompt.includes('ชื่อบุคคล-ข้อมูลส่วนตัว.png'), false, `${label} must not expose local filename in the handoff prompt`);
  assert.match(state.thaiText, /ยังไม่มีข้อความภาษาไทยที่ยืนยัน/, `${label} must keep unverified Thai text separate`);
  assert.match(state.size, /1080×1350/, `${label} must recommend a practical Facebook-first default size`);
  assert.equal(state.quickActions, 4, `${label} must keep only the required quick actions`);
  assert.equal(state.hasTechnicalSettings, false, `${label} must not require technical design settings`);
  assert.equal(state.imageVisible, true, `${label} must preview the attached source image`);
  assert.equal(state.legacyTaskCount, 10, `${label} must preserve all existing PR tasks`);
  assert.deepEqual(errors, [], `${label} page errors: ${JSON.stringify(errors)}`);
  return state;
}

try {
  await page.goto(frontend, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(
    () => document.readyState === 'complete' && document.getElementById('chatForm')?.dataset?.privacySubmitGuard === '3',
    undefined,
    { timeout: 20_000 }
  );

  const uiState = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasComposer: Boolean(document.getElementById('chatForm') && document.getElementById('promptInput')),
    quickActionCount: document.querySelectorAll('[data-prompt]').length
  }));
  assert.ok(uiState.viewportWidth >= 380 && uiState.viewportWidth <= 400, `mobile viewport must stay in the expected phone range: ${uiState.viewportWidth}px`);
  assert.ok(uiState.scrollWidth <= uiState.viewportWidth, `unexpected horizontal overflow: ${JSON.stringify(uiState)}`);
  assert.equal(uiState.hasComposer, true, 'mobile composer is missing');
  assert.ok(uiState.quickActionCount >= 6, 'primary workflow entry points are missing');

  await page.locator('#promptInput').fill('HN000000');
  await page.locator('#chatForm .send-button').click();
  await page.waitForTimeout(250);
  const privacyState = await page.evaluate(() => ({
    input: document.getElementById('promptInput')?.value || '',
    userMessages: [...document.querySelectorAll('.message.user .message-body')].map((node) => node.textContent || ''),
    bodyText: document.body.innerText,
    warning: document.querySelector('.privacy-submit-warning:not([hidden])')?.textContent || ''
  }));
  assert.equal(privacyState.input, '', 'privacy-blocked input must be cleared');
  assert.equal(privacyState.userMessages.length, 0, 'privacy-blocked input must not create a user message');
  assert.equal(privacyState.bodyText.includes('HN000000'), false, 'privacy-blocked input leaked into the visible UI');
  assert.match(privacyState.warning, /บล็อกข้อมูลส่วนบุคคล\/ข้อมูลอ่อนไหวก่อนประมวลผล/, 'privacy-blocked input must show a blocking warning');
  assert.match(privacyState.warning, /รหัสผู้ป่วย\/HN\/AN/, 'HN input must be classified as protected patient data');

  const workflowState = await page.evaluate(async () => {
    const runtime = await import('/assets/js/core/government-workflow-runtime-v5.js');
    const cases = [
      ['gov.correspondence', 'ร่างหนังสือราชการแจ้งหน่วยงาน'],
      ['gov.legal', 'วิเคราะห์ข้อกฎหมายและอำนาจหน้าที่'],
      ['gov.procurement', 'จัดซื้อครุภัณฑ์ด้วย e-bidding'],
      ['gov.project', 'ทำโครงการอบรมประชาชน'],
      ['gov.finance', 'ขอเบิกค่าใช้จ่ายเดินทางไปราชการ'],
      ['gov.hr', 'เลื่อนเงินเดือนพนักงานส่วนท้องถิ่น'],
      ['gov.engineering', 'ตรวจรับงานก่อสร้างถนน'],
      ['gov.health', 'รพ.สต. ใช้เงินบำรุงซื้อเวชภัณฑ์'],
      ['gov.education', 'โรงเรียนจัดกิจกรรมสำหรับนักเรียน'],
      ['gov.internal-audit', 'จัดทำแผนตรวจสอบภายใน'],
      ['gov.executive', 'จัดทำสรุปผู้บริหารเพื่อช่วยตัดสินใจ'],
      ['gov.public-relations', 'ทำโพสต์ประชาสัมพันธ์โครงการ'],
      ['gov.council', 'ตรวจองค์ประชุมสภาท้องถิ่น'],
      ['gov.budget-draft', 'จัดทำร่างงบประมาณประจำปี']
    ];
    return cases.map(([workflowId, query], index) => {
      const caseId = `mobile-e2e-${index}-${workflowId.replace(/[^a-z0-9]+/gi, '-')}`;
      const first = runtime.buildWorkflowRuntimeView({ query, caseId });
      const second = runtime.buildWorkflowRuntimeView({ query, caseId });
      return {
        workflowId,
        included: first.workflowIds.includes(workflowId),
        deterministic: JSON.stringify(first) === JSON.stringify(second),
        failClosed: first.governance.failClosed,
        autoApprovalAllowed: first.governance.autoApprovalAllowed,
        rawEvidenceValuesReturned: first.governance.rawEvidenceValuesReturned
      };
    });
  });

  for (const state of workflowState) {
    assert.equal(state.included, true, `${state.workflowId} was not reachable through the browser runtime`);
    assert.equal(state.deterministic, true, `${state.workflowId} browser runtime result is not deterministic`);
    assert.equal(state.failClosed, true, `${state.workflowId} must be fail-closed without evidence`);
    assert.equal(state.autoApprovalAllowed, false, `${state.workflowId} must not auto-approve`);
    assert.equal(state.rawEvidenceValuesReturned, false, `${state.workflowId} must not expose raw evidence`);
  }

  await verifyPRImageStudio(page, 390, 'mobile GP012');

  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const desktopPage = await desktopContext.newPage();
  try {
    await verifyPRImageStudio(desktopPage, 1280, 'desktop GP012');
  } finally {
    await desktopContext.close();
  }

  assert.deepEqual(pageErrors, [], `browser console errors: ${JSON.stringify(pageErrors)}`);
  console.log(JSON.stringify({ frontend, checks: { mobile390: 'PASS', desktop1280: 'PASS', noHorizontalOverflow: 'PASS', privacyGuard: 'PASS', prImageUpload: 'PASS', prImageFallback: 'PASS', prImageThaiTextSeparation: 'PASS', prLegacyTasksPreserved: 'PASS', allWorkflowRuntimeRoutes: `${workflowState.length} PASS`, console: 'PASS' } }, null, 2));
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolveServer) => server.close(resolveServer));
}