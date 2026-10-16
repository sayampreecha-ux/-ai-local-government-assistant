// Targeted browser verification for the newly reproduced output-contract defect.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {outputScopeCases} from '../engineering/output-scope-cases.mjs';
const base=process.env.GOVPROMPT_TEST_URL||'http://127.0.0.1:8765/';
const out='artifacts/engineering-output-scope';await mkdir(out,{recursive:true});
const results=[];const browser=await chromium.launch({headless:true});
try{
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,locale:'th-TH',permissions:['clipboard-read','clipboard-write']});
  for(const c of outputScopeCases){
   const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   let status='PASS',reason='',copied='';
   try{
    await page.addInitScript(()=>{window.__scopeCopies=[];const original=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=async value=>{await original(value);window.__scopeCopies.push(value);};});
    const response=await page.goto(base,{waitUntil:'load'});assert.equal(response.status(),200);
    await page.waitForFunction(()=>!!window.GovPromptCore?.ENGINEERING_WORKFLOWS);
    const actual=await page.evaluate(question=>{const core=window.GovPromptCore;const context=core.createSharedContext({facts:question,desiredOutput:question});const b=core.createGovernmentPrompt({question,context,route:core.routeTransaction(context)});return {output:b.outputPlan.id,review:!!b.taskPlan.constructionReview,prompt:b.prompt,gates:b.qualityGates,route:b.route.moduleId};},c.question);
    assert.equal(actual.review,c.estimate);assert.equal(actual.output==='construction-estimate',c.estimate);
    assert.equal(actual.route,'GP007');assert.equal(actual.gates.evidenceRequired,true);assert.equal(actual.gates.decisionRequired,true);
    assert.equal(actual.prompt.includes('ผลลัพธ์บังคับแยก 4 ส่วน'),c.estimate);
    await page.locator('#promptInput').fill(c.question);await page.locator('#chatForm button[type="submit"]').click();
    for(let n=0;n<3;n++){
     await page.waitForTimeout(120);
     const choice=page.locator('#conversation .guided-intake-message button').filter({hasText:/ยังไม่ทราบ|ทำต่อ|ช่วยตั้งต้น/}).last();
     if(await choice.isVisible().catch(()=>false)&&await page.locator('#conversation .answer-card').count()===0)await choice.click();
    }
    const card=page.locator('#conversation .answer-card').first();await card.waitFor({state:'attached',timeout:25000});
    await page.waitForFunction(()=>document.querySelector('#conversation .answer-card')?.dataset.leanModeReady==='true');
    const copy=page.locator('#conversation .answer-actions button').filter({hasText:/คัดลอกไปใช้กับ AI|คัดลอกคำสั่ง/}).first();await copy.click();
    await page.waitForFunction(()=>window.__scopeCopies.length>0);
    copied=await page.evaluate(()=>window.__scopeCopies.at(-1));
    assert.ok(copied.includes(c.task));assert.match(copied,/Decision Lock: ON/);assert.match(copied,/Human Review/);
    assert.equal(copied.includes('ผลลัพธ์บังคับแยก 4 ส่วน'),c.estimate,'actual clipboard contract differs');
    assert.equal(errors.length,0,errors.join(';'));
    await writeFile(`${out}/${mobile?'mobile':'desktop'}-${c.id}-copied.txt`,copied);
    if(c.id==='drawing-only'||c.id==='acceptance-only')await page.screenshot({path:`${out}/${mobile?'mobile':'desktop'}-${c.id}.png`,fullPage:true});
   }catch(e){status='FAIL';reason=String(e.stack||e);}
   results.push({device:mobile?'mobile':'desktop',...c,status,reason,clipboardVerified:!!copied,errors});
   console.log(mobile?'mobile':'desktop',c.id,status,reason.slice(0,120));await page.close();
  }
  await context.close();
 }
}finally{await browser.close();}
const summary={total:results.length,pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,results};
await writeFile(`${out}/results.json`,JSON.stringify(summary,null,2));
assert.equal(summary.total,16);assert.equal(summary.fail,0);
