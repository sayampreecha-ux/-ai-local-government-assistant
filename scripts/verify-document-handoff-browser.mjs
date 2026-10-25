import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const root=process.cwd();
const source=await readFile('test/document-mvp-intent-30.test.mjs','utf8');
const inputs=vm.runInNewContext(source.match(/const fixtures = (\[[\s\S]*?\n\]);/)[1]);
const out='artifacts/pr346-handoff';await mkdir(out,{recursive:true});
await mkdir('docs/quality/pr346',{recursive:true});
const server=createServer(async(req,res)=>{try{const file=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));if(!file.startsWith(root+'/'))throw Error();res.setHeader('content-type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.env.GP_CHROMIUM_EXECUTABLE?{executablePath:process.env.GP_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];let documentRequests=0;
try {
for(const width of [390,1366]) {
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
 await context.addInitScript(()=>{window.__opened=[];window.__destinations=[];window.open=(url,...args)=>{window.__opened.push([url,...args]);if(url!=='about:blank')window.__destinations.push(url);return {opener:null,location:{replace:url=>window.__destinations.push(url)},close(){}};};});
 await context.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname.includes('/api/document-studio/'))documentRequests++;if(url.origin===origin)return route.continue();return route.abort();});
 const page=await context.newPage();
 for(const [i,input] of inputs.entries()) {
  console.log('CASE',width,i+1);
  await page.goto(origin+'/?gpv=20261001-2');
  await page.locator('#promptInput').fill(input);
  await page.locator('#chatForm button[type=submit]').click();
  await page.locator('.answer-card').waitFor({state:'visible'});
  await page.waitForTimeout(100);
  if (i>=15 && !(await page.locator('.answer-card pre').count())) {
    assert.ok(!(await page.locator('.answer-card').textContent()).includes('[GP_DOCUMENT_HANDOFF_V1]'));
    assert.equal(documentRequests,0);
    results.push({width,id:i+1,input,intent:'PASS',completionContract:'NOT APPLICABLE',clipboard:'NOT APPLICABLE - existing intake',documentAiRequests:0});
    continue;
  }
  const preview=await page.locator('.answer-card details pre').first().textContent();
  const expected=i<15;
  assert.equal(preview.includes('[GP_DOCUMENT_HANDOFF_V1]'),expected,`${width}/${i+1}`);
  if(expected) {
   for(const text of ['เนื้อหาฉบับเต็ม','[รอตรวจสอบ]','ไม่มีเครื่องมือหรือหมดโควตา','ห้ามทำลิงก์ดาวน์โหลดปลอม','Decision Lock','ไม่บังคับซื้อบริการ'])assert.ok(preview.includes(text),text);
   assert.ok(preview.includes(input));
   assert.ok(preview.includes(input.includes('บันทึกข้อความ')?'ส่วนราชการ ที่ วันที่ เรื่อง เรียน':'อย่าเปลี่ยนเป็นบันทึกข้อความ'));
  }
  await page.getByRole('button',{name:/^คัดลอกไปใช้กับ AI$|^คัดลอกคำสั่ง$|^คัดลอกคำสั่งอย่างเดียว$/}).first().click();
  const copied=await page.evaluate(()=>navigator.clipboard.readText());
  assert.equal(copied,preview,'clipboard must match the visible final prompt');
  await page.getByRole('button',{name:/^(?:เปิดใน ChatGPT|คัดลอกแล้วเปิดใน ChatGPT)$/}).click();
  await page.waitForFunction(()=>window.__destinations.includes('https://chatgpt.com/'));
  const opened=await page.evaluate(()=>window.__destinations);
  assert.equal(opened.length,1);assert.equal(opened[0],'https://chatgpt.com/');
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),preview,'Open ChatGPT must copy same prompt');
  await page.getByRole('button',{name:'คัดลอกแล้วเปิดใน Gemini',exact:true}).click();
  await page.waitForFunction(()=>window.__destinations.includes('https://gemini.google.com/'));
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),preview,'Gemini must copy same prompt');
  assert.equal(await page.getByRole('button',{name:'สร้างร่างบันทึก Word ใน GP'}).count(),0);
  assert.equal(documentRequests,0);
  if(i===0) await page.screenshot({path:`${out}/handoff-${width}.png`,fullPage:true});
  results.push({width,id:i+1,input,intent:'PASS',completionContract:expected?'PASS':'NOT APPLICABLE',clipboard:'PASS',openChatGPT:'PASS',openGemini:'PASS',documentAiRequests:0,downstreamFreeAccountOutput:'NOT VERIFIED'});
 }
 await context.close();
}
await writeFile('docs/quality/pr346/handoff-browser-30.json',JSON.stringify({results,documentAiRequests:documentRequests,downstreamAiInvocations:0},null,2));
console.log(JSON.stringify({cases:results.length,status:'PASS',documentAiRequests:documentRequests,downstreamAiInvocations:0}));
}finally{await browser.close();server.close();}
