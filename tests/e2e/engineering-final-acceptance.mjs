// Additive acceptance: the original 72/60/16 suites and assertions remain unchanged.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
const cases=JSON.parse(await readFile('tests/engineering/final-acceptance-cases.json','utf8'));
const base=process.env.GOVPROMPT_TEST_URL||'http://127.0.0.1:8765/';
const out='artifacts/engineering-final-acceptance';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const rows=[];
const devices=[{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}];
async function finishIntake(page){
 for(let n=0;n<4;n++){
  const copy=page.getByRole('button',{name:/^(?:คัดลอกไปใช้กับ AI|คัดลอกคำสั่งอย่างเดียว|คัดลอกคำสั่ง)$/}).first();
  const choice=page.locator('#conversation .guided-intake-message button').filter({hasText:/ยังไม่ทราบ|ทำต่อ|ช่วยตั้งต้น/}).last();
  await Promise.race([copy.waitFor({state:'visible',timeout:12000}).catch(()=>{}),choice.waitFor({state:'visible',timeout:12000}).catch(()=>{})]);
  if(await copy.isVisible())return copy;
  if(await choice.isVisible()){await choice.click();await choice.waitFor({state:'hidden',timeout:12000});continue;}
 }
 await page.getByRole('button',{name:/^(?:คัดลอกไปใช้กับ AI|คัดลอกคำสั่งอย่างเดียว|คัดลอกคำสั่ง)$/}).first().waitFor({state:'visible',timeout:25000});
 return page.getByRole('button',{name:/^(?:คัดลอกไปใช้กับ AI|คัดลอกคำสั่งอย่างเดียว|คัดลอกคำสั่ง)$/}).first();
}
function verifyPrompt(c,prompt,meta){
 assert.ok(prompt.includes(c.question),'copied prompt lost user input');
 assert.ok(c.expectedOutputs.includes(meta.output),'wrong output '+meta.output);
 assert.equal(meta.module,'GP007');assert.equal(meta.transaction,'GP007');
 for(const id of c.expectedTasks){assert.ok(meta.tasks.includes(id),'task '+id);assert.match(prompt,new RegExp('^'+id+' ','m'));}
 assert.equal(meta.gates.evidenceRequired,true);assert.equal(meta.gates.decisionRequired,true);
 assert.match(prompt,/Evidence Gate: ON/);assert.doesNotMatch(prompt,/Evidence Gate: OFF/);
 assert.match(prompt,/Decision Lock: ON/);assert.match(prompt,/Human Review/);assert.match(prompt,/Trusted Numeric: NO-GO/);
 assert.match(prompt,/GovPrompt สร้าง Prompt สำหรับ AI ภายนอกเท่านั้น/);
 assert.doesNotMatch(prompt,/- ส่งผลลัพธ์หลักในรูปแบบ “บทวิเคราะห์”/);
 assert.ok(prompt.includes('- ประเภท: '+meta.label),'actual clipboard output differs from generated bundle');
 if((c.expectedTasks?.length===1&&c.expectedTasks[0]==='D01')||c.id==='drawing-menu'){
  assert.equal(meta.output,'technical-drawing');assert.equal(meta.action,'draft');assert.equal(meta.risk,'HIGH');
  assert.deepEqual(meta.tasks,['D01']);assert.match(prompt,/ห้ามเดาความหนา เหล็กเสริม/);assert.match(prompt,/หากสร้างไฟล์ CAD\/แบบจริงไม่ได้/);
  if(/100 เมตร/.test(c.question))assert.match(prompt,/100 เมตร/);
  if(/6 เมตร/.test(c.question))assert.match(prompt,/6 เมตร/);
  assert.doesNotMatch(prompt,/^T04 /m);assert.doesNotMatch(prompt,/^T06 /m);
 }
 if((c.task==='T01'&&!/BOQ|ปร\.?4/i.test(c.question))||c.task==='T11')assert.doesNotMatch(prompt,/ผลลัพธ์บังคับแยก 4 ส่วน/);
 if(c.id==='T08-cross'||c.id==='T12-cross')assert.match(prompt,/ส่งโพสต์\/ชิ้นงานประชาสัมพันธ์ที่ขอร่วมด้วย/);
}
try{for(const d of devices){
 const context=await browser.newContext({...d,locale:'th-TH',permissions:['clipboard-read','clipboard-write']});const page=await context.newPage();
 for(const c of [...cases,{id:'drawing-menu',task:'D01',question:cases.find(c=>c.id==='T05-critical-drawing').question,expectedTasks:['D01'],expectedOutputs:['technical-drawing'],menu:true}]){
  const row={device:d.name,id:c.id,input:c.question,expected:{tasks:c.expectedTasks,outputs:c.expectedOutputs},started:new Date().toISOString(),status:'FAIL'};const errors=[];const http=[];
  const onError=e=>errors.push(String(e));const onResponse=r=>{if(r.url().startsWith(base)&&r.status()>=400)http.push(r.status()+' '+r.url())};page.on('pageerror',onError);page.on('response',onResponse);
  try{
   const response=await page.goto(base,{waitUntil:'load'});assert.equal(response.status(),200);await page.locator('#promptInput').waitFor({state:'visible'});
   if(c.menu){
    await page.getByText('งานช่างและวิศวกรรม',{exact:true}).click();await page.getByRole('button',{name:'จัดทำแบบรูปรายการงานก่อสร้าง',exact:true}).click();
    await page.locator('.guided-intake-message').waitFor({state:'visible'});
    assert.equal(await page.getByText('ร่าง TOR ให้เริ่มง่าย — บอก GP 3 เรื่อง',{exact:true}).count(),0);
    assert.equal(await page.locator('.guided-intake-message li').count(),1,'drawing asks one question in main chat');
   }
   await page.locator('#promptInput').fill(c.question);await page.locator('#chatForm button[type="submit"]').click();
   const copy=c.menu ? page.getByRole('button',{name:/^(?:คัดลอกไปใช้กับ AI|คัดลอกคำสั่งอย่างเดียว|คัดลอกคำสั่ง)$/}).first() : await finishIntake(page);
   if(c.menu)await copy.waitFor({state:'visible',timeout:12000});
   await page.waitForFunction(()=>document.querySelector('#conversation .answer-card[data-lean-mode-ready="true"]'));
   await copy.click();row.prompt=await page.evaluate(()=>navigator.clipboard.readText());
   // Compare source planner metadata with the actual copied handoff, without replacing UI submit/copy.
   row.actual=await page.evaluate(question=>{const core=window.GovPromptCore;const context=core.createSharedContext({facts:question,desiredOutput:question});const transaction=core.routeTransaction(context);const r=core.createGovernmentPrompt({question,context,route:transaction});return{module:r.route.moduleId,transaction:transaction.primaryModule||transaction.moduleId,output:r.outputPlan.id,label:r.outputPlan.label,action:r.taskPlan.action,risk:r.taskPlan.riskLevel,tasks:r.engineeringPlan?.tasks.map(t=>t.id)||[],gates:r.qualityGates}},c.question);
   verifyPrompt(c,row.prompt,row.actual);assert.equal(errors.length,0,errors.join(';'));assert.equal(http.length,0,http.join(';'));
   if(['T05-critical-drawing','drawing-menu','T03-normal','T08-cross'].includes(c.id))await page.screenshot({path:`${out}/${d.name}-${c.id}.png`,fullPage:true});
   row.clipboard='PASS (native readText verified)';row.status='PASS';
  }catch(e){row.reason=String(e.stack||e);await page.screenshot({path:`${out}/FAIL-${d.name}-${c.id}.png`,fullPage:true}).catch(()=>{});}
  finally{row.pageErrors=errors;row.httpErrors=http;row.completed=new Date().toISOString();page.off('pageerror',onError);page.off('response',onResponse);rows.push(row);console.log(d.name,c.id,row.status,row.reason?.slice(0,220)||'');await writeFile(`${out}/results.json`,JSON.stringify({total:rows.length,pass:rows.filter(r=>r.status==='PASS').length,fail:rows.filter(r=>r.status!=='PASS').length,results:rows},null,2));}
 }
 // Negative domain regression uses actual submit and copy, too.
 for(const c of [{id:'negative-pr',question:'ทำโพสต์ประชาสัมพันธ์ซ่อมถนน',expected:/ผู้ช่วยงานประชาสัมพันธ์/},{id:'negative-tor',question:'ร่าง TOR ซื้อคอมพิวเตอร์',expected:/TOR/},{id:'negative-records',question:'ร่างหนังสือขอความอนุเคราะห์',expected:/หนังสือ/},{id:'negative-gp223',question:'ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา',expected:/จ้างเหมาบริการ/}]){
  let row={device:d.name,id:c.id,input:c.question,status:'FAIL'};
  try{await page.goto(base,{waitUntil:'load'});await page.locator('#promptInput').fill(c.question);await page.locator('#chatForm button[type="submit"]').click();const copy=await finishIntake(page);await copy.click();row.prompt=await page.evaluate(()=>navigator.clipboard.readText());assert.match(row.prompt,c.expected);assert.doesNotMatch(row.prompt,/=== ENGINEERING 12/);row.status='PASS';}catch(e){row.reason=String(e.stack||e);}rows.push(row);console.log(d.name,c.id,row.status,row.reason?.slice(0,180)||'');
 }
 await context.close();
}}finally{await browser.close();}
const summary={total:rows.length,pass:rows.filter(r=>r.status==='PASS').length,fail:rows.filter(r=>r.status!=='PASS').length,results:rows};await writeFile(`${out}/results.json`,JSON.stringify(summary,null,2));assert.equal(summary.total,138);assert.equal(summary.fail,0,'final engineering acceptance failed');
