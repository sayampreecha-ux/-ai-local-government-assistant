// Tests the real local UI and exported prompts. This does not execute a downstream AI.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve(process.env.MEETING_FRONTEND_ROOT || 'dist');
const output = process.env.MEETING_TEST_OUTPUT;
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(root, `.${pathname === '/' ? '/index.html' : decodeURIComponent(pathname)}`);
  if (!file.startsWith(root + sep)) return res.writeHead(403).end();
  try { const body = await readFile(file); res.writeHead(200, { 'Content-Type': `${types[extname(file)] || 'application/octet-stream'}; charset=utf-8` }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
const results = [];
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.open = () => ({ opener: null, closed: false, location: { replace() {} }, close() {} });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.testCopiedPrompt = text; } } });
  });
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  async function reset() {
    await page.goto(`${origin}/index.html?view=result`);
    await page.waitForFunction(() => window.GovPromptCore?.createGovernmentPrompt && document.getElementById('chatForm')?.dataset.privacySubmitGuard);
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
    await page.evaluate(question => {
      window.testCopiedPrompt = '';
      document.getElementById('promptInput').value = question;
      document.getElementById('chatForm').requestSubmit();
    }, question);
    await page.waitForFunction(before => document.querySelectorAll('.message:not(.guided-intake-message) .answer-card').length > before, before);
    const card = page.locator('.message:not(.guided-intake-message) .answer-card').last();
    await card.locator('pre').waitFor({ state: 'attached' });
    await page.waitForFunction(() => [...document.querySelectorAll('.answer-card')].at(-1)?.dataset.leanModeReady === 'true');
    const meeting = await card.evaluate(card => window.GovPromptCore.meetingMinutesHandoffPrompts?.has(card));
    const copy = meeting
      ? card.getByRole('button', { name: 'คัดลอกแล้วเปิดใน ChatGPT', exact: true })
      : card.getByRole('button', { name: /^(?:คัดลอกคำสั่งอย่างเดียว|คัดลอกไปใช้กับ AI)$/ });
    await copy.click();
    await page.waitForFunction(() => Boolean(window.testCopiedPrompt), null, { timeout: 5000 }).catch(async error => {
      const diagnostic = await page.evaluate(() => ({ text: document.body.innerText.slice(-1200), cards: [...document.querySelectorAll('.answer-card')].map(card => { const prompt = window.GovPromptCore.meetingMinutesHandoffPrompts?.get(card); const r = window.GovPromptCore.sanitizeExternalContent(prompt || ''); return { stored: !!prompt, blocked: r.blocked, blockingRisks: r.blockingRisks, residualRisks: r.residualRisks, sensitiveContext: r.sensitiveContext }; }) }));
      throw new Error(JSON.stringify(diagnostic));
    });
    const prompt = await page.evaluate(() => window.testCopiedPrompt);
    assert.match(prompt, new RegExp(question.split('\n')[0]));
    return { card, prompt };
  }
  const cases = [
    ['TEST 1 Council/Text', 'ทำรายงานประชุมสภา อบต.\nบันทึกย่อ: ประธานแจ้งเรื่องน้ำท่วม ที่ประชุมเห็นชอบตามที่เสนอ', 'council'],
    ['TEST 2 General/Text', 'ทำรายงานประชุมหัวหน้าส่วน\nบันทึกย่อ: หารือการจัดกิจกรรม ขอให้รวบรวมข้อเสนอในการประชุมครั้งหน้า', 'general'],
    ['TEST 3 Committee', 'ทำรายงานประชุมคณะกรรมการ\nเรื่องพิจารณา: ปรับแผนงาน มติ: เห็นชอบตามที่เสนอ', 'general'],
    ['TEST 4 Audio-capable handoff', 'ทำรายงานประชุมสภา มีไฟล์เสียงแนบกับ AI ปลายทางนี้ โปรดตรวจว่าอ่านได้จริงก่อนถอดเสียงและร่างรายงาน', 'council'],
    ['TEST 5 Audio unsupported handoff', 'ทำรายงานการประชุม มีไฟล์เสียง แต่ AI ปลายทางอ่านไฟล์ไม่ได้', 'general'],
    ['TEST 6 Missing vote', 'ทำรายงานประชุมสภา\nต้นฉบับ: ที่ประชุมเห็นชอบตามที่เสนอ', 'council'],
    ['TEST 7 Unclear/Unknown speaker', 'ทำรายงานประชุมสภา\nบันทึก: ผู้พูดที่ 1 กล่าวถึงแผนงาน ช่วงมติ [ฟังไม่ชัด] ไม่ทราบชื่อผู้พูด', 'council']
  ];
  for (const [name, query, profile] of cases) {
    await reset();
    const { card, prompt } = await submit(query);
    assert.match(prompt, new RegExp(profile === 'council' ? 'โครงสร้างกรณีประชุมสภาท้องถิ่น' : 'โครงสร้างกรณีประชุมทั่วไป'));
    assert.match(await card.textContent(), /แนบไฟล์เสียงที่นั่นโดยตรง/);
    assert.match(await card.textContent(), /กรุณาตรวจสอบกับต้นฉบับ/);
    assert.equal(await page.locator('.guided-intake-message').count(), 0);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    assert.equal(await page.evaluate(() => window.testSearchCalls), 0);
    assert.match(prompt, /ตรวจว่ามีไฟล์เสียงแนบจริง/);
    assert.match(prompt, /อ่านและถอดเสียงไฟล์นั้นได้จริง/);
    assert.match(prompt, /Audio → Transcript → Speaker Segmentation/);
    assert.match(prompt, /ห้ามอ้างว่าได้ฟังไฟล์หรือได้ถอดเสียง/);
    assert.match(prompt, /ห้ามสร้าง transcript จากชื่อไฟล์หรือ metadata/);
    assert.match(prompt, /ไม่แสดง metadata VERIFIED \/ PARTIAL \/ UNVERIFIED/);
    assert.match(prompt, /ห้ามเติมจำนวนเสียง/);
    assert.match(prompt, /ห้ามระบุตัวบุคคลจากเสียง/);
    assert.match(prompt, /\[ฟังไม่ชัด\]/);
    if (profile === 'general') assert.match(prompt, /ไม่เพิ่มญัตติหรือคะแนนเสียงเมื่อไม่มีหลักฐาน/);
    if (output) { await mkdir(output, { recursive: true }); await writeFile(resolve(output, `${name.slice(0, 6).replaceAll(' ', '-')}.txt`), prompt); }
    results.push({ test: name, handoff: 'PASS', downstreamOutput: 'NOT RUN' });
  }
  // Keep the last draft in the conversation, then ask a legal follow-up.
  await page.evaluate(() => { window.testCopiedPrompt = ''; });
  const legal = await submit('มตินี้ชอบด้วยกฎหมายหรือไม่');
  const legalModule = await page.evaluate(() => window.GovPromptCore.routeRequest('มตินี้ชอบด้วยกฎหมายหรือไม่').primaryModule);
  assert.ok(['GP002', 'GP013'].includes(legalModule), 'legal follow-up must use a legal/council route');
  assert.match(legal.prompt, /Applicable Authority|Authority\/Evidence|ฐานอำนาจ/);
  assert.match(legal.prompt, /Legal Version|ฉบับที่ใช้/);
  assert.match(legal.prompt, /Decision Lock|Decision Gate/);
  assert.doesNotMatch(legal.prompt, /GovPrompt Meeting Minutes Draft Contract v1/);
  assert.ok(await page.evaluate(() => window.testSearchCalls) > 0);
  if (output) await writeFile(resolve(output, 'TEST-8.txt'), legal.prompt);
  results.push({ test: 'TEST 8 Legal follow-up', handoff: 'PASS', legalModule, downstreamOutput: 'NOT RUN' });
  // Click both existing catalog entries, rather than testing only typed requests.
  for (const [menu, profile] of [
    ['ทำรายงานการประชุมทั่วไป', 'โครงสร้างกรณีประชุมทั่วไป'],
    ['ทำรายงานการประชุมสภาท้องถิ่น', 'โครงสร้างกรณีประชุมสภาท้องถิ่น']
  ]) {
    await page.goto(origin);
    const button = page.locator(`.work-catalog-task[data-prompt="${menu}"]`);
    await button.waitFor({ state: 'attached' });
    assert.equal(await button.count(), 1);
    await button.locator('xpath=ancestor::section[1]').locator('h3').click();
    await button.click();
    const card = page.locator('.answer-card').last();
    await card.locator('pre').waitFor({ state: 'attached' });
    await page.waitForFunction(() => [...document.querySelectorAll('.answer-card')].at(-1)?.dataset.leanModeReady === 'true');
    assert.match(await card.locator('pre').textContent(), new RegExp(profile));
    await card.getByRole('button', { name: 'คัดลอกแล้วเปิดใน Gemini', exact: true }).click();
    await page.waitForFunction(() => Boolean(window.testCopiedPrompt), null, { timeout: 5000 });
    assert.match(await page.evaluate(() => window.testCopiedPrompt), new RegExp(profile));
    assert.equal(await page.locator('.guided-intake-message').count(), 0);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    // The generated instruction exception must not exempt sensitive user data.
    await page.evaluate(() => {
      window.testCopiedPrompt = '';
      [...document.querySelectorAll('.message.user .message-body')].at(-1).textContent = 'ผลตรวจเลือดของผู้เข้าร่วมประชุม';
    });
    await card.getByRole('button', { name: 'คัดลอกคำสั่งอย่างเดียว', exact: true }).click();
    await page.waitForFunction(() => document.body.innerText.includes('หยุดส่งต่อ: ยังพบข้อมูลเสี่ยง'));
    assert.equal(await page.evaluate(() => window.testCopiedPrompt), '');
  }
  if (output) await writeFile(resolve(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify({ results, note: 'PASS covers real UI/copied prompt/runtime behavior only; no downstream transcription or AI output was executed.' }, null, 2));
} finally {
  await browser?.close();
  await new Promise(done => server.close(done));
}
