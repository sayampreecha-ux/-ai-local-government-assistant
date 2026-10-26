import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=process.env.GP_QA_OUT||'artifacts/acceptance-scope';await mkdir(out,{recursive:true});
const cases=JSON.parse(await readFile('tests/fixtures/acceptance-65-20261026.json','utf8'));
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));assert.ok(p.startsWith(root+'/'));res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=process.env.GP_QA_URL||`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,args:['--no-sandbox'],...(process.env.GP_QA_URL?{proxy:{server:process.env.HTTPS_PROXY}}:{})});const rows=[],external=[];
try{for(const width of [390,1366]){
const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],reducedMotion:'reduce'});
await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===new URL(origin).origin&&!/^\/(?:api|v1)\//.test(u.pathname))return r.continue();external.push(u.href);return r.abort()});
await context.addInitScript(()=>{Date.now=()=>1792440000000;Math.random=()=>0.5;window.__destinations=[];window.open=url=>{if(url!=='about:blank')window.__destinations.push(url);return {opener:null,location:{replace:url=>window.__destinations.push(url)},close(){}}}});
const page=await context.newPage();page.setDefaultTimeout(12000);
for(const c of cases){const row={id:c.id,width,input:c.input,status:'NOT VERIFIED',semanticDeliverable:'NOT VERIFIED'};
try{await page.goto(origin+'/');await page.evaluate(()=>localStorage.clear());await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3');await page.locator('#promptInput').fill(c.input);await page.locator('#chatForm button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('.answer-card')||document.querySelector('#privacySubmitWarning'));
const next=page.getByRole('button',{name:/^ยังไม่ทราบ(?:บางข้อ — ทำต่อ| — ให้ GP ช่วยตั้งต้น)$/}).last();if(await next.isVisible())await next.click();
const card=page.locator('.message:not(.guided-intake-message) .answer-card').last();const pre=card.locator('.answer-section > details').last().locator('pre');await pre.waitFor({state:'attached'});const prompt=await pre.textContent();assert.ok(prompt.includes(c.input),'source preservation');
await card.getByRole('button',{name:/^คัดลอก(?:คำสั่งอย่างเดียว|ไปใช้กับ AI|คำสั่ง)$/}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),prompt);
for(const name of ['ChatGPT','Gemini']){await card.getByRole('button',{name:'คัดลอกแล้วเปิดใน '+name,exact:true}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),prompt)}
assert.deepEqual(await page.evaluate(()=>window.__destinations),['https://chatgpt.com/','https://gemini.google.com/']);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
if(['GP06-A','GP06-E'].includes(c.id))assert.ok(!prompt.includes('ผลลัพธ์บังคับแยก 4 ส่วนสำหรับทุกโครงการ'),'volume-only scope');
row.status='PASS';row.prompt=prompt;row.characters=prompt.length;
}catch(e){row.status='FAIL';row.error=e.message;row.visibleText=(await page.locator('body').innerText()).slice(0,6000)}rows.push(row);await writeFile(out+'/results.json',JSON.stringify({origin,rows,externalRequests:external,AIAPICalls:0},null,2));console.log(width,c.id,row.status)}await context.close()}
}finally{await browser.close();server.close()}
assert.equal(rows.filter(r=>r.status!=='PASS').length,0);
