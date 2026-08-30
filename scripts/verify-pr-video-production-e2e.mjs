import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  serviceWorkers: 'block'
});
const page = await context.newPage();
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(String(error?.stack || error?.message || error)));

const variants = [
  'ทำวิดีโอประชาสัมพันธ์\nเรื่อง: แนะนำองค์กร\nความยาว: 5–7 นาที',
  'ทำวิดีโอประชาสัมพันธ์\nเรื่อง: แนะนำองกอน\nความยาว: ให้ GP แนะนำ',
  'ทำวิดีโอประชาสัมพันธ์\nเรื่อง: แนำนำองหอน\nความยาว: 5–7 นาที',
  'ทำวิดีโอประชาสัมพันธ์\nเรื่อง: แนะนำองกรอปท\nความยาว: ให้ GP แนะนำ',
  'ทำวิดีโอประชาสัมพันธ์\nเรื่อง: หัวข้อสะกดผิดอะไรก็ได้\nความยาว: ให้ GP แนะนำ',
  'สร้างคลิปประชาสัมพันธ์ เรื่อง ผลงานประจำปี',
  'จัดทำวีดีโอแนะนำหน่วยงาน 5 นาที'
];

const forbidden = [
  'แนวทางเลือกเครื่องมือ',
  'web-when-needed',
  'web-search',
  'แนวทางตอบ',
  'แหล่งราชการที่ GovPrompt ค้นให้',
  'Prompt นี้เป็นผลลัพธ์สำหรับนำไปวิเคราะห์ต่อ',
  'GovPrompt Prompt Standard v7.1',
  'Quality Gates — ต้องผ่านก่อนฟันธง'
];

try {
  const url = new URL(frontend);
  url.searchParams.set('pr-video-production-proof', String(Date.now()));
  await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 45_000 });
  await page.waitForFunction(() => Boolean(window.GovPromptCore?.createGovernmentPrompt), undefined, { timeout: 20_000 });

  const result = await page.evaluate(({ variants, forbidden }) => {
    const core = window.GovPromptCore;
    return variants.map(question => {
      const context = core.createSharedContext({ facts: question, desiredOutput: question });
      const route = core.routeTransaction(context);
      const output = core.createGovernmentPrompt({ question, route, context });
      return {
        question,
        prMode: output.prMode === true,
        route: output.route?.moduleId || route?.moduleId || '',
        prompt: output.prompt || '',
        forbiddenFound: forbidden.filter(item => String(output.prompt || '').includes(item))
      };
    });
  }, { variants, forbidden });

  for (const item of result) {
    assert.equal(item.prMode, true, `PR video mode failed: ${item.question}`);
    assert.deepEqual(item.forbiddenFound, [], `generic boilerplate leaked: ${item.question}`);
    assert.match(item.prompt, /ผู้ช่วยงานประชาสัมพันธ์/);
    assert.match(item.prompt, /Storyboard/);
    assert.match(item.prompt, /บทพากย์/);
    assert.match(item.prompt, /ข้อความขึ้นจอ\/ซับ/);
    assert.match(item.prompt, /Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก/);
    assert.match(item.prompt, /PDPA/);
  }

  assert.deepEqual(pageErrors, [], `browser page errors: ${JSON.stringify(pageErrors)}`);

  console.log(JSON.stringify({
    frontend,
    checks: {
      productionBrowserLoaded: 'PASS',
      exactUserPrompt: 'PASS',
      typoTolerance: 'PASS',
      topicIndependentRouting: 'PASS',
      compactPrPrompt: 'PASS',
      noGenericWebBoilerplate: 'PASS',
      storyboardVoiceoverCaptionAiVideo: 'PASS',
      pdpaGuard: 'PASS',
      mobileViewport: '390x844 PASS',
      browserErrors: 'PASS'
    },
    cases: result.map(item => ({ question: item.question, route: item.route }))
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
