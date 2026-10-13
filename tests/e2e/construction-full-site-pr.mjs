import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.GOVPROMPT_TEST_URL || 'http://127.0.0.1:8765/';
if (!/^http:\/\/127\.0\.0\.1:8765\/$/.test(base)) throw Error('Local PR server only');
const out='artifacts/construction-full-site-pr';
await mkdir(out,{recursive:true});
const cases=[
 ['engineering-road-csl-full','ช่วยถอดปริมาณงานก่อสร้างจากแบบรูปรายการและจัดทำ BOQ/ปร.4 เป็นรายการ พร้อมหน่วย สูตรคำนวณ ตำแหน่งอ้างอิงแบบ และหลักฐานแต่ละปริมาณ แยกรายการที่คำนวณได้จริงกับรายการที่ข้อมูลไม่พอ ห้ามเดาขนาด ปริมาณ หรือรายละเอียดที่ไม่มีในแบบ และให้วิศวกรตรวจรับรองผล ก่อสร้างถนนคสล','GP007'],
 ['engineering-road-csl-short','ถอดแบบถนน ค.ส.ล. จัดทำรูปแบบ BOQ และ ปร.4/ปร.5','GP007'],
 ['engineering-building','ถอดแบบก่อสร้างอาคารและจัดทำ BOQ','GP007'],
 ['engineering-generic','ถอดแบบและถอดปริมาณเพื่อทำ BOQ','GP007'],
 ['engineering-pr4','ประมาณราคางานก่อสร้างอาคาร จัดทำ ปร.4 และ ปร.5','GP007'],
 ['engineering-road','จัดทำราคากลางงานก่อสร้างถนนคอนกรีต','GP007'],
 ['engineering-factor','ตรวจสอบราคาวัสดุ ค่าแรง และ Factor F','GP007'],
 ['engineering-compare','ตรวจสอบปริมาณงานจากแบบเทียบกับ ปร.4','GP007'],
 ['procurement-tor','จัดทำ TOR งานก่อสร้างเพื่อจัดซื้อจัดจ้าง','GP003'],
 ['legal','วิเคราะห์ข้อกฎหมายปกครองเกี่ยวกับอำนาจขององค์กรปกครองส่วนท้องถิ่น','GP002'],
 ['legal-local-authority','ตรวจสอบฐานอำนาจตามกฎหมายขององค์กรปกครองส่วนท้องถิ่น','GP002'],
 ['media-cover','ออกแบบปกนำเสนอผลงานผู้บริหาร','GP012']
];
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const device of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]) {
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'th-TH',permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  const errors=[];const network=[];const httpErrors=[];let navigating=false;const unexpectedFailures=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))httpErrors.push({url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>{const failure={url:r.url(),error:r.failure()?.errorText,duringNavigation:navigating};network.push(failure);if(!(navigating&&failure.error==='net::ERR_ABORTED'))unexpectedFailures.push(failure);});
  for(const [id,question,expected] of cases) {
   let status='PASS',reason='';
   try {
    navigating=true;
    const response=await page.goto(base,{waitUntil:'load',timeout:30000});
    navigating=false;
    assert.equal(response?.status(),200);
    await page.locator('#promptInput').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>typeof window.GovPromptCore?.createGovernmentPrompt==='function' && typeof window.GovPromptCore?.routeRequest==='function',{},{timeout:15000});
    const actual=await page.evaluate(question=>{
     const core=window.GovPromptCore;
     const request=core.routeRequest(question);
     const transaction=core.routeTransaction?.(question);
     const result=core.createGovernmentPrompt({question,route:request,context:core.createSharedContext({facts:question,desiredOutput:question})});
     return {request,transaction,route:result.route,prompt:result.prompt,plan:result.taskPlan,gates:result.qualityGates};
    },question);
    const modules=[actual.request?.moduleId,actual.request?.primaryModule,actual.route?.moduleId];
    assert.ok(modules.includes(expected),JSON.stringify(modules));
    if(expected==='GP007'){
     assert.match(actual.prompt,/Primary Workflow[^\n]*gov\.engineering/);
     assert.equal(actual.gates?.evidenceRequired,true);
     assert.equal(actual.gates?.decisionRequired,true);
     for(const marker of ['Human Review','Partial Decision Lock: ON'])assert.ok(actual.prompt.includes(marker),marker);
    }
    await page.locator('#promptInput').fill(question);
    await page.locator('#chatForm button[type="submit"]').click();
    const intakeChoice=page.locator('#conversation button').filter({hasText:/ยังไม่ทราบ|ทำต่อ|ช่วยตั้งต้น/}).first();
    if(await intakeChoice.isVisible().catch(()=>false)){
      await intakeChoice.click();
    }
    await page.locator('#conversation .message.user, #conversation .message.assistant .answer-card').first().waitFor({state:'attached',timeout:20000});
    await page.locator('#thinkingMessage').waitFor({state:'detached',timeout:25000});
    assert.ok((await page.locator('#conversation .message.assistant').count())>0,'assistant response absent');
    assert.ok((await page.locator('#conversation').innerText()).length>30,'empty conversation');
    const copy=page.locator('#conversation button').filter({hasText:/คัดลอก(?:\\s*คำสั่ง|\\s*Prompt|ไปใช้กับ AI)/i}).first();
    await copy.waitFor({state:'visible',timeout:10000});
    await copy.click();
    const clipboard=await page.evaluate(()=>navigator.clipboard.readText());
    assert.ok(clipboard.length>100,'clipboard missing generated prompt');
    if(expected==='GP007')assert.match(clipboard,/gov\\.engineering|Construction QA|Factor F/i,'engineering instructions absent from clipboard');
    if(expected==='GP007'){
     assert.doesNotMatch(clipboard,/IMAGE CREATIVE MODE|หมวดที่ระบบคาดการณ์: GP012/,'late image route contaminated construction prompt');
     assert.match(clipboard,/หมวดที่ระบบคาดการณ์: GP007/,'copied prompt must retain engineering route');
     for(const marker of ['A ตาราง','B สูตร','C ตาราง','D ข้อจำกัด'])assert.ok(clipboard.includes(marker),marker);
    }
    assert.equal(errors.length,0,'page errors: '+errors.join('; '));
    assert.equal(unexpectedFailures.length,0,'unexpected network failures: '+JSON.stringify(unexpectedFailures));
    assert.equal(httpErrors.length,0,'HTTP errors: '+JSON.stringify(httpErrors));
    await page.screenshot({path:`${out}/${device.name}-${id}.png`,fullPage:true});
   }catch(e){status='FAIL';reason=String(e?.stack||e);try{reason+=' | UI='+JSON.stringify({conversation:(await page.locator('#conversation').innerText()).slice(0,900),input:await page.locator('#promptInput').inputValue(),url:page.url()})}catch{}try{await page.screenshot({path:`${out}/${device.name}-${id}-FAIL.png`,fullPage:true})}catch{}}
   results.push({device:device.name,id,question,expected,status,reason,pageErrors:[...errors],networkErrors:[...network],httpErrors:[...httpErrors],scope:'full-site-local-http-pr',downstreamAI:'NOT TESTED',officialRateEvidence:'NOT VERIFIED'});
   console.log(device.name,id,status,reason.split('\n')[0]);
   errors.length=0;network.length=0;httpErrors.length=0;unexpectedFailures.length=0;navigating=false;
  }
  await context.close();
 }
}finally{await browser.close()}
await writeFile(`${out}/results.json`,JSON.stringify({commit:process.env.GITHUB_SHA||null,base,results},null,2));
console.log('Full-site PR E2E',results.filter(x=>x.status==='PASS').length+'/'+results.length);
if(results.some(x=>x.status!=='PASS'))process.exitCode=1;
