// Runs on a checkout under an isolated HTTP origin. Never deploys or writes production.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {chromium} from 'playwright';
const root = resolve(process.env.FAT_UI_ROOT || '.');
const directory = resolve('artifacts/fat-ui');
await mkdir(directory, {recursive: true});
const cases = JSON.parse(await readFile('tests/fixtures/final-acceptance-20261012.json', 'utf8'));
const types = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml'};
const server = createServer(async (req,res) => {
  const path = resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname === '/' ? '/index.html' : new URL(req.url, 'http://localhost').pathname));
  if (!path.startsWith(root + sep)) {res.writeHead(403).end(); return;}
  try {const body = await readFile(path); res.writeHead(200, {'content-type': types[extname(path)] || 'application/octet-stream'}).end(body);}
  catch {res.writeHead(404).end();}
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const productionUrl = process.env.FAT_UI_URL;
if (productionUrl && productionUrl !== 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/') throw new Error('Unexpected production origin');
const origin = productionUrl ? productionUrl.replace(/\/$/, '') : `http://127.0.0.1:${server.address().port}`;
const scope = productionUrl ? 'production-ui' : 'isolated-checkout-ui';
const results = [];
let browser;
try {
  browser = await chromium.launch({headless:true});
  for (const [mode, viewport] of [['desktop',{width:1363,height:936}],['mobile',{width:390,height:844}]]) {
    const context = await browser.newContext({viewport,isMobile:mode==='mobile',hasTouch:mode==='mobile',permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block'});
    const page = await context.newPage();
    for (const {id,question,organization,eventYear,expected,privateValue} of cases) {
      const record = {id,mode,question,status:'BLOCKED',scope,downstreamAnswer:'NOT TESTED'};
      try {
        const response = await page.goto(origin + '/index.html', {waitUntil:'networkidle'});
        record.httpStatus = response.status();
        assert.equal(record.httpStatus,200);
        const input = page.getByRole('textbox', {name:'ข้อความถึง GovPrompt'});
        await input.fill(question);
        assert.equal(await input.inputValue(), question);
        await page.getByRole('button', {name:'ส่งข้อความ',exact:true}).click();
        if (expected === 'BLOCK') {
          await page.locator('#privacySubmitWarning').waitFor({state:'visible'});
          record.warning = await page.locator('#privacySubmitWarning').innerText();
          assert.match(record.warning,/บล็อก/);
          assert.equal(await input.inputValue(),'');
          assert.equal(await page.locator('.answer-card').count(),0);
          const persisted = await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}));
          assert.ok(!persisted.includes(privateValue),'PII must not enter persistent history');
          record.status='PASS';
        } else {
        const details = page.locator('.answer-card .answer-section details').filter({has:page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true})});
        await details.locator('summary').click({timeout:20000});
        const preview = details.locator('pre');
        record.preview = await preview.textContent();
        await page.getByRole('button', {name:/^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/}).click();
        // Read the browser's clipboard after the app's UI handler has completed.
        await page.waitForFunction(async expected => (await navigator.clipboard.readText()) === expected, record.preview);
        record.copied = await page.evaluate(() => navigator.clipboard.readText());
        assert.equal(record.copied, record.preview, 'preview and clipboard must match exactly');
        assert.ok(record.copied.includes(question), 'original question preserved');
        record.domain = await page.locator('.route-label').last().innerText();
        if (id.startsWith('TC')) {
          assert.match(record.copied, /ระดับความเสี่ยง: HIGH/);
          assert.match(record.copied, /decisionLock=ON/);
          assert.match(record.copied, /Decision Gate: ON/);
          assert.match(record.copied, /แยกข้อเท็จจริง คำชี้แจงคู่กรณี ตัวบท เหตุผลของศาล และผลคำวินิจฉัย/);
          assert.match(record.copied, /ห้ามสรุปว่าเกิน 3 ปีแล้วพ้นผิดโดยอัตโนมัติ/);
          assert.match(record.domain, /งานบุคคล|กฎหมาย/);
          assert.doesNotMatch(record.copied, /สาขางานที่เกี่ยวข้องจากเนื้อหา:[^\n]*public-health/);
          assert.doesNotMatch(await page.locator('.answer-section h3').innerText(), /จัดหน้าเอกสาร/);
        }
        if (organization) {
          assert.ok(record.copied.includes('- ORG='+organization));
          assert.match(record.copied,/qualityStatus=UNVERIFIED/);
          assert.match(record.copied,/searchStatus=NOT_SEARCHED/);
          assert.ok(record.copied.includes('พ้นราชการก่อนชี้มูล'));
          const time=record.copied.split('\n').find(line=>line.startsWith('- TIME='));
          if(eventYear) assert.ok(time.includes(eventYear),time);
          else assert.equal(time,'- TIME=[ต้องระบุวันที่เกิดข้อเท็จจริง]');
          assert.ok(!time.includes('2569'),'judgment year must not be an event date');
          assert.ok(record.copied.split('\n').some(line=>line.startsWith('- Query 3:')&&line.includes(organization)));
          assert.match(record.copied,/- Query 1:.*14\/2569.*site:ratchakitcha.soc.go.th/);
        }
        if (id==='RG01') assert.doesNotMatch(record.copied, /สาขางานที่เกี่ยวข้องจากเนื้อหา:[^\n]*public-health/);
        const amount = {'RG02':'100,000','RG03':'300,000','RG04':'20,000'}[id];
        if (amount) {
          const queries = record.copied.split('\n').filter(line=>/- Query \d:/.test(line));
          assert.ok(queries.length);
          assert.ok(queries.every(line=>line.includes(amount)), 'search terms must preserve full amount');
        }
        if (id==='RG05') assert.match(record.copied, /เอกสารเป้าหมาย: ปค\.5/);
        record.layout = await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
        assert.ok(record.layout.scrollWidth<=viewport.width+2, 'no horizontal page overflow');
        record.status='PASS';
        }
      } catch(error) {record.status='FAIL';record.error=String(error.stack||error);}
      await page.screenshot({path:resolve(directory,`${mode}-${id}.png`),fullPage:false});
      await writeFile(resolve(directory,`${mode}-${id}.json`), JSON.stringify(record,null,2));
      results.push(record);
    }
    await context.close();
  }
} finally {
  await browser?.close();
  await new Promise(r=>server.close(r));
  await writeFile(resolve(directory,'results.json'),JSON.stringify({scope,results},null,2));
}
console.log(JSON.stringify({tests:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,scope},null,2));
assert.equal(results.length,cases.length*2);
assert.equal(results.filter(r=>r.status!=='PASS').length,0,'FAT browser cases must all pass');
