import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    const content = await readFile(path);
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'text/plain' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const origin = 'http://127.0.0.1:' + server.address().port;
let browser;
const fixture = {
  schemaVersion: '1.0',
  shards: [],
  records: [{
    id: 'synthetic-test-1', documentTitle: '<img src=x onerror=alert(1)> TEST ONLY',
    documentNumber: 'TEST/999', issuingAgency: 'Test Agency',
    sourceUrl: 'https://example.go.th/synthetic.pdf',
    documentDate: '2026-10-01', effectiveDate: '2026-10-02',
    category: 'test', keywords: ['synthetic'], status: 'unknown', reviewStatus: 'pending'
  }]
};
try {
  browser = await chromium.launch({ headless: true });
  for (const width of [390, 1365]) {
    const context = await browser.newContext({ viewport: { width, height: 850 }, permissions: ['clipboard-read', 'clipboard-write'] });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/knowledge/circulars/index.json', route => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(fixture)
    }));
    await page.goto(origin + '/circular-watch.html');
    await page.locator('#loading').filter({ hasText: 'ทะเบียนที่โหลด' }).waitFor();
    await page.locator('#query').fill('TEST/999');
    await page.locator('#searchForm button[type=submit]').click();
    await page.locator('#results button').click();
    assert.match(await page.locator('#details').innerText(), /DECISION_LOCK/);
    assert.equal(await page.locator('#details img').count(), 0, 'No untrusted HTML injection');
    await page.locator('#handoff').click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /verifiedLatest=false/);
    const sample = JSON.stringify({ records: [fixture.records[0]] });
    await page.locator('#importFile').setInputFiles({ name: 'review.json', mimeType: 'application/json', buffer: Buffer.from(sample) });
    assert.match(await page.locator('#importStatus').innerText(), /Preview/);
    assert.equal(errors.length, 0, 'No browser JS exceptions: ' + errors.join('; '));
    console.log('Circular Watch E2E PASS', width, 'px');
    await context.close();
  }
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}
