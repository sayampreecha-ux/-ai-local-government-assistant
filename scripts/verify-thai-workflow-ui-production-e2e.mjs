import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const nonce = Date.now();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'allow'
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error?.message || error)));

try {
  const url = new URL(frontend);
  url.searchParams.set('thai-workflow-ui-proof', String(nonce));
  await page.goto(url.toString(), { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => document.readyState === 'complete', undefined, { timeout: 20_000 });

  const result = await page.evaluate(async ({ frontend, nonce }) => {
    localStorage.removeItem('govprompt-v7-case-memory');
    document.querySelectorAll('[data-workflow-progress-panel]').forEach(node => node.remove());

    const host = document.createElement('article');
    host.className = 'answer-card';
    const section = document.createElement('section');
    section.className = 'answer-section';
    section.appendChild(document.createElement('h3')).textContent = 'Production Thai UI proof';
    host.append(section);
    document.body.append(host);

    const runtimeUrl = new URL(`assets/js/core/government-workflow-runtime-v5.js?thai-proof=${nonce}`, frontend).toString();
    const uiUrl = new URL(`assets/js/ui/workflow-progress-ui-v1.js?thai-proof=${nonce}`, frontend).toString();
    const [runtime, ui] = await Promise.all([import(runtimeUrl), import(uiUrl)]);

    const view = runtime.buildWorkflowRuntimeView({
      query: 'ทำแผนอัตรากำลัง อบต.',
      caseId: 'production-thai-ui-proof'
    });

    await new Promise(resolve => setTimeout(resolve, 150));
    const panel = host.querySelector('[data-workflow-progress-panel]');
    const text = panel?.innerText || '';

    return {
      text,
      uiVersion: ui.WORKFLOW_PROGRESS_UI_VERSION,
      artifactAlias: ui.humanizeWorkflowKey('hr-fact-summary', 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้'),
      needMemoAlias: ui.humanizeWorkflowKey('need-memo', 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้'),
      unknownAlias: ui.humanizeWorkflowKey('unknown-internal-code'),
      workflowId: view.primary?.workflowId || null
    };
  }, { frontend, nonce });

  assert.equal(result.uiVersion, '1.2', 'production workflow progress UI is stale');
  assert.equal(result.workflowId, 'gov.hr', 'HR workforce request did not route to HR workflow');
  assert.match(result.text, /ข้อมูล\/หลักฐานที่ต้องเพิ่มเติม/, 'Thai missing-information heading is absent');
  assert.match(result.text, /วัตถุประสงค์และประเภทงานบุคคลที่ต้องการ/, 'hrIntent is not translated for users');
  assert.match(result.text, /ข้อเท็จจริงและข้อมูลพื้นฐานที่เกี่ยวข้อง/, 'facts is not translated for users');
  assert.match(result.text, /ชิ้นงานที่จะจัดทำ/, 'Thai deliverable heading is absent');
  assert.match(result.text, /สรุปข้อเท็จจริงสำหรับงานบุคคล/, 'HR deliverable is not translated for users');
  assert.doesNotMatch(result.text, /\bhrIntent\b/, 'raw hrIntent leaked to production UI');
  assert.doesNotMatch(result.text, /hr-fact-summary/, 'raw artifact key leaked to production UI');
  assert.equal(result.artifactAlias, 'สรุปข้อเท็จจริงสำหรับงานบุคคล');
  assert.equal(result.needMemoAlias, 'บันทึกเหตุผลและความจำเป็น');
  assert.equal(result.unknownAlias, 'ข้อมูล/หลักฐานเพิ่มเติมตามขั้นตอนนี้');
  assert.deepEqual(pageErrors, [], `browser page errors: ${JSON.stringify(pageErrors)}`);

  console.log(JSON.stringify({
    frontend,
    uiVersion: result.uiVersion,
    checks: {
      thaiMissingHeading: 'PASS',
      thaiHrEvidenceLabels: 'PASS',
      thaiDeliverableHeading: 'PASS',
      thaiHrArtifactLabel: 'PASS',
      kebabCaseAliases: 'PASS',
      noRawInternalKeys: 'PASS',
      browserErrors: 'PASS'
    }
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
