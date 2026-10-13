// Blind acceptance supplement. Never loads the sealed answer key.
// Run against local checkout: python3 -m http.server 8765 & node tests/e2e/construction-blind-acceptance.mjs
// Optional: BLIND_PDF=/path/blind_input.pdf BLIND_XLSX=/path/blind_input_no_answer_key.xlsx
import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:8765/';
const out='artifacts/construction-blind-acceptance';
await mkdir(out,{recursive:true});
const pdf=process.env.BLIND_PDF;
const xlsx=process.env.BLIND_XLSX;
const inputEvidence={pdf:'NOT PROVIDED',xlsx:'NOT PROVIDED',pdfPages:'NOT TESTED',downstreamAI:'NOT TESTED'};
if(pdf){const bytes=await readFile(pdf);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');inputEvidence.pdf='PRESENT';inputEvidence.pdfPages='NOT VERIFIED';}
if(xlsx){const bytes=await readFile(xlsx);assert.equal(bytes.subarray(0,2).toString(),'PK');inputEvidence.xlsx='PRESENT';}
assert.ok(!/answer_key|sealed|qa_gates/i.test([pdf,xlsx].filter(Boolean).join(' ')),'Answer key must never be an input');
const cases=[
 ['engineering-road-blind','ช่วยถอดปริมาณงานก่อสร้างจากแบบรูปรายการและจัดทำ BOQ/ปร.4 ถนน ค.ส.ล. โดยแยกข้อมูลไม่พอและให้วิศวกรตรวจรับรอง','GP007'],
 ['engineering-short','ถอดแบบถนน ค.ส.ล.','GP007'],
 ['engineering-drawing','ถอดปริมาณงานก่อสร้างจากแบบรูปรายการเพื่อจัดทำ BOQ','GP007'],
 ['media-explicit','สร้างภาพประชาสัมพันธ์โครงการก่อสร้างถนนให้สวย','GP012'],
 ['legal-control','ตรวจสอบฐานอำนาจตามกฎหมายขององค์กรปกครองส่วนท้องถิ่น','GP002'],
 ['procurement-control','จัดทำ TOR งานก่อสร้างเพื่อจัดซื้อจัดจ้าง','GP003'],
 ['media-control','ออกแบบปกนำเสนอผลงานผู้บริหาร','GP012']
];
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const device of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]){
  const ctx=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'th-TH',permissions:['clipboard-read','clipboard-write']});
  const page=await ctx.newPage();
  for(const [id,question,expected] of cases){
   let status='PASS',error='',actual=null;
   const errors=[],httpErrors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)httpErrors.push(r.url()+':'+r.status())});
   try{
    const res=await page.goto(base,{waitUntil:'load',timeout:30000});assert.equal(res.status(),200);
    await page.locator('#promptInput').waitFor({state:'visible'});
    await page.waitForFunction(()=>typeof window.GovPromptCore?.createGovernmentPrompt==='function');
    actual=await page.evaluate(q=>{
     const core=window.GovPromptCore,route=core.routeRequest(q);
     const r=core.createGovernmentPrompt({question:q,route,context:core.createSharedContext({facts:q,desiredOutput:q})});
     return {route,outputRoute:r.route,plan:r.taskPlan,prompt:r.prompt,gates:r.qualityGates};
    },question);
    assert.ok([actual.route?.moduleId,actual.route?.primaryModule,actual.outputRoute?.moduleId].includes(expected),'Incorrect route');
    if(expected==='GP007'){
     assert.match(actual.prompt,/gov\\.engineering|Construction QA/i);
     assert.match(actual.prompt,/Human Review/i);
     assert.match(actual.prompt,/Decision Lock/i);
     assert.equal(actual.gates?.evidenceRequired,true);
     assert.equal(actual.gates?.decisionRequired,true);
     if(id==='engineering-road-blind'){
      for(const marker of ['ปร.4','Factor F','ตาราง A','ตาราง B','ตาราง C','ตาราง D']) assert.ok(actual.prompt.includes(marker),'Missing '+marker);
     }
    }
    await page.locator('#promptInput').fill(question);
    await page.locator('#chatForm button[type="submit"]').click();
    const intake=page.locator('#conversation button').filter({hasText:/ยังไม่ทราบ|ทำต่อ|ช่วยตั้งต้น/}).first();
    if(await intake.isVisible().catch(()=>false)) await intake.click();
    await page.locator('#thinkingMessage').waitFor({state:'detached',timeout:25000});
    const copy=page.locator('#conversation button').filter({hasText:/คัดลอก(?:\\s*คำสั่ง|\\s*Prompt|ไปใช้กับ AI)/i}).first();
    await copy.waitFor({state:'visible',timeout:10000});await copy.click();
    const clipboard=await page.evaluate(()=>navigator.clipboard.readText());
    assert.ok(clipboard.length>100,'Empty clipboard');
    if(expected==='GP007') assert.match(clipboard,/gov\\.engineering|Construction QA|Factor F/i);
    assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
    if(id==='engineering-road-blind')await writeFile(out+'/'+device.name+'-actual-prompt.txt',clipboard);
    await page.screenshot({path:out+'/'+device.name+'-'+id+'.png',fullPage:true});
   }catch(e){status='FAIL';error=String(e?.stack||e);try{await page.screenshot({path:out+'/'+device.name+'-'+id+'-FAIL.png',fullPage:true})}catch{}}
   results.push({device:device.name,id,expected,status,error,actualRoute:actual?.route,scope:'prompt-generation',numericBlindAnswer:'NOT TESTED',downstreamAI:'NOT TESTED'});
   console.log(device.name,id,status,error.split('\\n')[0]);
  }
  await ctx.close();
 }
}finally{await browser.close();}
await writeFile(out+'/results.json',JSON.stringify({inputEvidence,results,answerKeyOpened:false,productionTested:false},null,2));
if(results.some(r=>r.status==='FAIL'))process.exitCode=1;
