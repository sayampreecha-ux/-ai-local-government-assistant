import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from '../src/search-worker-v2.js';
import { DocumentPilotBudget } from '../src/document-pilot-budget.js';
const root=process.cwd();
const fixtureSource=await readFile('test/document-mvp-intent-30.test.mjs','utf8');
const inputs=vm.runInNewContext(fixtureSource.match(/const fixtures = (\[[\s\S]*?\n\]);/)[1]);
const out='artifacts/pr346'; await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+'/')) throw Error();const bytes=await readFile(file);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(bytes);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.GP_CHROMIUM_EXECUTABLE?{executablePath:process.env.GP_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];let calls=0;
try {
for(const width of [390,1366]) {
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',acceptDownloads:true});
 const page=await context.newPage();
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===origin) return route.continue();
  if(url.pathname==='/api/document-studio/pilot/compose') {
    // Run actual Worker + budget object with local mock AI only. No upstream network.
    let state;let chain=Promise.resolve();
    const env={GP_DOCUMENT_PILOT_ENABLED:'true',GP_DOCUMENT_PILOT_TOKEN:'synthetic-browser-test-credential-0000000',GP_DOCUMENT_PILOT_DAILY_CALLS:'1',AI:{run:async(model,args)=>{
      calls++;const source=JSON.parse(args.messages[1].content).sourceFacts;
      return {response:{title:'บันทึกข้อความ',summary:'ร่างเพื่อให้เจ้าหน้าที่ตรวจทาน',sections:['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน','เรื่องเดิม','ข้อเท็จจริง','ข้อพิจารณา','ข้อเสนอ'].map(heading=>({heading,paragraphs:[heading==='ข้อเท็จจริง'?source:'[รอตรวจสอบ]'],bullets:[]})),actionItems:[],slides:[]}};
    }}};
    const ctx={storage:{transaction:fn=>{const p=chain.then(()=>fn({get:async()=>structuredClone(state),put:async(k,v)=>{state=structuredClone(v)}}));chain=p.catch(()=>{});return p;}},waitUntil:()=>{}};
    const budget=new DocumentPilotBudget(ctx,env);env.DOCUMENT_PILOT_BUDGET={idFromName:()=> 'one',get:()=>budget};
    const r=await worker.fetch(new Request('https://mock.workers.dev'+url.pathname,{method:'POST',headers:{origin:'https://sayampreecha-ux.github.io',authorization:`Bearer ${env.GP_DOCUMENT_PILOT_TOKEN}`},body:route.request().postData()}),env);
    return route.fulfill({status:r.status,body:await r.text(),headers:{'content-type':'application/json','access-control-allow-origin':'*'}});
  }
  return route.abort();
 });
 await page.goto(origin+'/?gpv=20261001-2');
 await page.waitForFunction(()=>!!window.GovPromptDocumentStudio);
 for(const [i,input] of inputs.entries()) {
  if(i) { await page.goto(origin+'/?gpv=20261001-2'); await page.waitForFunction(()=>!!window.GovPromptDocumentStudio); }
  await page.locator('#promptInput').fill(input);
  await page.locator('#chatForm button[type=submit]').click();
  await page.waitForTimeout(150);
  const button=page.getByRole('button',{name:'สร้างร่างบันทึก Word ใน GP'}).last();
  if(i>=15) {await page.waitForTimeout(500); assert.equal(await page.getByRole('button',{name:'สร้างร่างบันทึก Word ใน GP'}).count(),0); results.push({width,id:i+1,input,intent:'PASS',semantic:'PASS',evidence:'No memorandum action for non-memorandum request',count:await page.getByRole('button',{name:'สร้างร่างบันทึก Word ใน GP'}).count()});continue;}
  await button.click();
  await page.locator('[data-run]').click();
  await assert.doesNotReject(()=>page.getByText('กรุณายืนยัน Privacy Checkpoint ก่อนส่งเอกสารไปประมวลผล',{exact:true}).waitFor());
  await page.locator('[data-privacy]').check();
  await page.locator('[data-run]').click();
  await page.locator('[data-downloads]').waitFor({state:'visible'});
  await page.waitForFunction(input=>document.querySelector('[data-preview]')?.textContent.includes(input),input);
  const text=await page.locator('[data-preview]').textContent();
  assert.ok(text.includes(input),JSON.stringify({width,i,input,text,source:await page.locator('[data-source-text]').inputValue()}));assert.ok(text.includes('[รอตรวจสอบ]'));assert.ok(text.includes('ไม่ใช่หนังสือที่ได้รับอนุมัติ'));
  for(const h of ['ส่วนราชการ','ที่','วันที่','เรื่อง','เรียน','เรื่องเดิม','ข้อเท็จจริง','ข้อพิจารณา','ข้อเสนอ']) assert.ok(text.includes(h));
  const download=page.waitForEvent('download');await page.locator('[data-download=docx]').click();await (await download).saveAs(`${out}/memo-${width}-${i+1}.docx`);
  if(i===0) await page.screenshot({path:`${out}/studio-${width}.png`,fullPage:true});
  results.push({width,id:i+1,input,intent:'PASS',semantic:'PASS',evidence:'Mock output retains exact source, review warning, nine headings and missing-data placeholders; DOCX downloaded',liveSemantic:'NOT VERIFIED'});
  await page.locator('[data-close]').first().click();
 }
 await context.close();
}
await writeFile('docs/quality/pr346/browser-30-cases.json',JSON.stringify({mockOnly:true,liveCalls:0,mockCalls:calls,results},null,2));
console.log(JSON.stringify({cases:results.length,mockCalls:calls,status:'PASS'}));
} finally {await browser.close();server.close();}
