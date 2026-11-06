import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { createHash } from 'node:crypto';
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
const evidence=[];
await mkdir('artifacts/circular-watch',{recursive:true});
const fixture = {
  schemaVersion: '1.0',
  shards: [],
  records: [{
    id: 'synthetic-test-1', documentTitle: '<img src=x onerror=alert(1)> TEST ONLY',
    documentNumber: 'TEST/999', issuingAgency: 'Test Agency',
    sourceUrl: 'https://www.dla.go.th/synthetic-test-only.pdf',
    documentDate: '2026-10-01', effectiveDate: '2026-10-02',
    category: 'test', keywords: ['synthetic'], status: 'current', reviewStatus: 'approved', publicationStatus:'PUBLISHED',
    documentSha256:'a'.repeat(64), evidence:['Synthetic fixture only'], excerptLocator:'page 1', lastVerifiedAt:'2026-11-01T00:00:00Z', authorityEvidence:'Synthetic fixture', versionEvidence:'Synthetic fixture', supersededByDocumentId:'not-loaded-version'
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
    await page.goto(origin + '/circular-watch-review.html');
    await page.locator('#loading').filter({ hasText: 'ทะเบียนที่โหลด' }).waitFor();
    await page.locator('#query').fill('TEST/999');
    await page.locator('#searchForm button[type=submit]').click();
    await page.locator('#results button').click();
    assert.match(await page.locator('#details').innerText(), /DECISION_LOCK/);
    assert.equal(await page.locator('#details img').count(), 0, 'No untrusted HTML injection');
    await page.locator('#handoff').click();
    assert.match(await page.evaluate(() => navigator.clipboard.readText()), /verifiedLatest=false/);
    const sample = JSON.stringify({ records: [{...fixture.records[0], reviewStatus:'pending', publicationStatus:'DISCOVERED'}] });
    await page.locator('#importFile').setInputFiles({ name: 'review.json', mimeType: 'application/json', buffer: Buffer.from(sample) });
    assert.match(await page.locator('#importStatus').innerText(), /Preview/);
    assert.match(await page.locator('#reviewQueue').innerText(), /STAGED/);
    const downloading=page.waitForEvent('download'); await page.locator('#exportQueue').click();
    const downloaded=await downloading;
    const queue=JSON.parse(await readFile(await downloaded.path(),'utf8'));
    assert.equal(queue.publishable,false); assert.equal(queue.lifecycleCounts.PUBLISHED,0);
    // Actual local PDF hash round-trip, without claiming authenticity of synthetic bytes.
    const pdf=Buffer.from('%PDF-1.4\nSynthetic browser fixture only\n%%EOF');
    await page.locator('#originalFile').setInputFiles({name:'synthetic.pdf',mimeType:'application/pdf',buffer:pdf});
    const candidate={...fixture.records[0],reviewStatus:'pending',publicationStatus:'DISCOVERED',documentSha256:''};
    await page.locator('#importJson').fill(JSON.stringify({records:[candidate]}));
    await page.locator('#stageJson').click();
    await page.locator('#reviewQueue button').waitFor();
    await page.locator('#reviewQueue button').click();
    const digest=createHash('sha256').update(pdf).digest('hex');
    assert.match(await page.locator('#details').innerText(),new RegExp(digest));
    assert.match(await page.locator('#details').innerText(),/PENDING/);
    await page.screenshot({path:'artifacts/circular-watch/review-'+width+'.png',fullPage:true});
    await page.locator('#originalFile').setInputFiles([]);
    await page.locator('#importJson').fill(JSON.stringify({records:[fixture.records[0]]}));
    await page.locator('#stageJson').click();
    assert.match(await page.locator('#importStatus').innerText(),/cannot be imported/);
    assert.equal(await page.locator('#exportQueue').isDisabled(),true);
    // Malicious/pending records must be hidden even if delivered by a public manifest.
    await page.route('**/knowledge/circulars/index.json', route => route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({...fixture,records:[{...fixture.records[0],reviewStatus:'pending'}]})}));
    await page.locator('#searchForm button[type=submit]').click();
    await page.locator('#loading').filter({hasText:'ซ่อน 1'}).waitFor();
    assert.equal(await page.locator('#results button').count(),0);
    // A registry outage clears selected evidence/copy action; never retain stale details.
    await page.route('**/knowledge/circulars/index.json', route => route.fulfill({status:503,body:'unavailable'}));
    await page.locator('#searchForm button[type=submit]').click();
    await page.locator('#loading').filter({hasText:'ไม่สามารถโหลดทะเบียน'}).waitFor();
    assert.equal(await page.locator('#handoff').isDisabled(),true);
    assert.equal(await page.locator('#results button').count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true,'No horizontal overflow');
    assert.equal(errors.length, 0, 'No browser JS exceptions: ' + errors.join('; '));
    // Public simplified search is tested in addition to the complete legacy review workflow.
    const publicPage = await context.newPage();
    const publicErrors = [];
    publicPage.on('pageerror', error => publicErrors.push(error.message));
    await publicPage.route('**/knowledge/circulars/index.json', route => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(fixture)
    }));
    await publicPage.goto(origin + '/circular-watch.html');
    await publicPage.locator('#loading').filter({hasText:'ทะเบียนที่โหลด'}).waitFor();
    assert.equal(await publicPage.locator('#query').count(),1);
    assert.equal(await publicPage.locator('#handoff, #importFile, #reviewQueue').count(),0);
    await publicPage.locator('#query').fill('TEST/999');
    await publicPage.locator('#searchForm button[type=submit]').click();
    assert.match(await publicPage.locator('#results').innerText(),/TEST\/999/);
    assert.equal(await publicPage.locator('#results img').count(),0);
    assert.match(await publicPage.locator('#results a').first().getAttribute('href'),/^https:\/\/www\.dla\.go\.th\//);
    await publicPage.locator('#results button').click();
    assert.match(await publicPage.locator('#details').innerText(),/สถานะกฎหมายล่าสุด: ยังต้องตรวจ/);
    assert.equal(await publicPage.locator('#details img').count(),0);
    await publicPage.screenshot({path:'artifacts/circular-watch/public-'+width+'.png',fullPage:true});
    assert.equal(await publicPage.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true);
    assert.equal(publicErrors.length,0,'Public page errors: '+publicErrors.join('; '));
    await publicPage.close();
    evidence.push({width,status:'PASS',syntheticFixturesOnly:true,pdfHash:digest,queueExport:true,forgedApprovalBlocked:true,unapprovedHidden:true,outageLocksCopy:true,noHorizontalOverflow:true,pageErrors:errors});
    console.log('Circular Watch E2E PASS', width, 'px');
    await context.close();
  }
  assert.equal(evidence.length,2);
  await writeFile('artifacts/circular-watch/browser-results.json',JSON.stringify({status:'PASS',realOfficialPdfVerified:false,cases:evidence},null,2));
} finally {
  if (browser) await browser.close();
  await new Promise(done => server.close(done));
}
