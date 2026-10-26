import {chromium}from'playwright';import{createServer}from'node:http';import{readFile,writeFile,mkdir}from'node:fs/promises';import{resolve,extname}from'node:path';import assert from'node:assert/strict';
import{cases}from'../test/fixtures/local-memo-cases.mjs';
const root=resolve('dist'),out='artifacts/pr347';await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+new URL(req.url,'http://local').pathname.replace(/\/$/,'/index.html'));assert.ok(p.startsWith(root+'/'));res.setHeader('content-type',({'.js':'text/javascript','.mjs':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json'})[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404).end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
// Home intentionally hides this bounded V1 entry. Retain every legacy editor/download
// assertion by explicitly revealing only that component inside this isolated test.
async function revealRetainedMemo(page) {
 const button=page.getByRole('button',{name:'⬇️ สร้างร่าง Word ไม่ใช้ AI',exact:true,includeHidden:true}).last();
 await button.waitFor({state:'attached'});assert.equal(await button.isVisible(),false,'public entry must stay hidden');
 await button.evaluate(b=>{b.hidden=false;b.style.removeProperty('display');});return button;
}
const browser=await chromium.launch({headless:true,...(process.env.GP_CHROMIUM_EXECUTABLE?{executablePath:process.env.GP_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});let external=[];const rows=[];
try{for(const width of [390,1366]){
 const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',acceptDownloads:true});await context.route('**/*',r=>{if(new URL(r.request().url()).origin===origin && !/^\/(?:api|v1)\//.test(new URL(r.request().url()).pathname))return r.continue();external.push(r.request().url());return r.abort();});const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const c of cases){if(page.url().startsWith(origin))await page.evaluate(()=>localStorage.clear());await page.goto(origin+'/?gpv=20261001-2');await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3' && typeof window.GovPromptDocumentStudio?.downloadLocalMemorandum==='function');await page.locator('#promptInput').fill(c.input);await page.locator('#chatForm button[type=submit]').click();const b=await revealRetainedMemo(page);await b.click();const panel=page.locator('.local-memo-review');await panel.waitFor();const preview=await panel.locator('pre').first().textContent();for(const v of Object.values(c.fields))assert.ok(preview.includes(v));const save=panel.getByRole('button',{name:'ดาวน์โหลดร่าง DOCX'});assert.ok(await save.isDisabled());await panel.locator('input[type=checkbox]').check();const event=page.waitForEvent('download');await save.click();await(await event).saveAs(`${out}/memo-${width}-${c.id}.docx`);assert.deepEqual(errors,[]);rows.push({id:c.id,width,intent:'PASS',factualPreservation:'PASS',humanReview:'PASS',download:'PASS'});if(c.id===1)await page.screenshot({path:`${out}/screen-${width}.png`,fullPage:true});console.log(width,c.id,'PASS');}
 // Reproduce the actual user flow, including Guided Intake provenance and edits.
 for(const mode of ['unknown','answers']) {
  await page.evaluate(()=>localStorage.clear()); await page.goto(origin+'/?gpv=20261001-2');
  await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3' && typeof window.GovPromptDocumentStudio?.downloadLocalMemorandum==='function');
  const submit=async text=>{await page.locator('#promptInput').fill(text);await page.locator('#chatForm button[type=submit]').click();};
  await submit('ร่างบันทึกข้อความ');
  await page.getByRole('button',{name:'ยังไม่ทราบบางข้อ — ทำต่อ',exact:true}).last().waitFor();
  if(mode==='answers') {await submit('ที่: 1');await submit('เรียน: หัวหน้าหน่วยงานตัวอย่าง');}
  else await page.getByRole('button',{name:'ยังไม่ทราบบางข้อ — ทำต่อ',exact:true}).last().click();
  await (await revealRetainedMemo(page)).click();
  const panel=page.locator('.local-memo-review').last();const preview=panel.locator('pre').first();
  assert.ok(!(await preview.textContent()).includes('ข้อมูลที่ผู้ใช้ยังไม่ทราบ'));
  assert.ok(!(await preview.textContent()).includes('- topic'));
  if(mode==='answers'){assert.equal(await panel.getByRole('textbox',{name:'ที่',exact:true}).inputValue(),'1');assert.equal(await panel.getByRole('textbox',{name:'เรียน',exact:true}).inputValue(),'หัวหน้าหน่วยงานตัวอย่าง');}
  const save=panel.getByRole('button',{name:'ดาวน์โหลดร่าง DOCX'});const consent=panel.locator('input[type=checkbox]');
  await consent.check();assert.ok(await save.isEnabled());
  await panel.getByRole('textbox',{name:'เรื่อง',exact:true}).fill('ขอใช้ห้องจำลองหลังแก้ไข');assert.ok(await save.isDisabled());assert.ok(!(await consent.isChecked()));
  const facts='ข้อมูลจำลองสำหรับตรวจทาน topic recipient purpose\nเรื่อง: ข้อความนี้เป็นส่วนของข้อเท็จจริง';
  await panel.getByRole('textbox',{name:'ข้อเท็จจริง',exact:true}).fill(facts);assert.ok((await preview.textContent()).includes(facts));
  await panel.getByRole('textbox',{name:'ข้อเสนอ',exact:true}).fill('ขอประสานผู้ดูแลอาคารตรวจสอบการจอง');
  await consent.check();const event=page.waitForEvent('download');await save.click();await(await event).saveAs(`${out}/guided-${width}-${mode}.docx`);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'horizontal overflow');
  await page.screenshot({path:`${out}/guided-${width}-${mode}.png`,fullPage:true});
  await panel.getByRole('textbox',{name:'ข้อเท็จจริง',exact:true}).fill('ได้รับอนุมัติแล้ว');assert.ok(await save.isDisabled());await consent.check();assert.ok(await save.isDisabled());
  await panel.getByText('พบคำกล่าวอ้าง ต้องตรวจหลักฐานก่อน',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);rows.push({id:'guided-'+mode,width,intent:'PASS',factualPreservation:'PASS',humanReview:'PASS',download:'PASS',metadataExcluded:'PASS',editReset:'PASS',overflow:'PASS'});
 }
 for(const input of ['ร่างบันทึกข้อความ\nข้อเท็จจริง: ได้รับอนุมัติแล้ว','ร่างบันทึกข้อความ\nเรื่อง: A\nเรื่อง: B']){
  await page.goto(origin+'/?gpv=20261001-2');await page.waitForFunction(()=>typeof window.GovPromptDocumentStudio?.downloadLocalMemorandum==='function' && document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3');
  await page.locator('#promptInput').fill(input);await page.locator('#chatForm button[type=submit]').click();await (await revealRetainedMemo(page)).click();
  await page.getByText(input.includes('ได้รับอนุมัติ')?'พบคำกล่าวอ้าง ต้องตรวจหลักฐานก่อน':'พบช่องข้อมูลซ้ำ: เรื่อง กรุณาตรวจและแยกช่องให้ชัด',{exact:true}).first().waitFor({state:'visible'});assert.equal(await page.locator('.local-memo-review').count(),0);
 }
 await page.goto(origin+'/?gpv=20261001-2');await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3');await page.locator('#promptInput').fill('เขียนข่าวประชาสัมพันธ์กิจกรรมจำลอง');await page.locator('#chatForm button[type=submit]').click();await page.locator('.answer-card').waitFor();assert.equal(await page.getByRole('button',{name:'⬇️ สร้างร่าง Word ไม่ใช้ AI',exact:true}).count(),0);
 const err=await page.evaluate(async()=>{try{await window.GovPromptDocumentStudio.downloadLocalMemorandum('ร่างบันทึกข้อความ'+'ก'.repeat(12001));return '';}catch(e){return e.message;}});assert.ok(err.includes('12,000'));
 await page.goto(origin+'/?gpv=20261001-2');await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3' && typeof window.GovPromptDocumentStudio?.downloadLocalMemorandum==='function');await page.locator('#promptInput').fill('ร่างบันทึกข้อความ เลขบัตรประชาชน 1234567890123');await page.locator('#chatForm button[type=submit]').click();assert.equal(await page.locator('.answer-card').count(),0);await context.close();
}}finally{await browser.close();server.close();await writeFile(`${out}/results.json`,JSON.stringify({rows,uiNegativePathsPerViewport:['claim error','duplicate-field error','non-memo button absent','oversize error','PII blocked'],externalRequests:external,liveAiCalls:0},null,2));}assert.equal(rows.length,64);assert.equal(external.length,0);
