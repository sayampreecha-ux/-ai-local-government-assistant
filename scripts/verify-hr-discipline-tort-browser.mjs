// Isolated checkout acceptance only. No production or downstream AI access.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

const root = resolve(process.env.HR_ACCEPTANCE_ROOT || 'dist');
const out = resolve('artifacts/hr-discipline-tort');
await mkdir(out, { recursive: true });
const source = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const server = createServer(async (req, res) => {
  const path = resolve(root, '.' + (new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : decodeURIComponent(new URL(req.url, 'http://localhost').pathname)));
  if (!path.startsWith(root + sep)) return res.writeHead(403).end();
  try {
    res.setHeader('content-type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' })[extname(path)] || 'text/plain');
    res.end(await readFile(path));
  } catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const results = [];
let browser;
const expectedCategories = ['pr', 'records', 'audit', 'finance', 'revenue', 'planning', 'procurement', 'hr', 'executive', 'engineering', 'health', 'education', 'council'];
const incident = 'ข้อมูลจำลอง: ทรัพย์สินของประชาชนเสียหายระหว่างการทำงาน ยังรอตรวจเอกสารมอบหมาย ขอเตรียมเอกสารและหลักฐาน';
const disciplineFacts = 'ข้อมูลจำลอง: มีข้อกล่าวหาขาดราชการ ยังรอตรวจคำชี้แจงและหลักฐาน ขอขั้นตอนงานวินัยโดยไม่วินิจฉัยผล';
const digest = value => createHash('sha256').update(value).digest('hex');
try {
  browser = await chromium.launch({ headless: true, ...(process.env.HR_BROWSER_EXECUTABLE ? { executablePath: process.env.HR_BROWSER_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : {}) });
  for (const width of [390, 1365]) {
    const device = width === 390 ? 'mobile' : 'desktop';
    const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: width === 390, hasTouch: width === 390, serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] });
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const check = async (id, action) => {
      const row = { id, device, source, status: 'FAIL' };
      try { Object.assign(row, await action()); row.status = 'PASS'; }
      catch (error) { row.error = String(error.stack || error); }
      results.push(row);
      await page.screenshot({ path: resolve(out, `${device}-${id}.png`), fullPage: true }).catch(() => {});
      console.log(device, id, row.status, row.error?.split('\n')[0] || '');
      return row;
    };
    const home = async () => {
      if (page.url().includes('view=result')) {
        await page.getByRole('button', { name: 'เริ่มงานใหม่', exact: true }).click();
        await page.waitForURL(url => !url.searchParams.has('view'));
      } else await page.goto(base, { waitUntil: 'networkidle' });
      await page.waitForLoadState('networkidle');
    };
    const category = id => page.locator(`.work-catalog-category-toggle[aria-controls="work-catalog-tasks-${id}"]`);
    const openHR = async () => { await category('hr').click(); await page.getByRole('button', { name: '⚖️ วินัย / ละเมิด', exact: true }).click(); };
    const layout = async () => { const value = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth })); assert.ok(value.scroll <= width + 2); return value; };
    const output = async () => {
      await page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้', { exact: true }).last().click({ timeout: 30000 });
      const prompt = await page.locator('.answer-card .answer-section details pre').last().textContent();
      await page.getByRole('button', { name: /^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/ }).click();
      await page.waitForFunction(async expected => (await navigator.clipboard.readText()) === expected, prompt);
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), prompt);
      return { prompt, clipboardSHA256: digest(prompt), route: await page.locator('.route-label').last().textContent(), specialistHref: await page.locator('.answer-actions a[href]').last().getAttribute('href'), layout: await layout() };
    };
    await check('catalog-and-dialog', async () => {
      await home();
      const ids = await page.locator('.work-catalog-group:not([data-assistance-route])').evaluateAll(groups => groups.map(g => g.querySelector('.work-catalog-category-toggle').getAttribute('aria-controls').replace('work-catalog-tasks-', '')));
      assert.deepEqual(ids, expectedCategories);
      assert.equal(await page.locator('[data-assistance-route]').count(), 1);
      await openHR();
      const dialog = page.locator('dialog[open]');
      assert.equal(await dialog.getByRole('button', { name: 'งานวินัย', exact: true }).count(), 1);
      assert.equal(await dialog.getByRole('button', { name: 'งานความรับผิดทางละเมิด', exact: true }).count(), 1);
      await dialog.getByRole('button', { name: /×|ปิด|close/i }).click();
      assert.equal(await page.locator('dialog[open]').count(), 0);
      await page.getByRole('button', { name: '⚖️ วินัย / ละเมิด', exact: true }).click();
      await page.getByRole('button', { name: 'งานวินัย', exact: true }).click();
      await page.locator('[data-discipline-intake=true]').waitFor();
      assert.equal(await page.locator('#promptInput').inputValue(), '');
      assert.equal(await page.locator('.answer-card').count(), 0, 'no automatic submission');
      await page.goBack();
      await page.waitForLoadState('networkidle');
      assert.equal(await category('hr').count(), 1, 'browser Back returns to catalog');
      return { ids, layout: await layout() };
    });
    await check('discipline', async () => {
      await home(); await openHR(); await page.getByRole('button', { name: 'งานวินัย', exact: true }).click();
      await page.locator('[data-discipline-intake=true]').waitFor();
      await page.locator('#promptInput').fill(disciplineFacts);
      await page.locator('#chatForm button[type=submit]').click();
      const r = await output();
      assert.equal(r.route, 'งานบุคคล');
      assert.match(r.specialistHref, /gp006/i);
      assert.match(r.prompt, /Primary workflow: gov.hr/);
      for (const term of ['UNVERIFIED', 'NOT VERIFIED', 'Human Review', 'ฐานกฎหมายและอำนาจฉบับปัจจุบัน', 'แยกข้อกล่าวหาจากข้อเท็จจริงที่ตรวจยืนยันแล้ว', 'ห้ามวินิจฉัยความผิดอัตโนมัติ']) assert.ok(r.prompt.includes(term), term);
      assert.ok(r.prompt.includes(disciplineFacts));
      assert.doesNotMatch(r.prompt, /GP_TORT_LEVEL1_HANDOFF_V1|Primary workflow: gov.legal/);
      return r;
    });
    const tortOutputs = [];
    for (const entry of ['hr', 'audit']) await check('tort-' + entry, async () => {
      await home();
      if (entry === 'hr') { await openHR(); await page.getByRole('button', { name: 'งานความรับผิดทางละเมิด', exact: true }).click(); }
      else { await category('audit').click(); await page.getByRole('button', { name: '⚖️ งานความรับผิดทางละเมิด', exact: true }).click(); }
      await page.locator('[data-tort-intake=true]').waitFor();
      assert.equal(await page.locator('#promptInput').inputValue(), '');
      assert.equal(await page.locator('.answer-card').count(), 0);
      assert.equal(await page.locator('#chatForm').getAttribute('data-tort-intent'), 'true');
      assert.notEqual(await page.locator('#chatForm').getAttribute('data-discipline-intent'), 'true');
      await page.locator('#promptInput').fill(incident);
      await page.locator('#chatForm button[type=submit]').click();
      const r = await output();
      assert.match(r.route, /กฎหมาย/);
      assert.match(r.specialistHref, /gp002/i);
      assert.match(r.prompt, /Primary workflow: gov.legal/);
      assert.doesNotMatch(r.prompt, /Primary workflow: gov.hr/);
      assert.ok(r.prompt.includes(incident)); assert.ok(!r.prompt.includes(disciplineFacts));
      for (const term of ['GP_TORT_LEVEL1_HANDOFF_V1', 'ร่างเอกสาร 7 ส่วน', 'NOT VERIFIED', 'UNVERIFIED', 'Human Review', 'ว66/ว141', 'Authority Gate ยังไม่ VERIFIED', 'ห้ามแสดงรูปแบบคำสั่ง', 'SAFETY ACCEPTANCE ส่วนที่ 6', '[ยังไม่ได้ดำเนินการ]', 'FALSE FILE COMPLETION GUARD', 'ปกปิดข้อมูลส่วนบุคคล']) assert.ok(r.prompt.includes(term), term);
      assert.ok(!r.prompt.includes('กรณีรถราชการเสียหายระหว่างปฏิบัติงาน:'), 'no invented collision starter');
      tortOutputs.push(r);
      return r;
    });
    await check('shared-tort-path', async () => {
      assert.equal(tortOutputs.length, 2);
      assert.equal(tortOutputs[0].prompt, tortOutputs[1].prompt, 'same facts produce exact same handoff from HR and legal');
      return { sha256: digest(tortOutputs[0].prompt) };
    });
    for (const [id, label] of [['discipline', 'งานวินัย'], ['tort', 'งานความรับผิดทางละเมิด']]) await check('privacy-' + id, async () => {
      await home(); await openHR(); await page.getByRole('button', { name: label, exact: true }).click();
      await page.locator('[data-' + (id === 'discipline' ? 'discipline' : 'tort') + '-intake=true]').waitFor();
      await page.locator('#promptInput').fill('ข้อมูลจำลอง เลขบัตรประชาชน 1234567890123');
      await page.locator('#chatForm button[type=submit]').click();
      await page.locator('#privacySubmitWarning').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#promptInput').inputValue(), '');
      assert.equal(await page.locator('.answer-card').count(), 0);
      const persisted = await page.evaluate(() => JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
      assert.ok(!persisted.includes('1234567890123'));
      return { blocked: true };
    });
    // Other HR work plus generic legal, procurement and records stay on normal paths.
    for (const [id, question, module] of [
      ['hr-regression', 'จัดทำแผนอัตรากำลังของเทศบาล โดยไม่มีข้อมูลเจ้าหน้าที่จริง', 'GP006'],
      ['legal-regression', 'วิเคราะห์ฐานอำนาจตามกฎหมายของเทศบาล โดยไม่ใช่งานวินัย', 'GP002'],
      ['procurement-regression', 'จัดซื้อวัสดุสำนักงานของเทศบาล โดยยังไม่ระบุวงเงิน', 'GP003'],
      ['records-regression', 'ร่างหนังสือราชการเชิญประชุม ใช้ช่องว่างสำหรับวันเวลา', 'GP001']
    ]) await check(id, async () => {
      await home();
      assert.notEqual(await page.locator('#chatForm').getAttribute('data-tort-intent'), 'true');
      assert.notEqual(await page.locator('#chatForm').getAttribute('data-discipline-intent'), 'true');
      await page.locator('#promptInput').fill(question); await page.locator('#chatForm button[type=submit]').click();
      const summary = page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้', { exact: true });
      const skip = page.getByRole('button', { name: 'ยังไม่ทราบบางข้อ — ทำต่อ', exact: true });
      await summary.or(skip).first().waitFor({ state: 'visible', timeout: 30000 });
      if (await skip.isVisible()) await skip.click();
      const r = await output();
      assert.ok(r.specialistHref.toLowerCase().includes(module.toLowerCase()), r.specialistHref);
      assert.ok(r.prompt.includes(question));
      assert.ok(!r.prompt.includes(incident)); assert.ok(!r.prompt.includes(disciplineFacts));
      return r;
    });
    await context.close();
  }
} finally {
  await browser?.close(); await new Promise(r => server.close(r));
  await writeFile(resolve(out, 'results.json'), JSON.stringify({ source, scope: 'isolated built checkout; external requests blocked; no downstream AI', humanReview: 'NOT VERIFIED', results }, null, 2));
}
assert.equal(results.length, 22);
assert.equal(results.filter(r => r.status !== 'PASS').length, 0, 'all HR/tort and regression cases must pass');
