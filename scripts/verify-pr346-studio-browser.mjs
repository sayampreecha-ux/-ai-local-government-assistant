// Legacy Studio UI acceptance with predetermined mocked compose response; never live AI.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out='artifacts/pr346-release';await mkdir(out,{recursive:true});
const fixture=JSON.parse(await readFile(`${out}/fixture.json`,'utf8'));
const server=createServer(async(req,res)=>{try{const path=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));assert.ok(path.startsWith(root+'/'));res.setHeader('content-type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.GP_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];let mockCalls=0,liveCalls=0;
try{for(const width of [390,1366]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',acceptDownloads:true});let fail=false;
 await context.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/api/document-studio/compose'){
   mockCalls++;const body=route.request().postDataJSON();assert.equal(body.privacyConfirmed,true);assert.ok(body.text.includes('ข้อมูลจำลอง'));
   return route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'MOCK_UNAVAILABLE'}:{document:fixture})});
  }
  if(u.origin===origin)return route.continue();return route.abort();
 });
 const page=await context.newPage();await page.goto(origin);await page.evaluate(()=>window.GovPromptDocumentStudio.open());
 const studio=page.locator('#gpDocumentStudio');const before=mockCalls;
 await studio.locator('[data-file]').setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('ข้อมูลจำลอง จัดกิจกรรม 5 พฤศจิกายน 2569 ผู้เข้าร่วม 20 คน')});
 await studio.locator('[data-run]').click();await page.waitForTimeout(100);assert.equal(mockCalls,before);assert.ok((await studio.locator('[data-status]').textContent()).includes('Privacy Checkpoint'));
 await studio.locator('[data-privacy]').check();await studio.locator('[data-run]').click();await studio.locator('[data-preview]').waitFor({state:'visible'});
 assert.equal(mockCalls,before+1);const preview=await studio.locator('[data-preview]').textContent();for(const text of ['บันทึกข้อความ','เรื่องเดิม','ข้อเท็จจริง','ข้อพิจารณา','ข้อเสนอ','[รอตรวจสอบ]','20 คน'])assert.ok(preview.includes(text));
 const downloadEvent=page.waitForEvent('download');await studio.locator('[data-download="docx"]').click();const download=await downloadEvent;await download.saveAs(`${out}/studio-${width}.docx`);
 assert.deepEqual(await readFile(`${out}/studio-${width}.docx`),await readFile(`${out}/generator-memo.docx`));
 await page.screenshot({path:`${out}/studio-${width}.png`,fullPage:true});
 // Sensitive input is rejected locally without calling mocked compose.
 await studio.locator('[data-file]').setInputFiles({name:'synthetic-sensitive.txt',mimeType:'text/plain',buffer:Buffer.from('ข้อมูลจำลอง เลขบัตรประชาชน 1234567890123')});await studio.locator('[data-run]').click();await page.waitForTimeout(100);assert.equal(mockCalls,before+1);assert.ok((await studio.locator('[data-status]').textContent()).includes('ข้อมูลอ่อนไหว'));
 // Mock provider failure must hide stale downloads, not claim success.
 fail=true;await studio.locator('[data-file]').setInputFiles({name:'synthetic.txt',mimeType:'text/plain',buffer:Buffer.from('ข้อมูลจำลอง')});await studio.locator('[data-run]').click();await page.waitForFunction(()=>document.querySelector('#gpDocumentStudio [data-status]').textContent.includes('MOCK_UNAVAILABLE'));assert.equal(await studio.locator('[data-downloads]').isVisible(),false);
 results.push({width,privacyBeforeRequest:'PASS',mockCompose:'PASS',reviewPreview:'PASS',realDocxDownload:'PASS',sensitiveInput:'PASS',providerFailure:'PASS',semanticOutput:'NOT VERIFIED - predetermined fixture'});await context.close();
}}finally{await browser.close();server.close();await writeFile(`${out}/studio-results.json`,JSON.stringify({results,mockCalls,liveCalls,downstreamAiInvocations:0},null,2));}
console.log(JSON.stringify({results,mockCalls,liveCalls}));
