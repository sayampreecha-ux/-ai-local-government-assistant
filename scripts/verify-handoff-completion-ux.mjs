import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
import {cases,privacyBlockedCases} from '../test/fixtures/handoff-completion-cases.mjs';
const root=resolve('dist'),out='artifacts/handoff-completion-ux';await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));assert.ok(p.startsWith(root+'/'));res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.GP_CHROMIUM_EXECUTABLE?{executablePath:process.env.GP_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const rows=[],external=[];
try{for(const width of [390,1366]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin&&!/^\/(?:api|v1)\//.test(u.pathname))return r.continue();external.push(u.href);return r.abort();});
 await context.addInitScript(()=>{window.__destinations=[];window.open=(url)=>{if(url!=='about:blank')window.__destinations.push(url);return {opener:null,location:{replace:url=>window.__destinations.push(url)},close(){}};};});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [i,[input,expected]] of cases.entries()){
  await page.goto(origin+'/?gpv=20261001-2');await page.evaluate(()=>localStorage.clear());
  await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3');
  await page.locator('#promptInput').fill(input);await page.locator('#chatForm button[type=submit]').click();
  // Exercise existing intake before deciding whether the guarded handoff is available.
  await page.waitForFunction(()=>document.querySelector('.answer-card')||document.querySelector('#privacySubmitWarning'));
  const next=page.getByRole('button',{name:/^ยังไม่ทราบ(?:บางข้อ — ทำต่อ| — ให้ GP ช่วยตั้งต้น)$/,exact:true}).last();
  if(await next.isVisible()){
   await next.click();
   await page.waitForFunction(()=>document.querySelectorAll('.guided-intake-message').length===0||document.querySelector('#privacySubmitWarning'));
  }
  if(privacyBlockedCases.has(i)){
   await page.locator('#privacySubmitWarning').waitFor();
   assert.ok((await page.locator('#privacySubmitWarning').textContent()).includes(i===10?'ข้อมูลสุขภาพ/ความพิการ':'ข้อมูลลับของราชการ'),'expected existing privacy classification');
   assert.equal(await page.locator('.message:not(.guided-intake-message) .answer-card').count(),0);assert.deepEqual(await page.evaluate(()=>window.__destinations),[]);assert.deepEqual(errors,[]);
   rows.push({id:i+1,width,input,intentRouting:'NOT VERIFIED - blocked before final Router handoff',completionContract:'NOT VERIFIED - blocked before handoff',privacyGuard:'PASS - existing conservative health/confidential-context block',previewCopyChatGPTGemini:'NOT APPLICABLE',semanticDeliverable:'NOT VERIFIED'});console.log(width,i+1,'PRIVACY BLOCK VERIFIED');
   continue;
  }
  const card=page.locator('.answer-card').last();await card.waitFor();
  const details=card.locator('.answer-section > details').last();const previewNode=details.locator('pre');await previewNode.waitFor({state:'attached'});
  await page.waitForFunction(()=>[...document.querySelectorAll('.answer-card button')].some(b=>b.textContent==='คัดลอกแล้วเปิดใน Gemini'));
  const preview=await previewNode.textContent();
  assert.ok(preview.includes(input),'all original user text must survive handoff');
  assert.equal(/\[GP_(?:DOCUMENT|DELIVERABLE)_HANDOFF_V1\]/.test(preview),expected,`${width}/${i+1} scope`);
  assert.equal(await card.getByRole('button',{name:'⬇️ สร้างร่าง Word ไม่ใช้ AI',exact:true}).count(),0,'local memo public entry hidden');
  assert.equal(await card.locator('.local-memo-review').count(),0);
  if(!await card.locator('.budget-runtime-result').count())assert.equal(await card.locator('.answer-section > h3').textContent(),'คำสั่งพร้อมส่งต่อ AI — ยังไม่ใช่เอกสารฉบับสมบูรณ์');
  if(expected){assert.match(preview,/ชิ้นงานฉบับเต็ม/);assert.match(preview,/ห้ามทำลิงก์ดาวน์โหลดปลอม/);assert.match(preview,/Human Review/);assert.match(preview,/Legal Version Gate/);}
  await card.getByRole('button',{name:/^(?:คัดลอกคำสั่งอย่างเดียว|คัดลอกไปใช้กับ AI|คัดลอกคำสั่ง)$/}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),preview,'Preview=Copy');
  for(const [name,url]of [['ChatGPT','https://chatgpt.com/'],['Gemini','https://gemini.google.com/']]){
   await card.getByRole('button',{name:'คัดลอกแล้วเปิดใน '+name,exact:true}).click();await page.waitForFunction(url=>window.__destinations.includes(url),url);
   assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),preview,'Preview='+name);
  }
  assert.deepEqual(await page.evaluate(()=>window.__destinations),['https://chatgpt.com/','https://gemini.google.com/']);
  assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  if(i===0){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${out}/handoff-${width}.png`,fullPage:false});await writeFile(`${out}/canonical-${width}.txt`,preview);}
  rows.push({id:i+1,width,input,intentRouting:'PASS',completionContract:expected?'PASS':'NOT APPLICABLE',sourcePreservation:'PASS',previewCopyChatGPTGemini:'PASS',semanticDeliverable:'NOT VERIFIED',promptCharacters:preview.length});console.log(width,i+1,'PASS');
 }
 // Privacy must block direct identifiers before a handoff; no live destination is submitted.
 await page.goto(origin+'/?gpv=20261001-2');await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3');await page.locator('#promptInput').fill('ร่างบันทึกข้อความ เลขบัตรประชาชน 1234567890123');await page.locator('#chatForm button[type=submit]').click();assert.equal(await page.locator('.answer-card').count(),0);assert.deepEqual(await page.evaluate(()=>window.__destinations),[]);
 await context.close();
}}finally{await browser.close();server.close();await writeFile(`${out}/results.json`,JSON.stringify({rows,externalRequests:external,AIAPICalls:0,downstreamSemanticDeliverable:'NOT VERIFIED'},null,2));}
assert.equal(rows.length,60);assert.deepEqual(external,[]);
