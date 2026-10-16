// Twelve tasks, three scenarios each, through actual submit and clipboard on desktop/mobile.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const base=process.env.GOVPROMPT_TEST_URL || 'http://127.0.0.1:8765/';
const out='artifacts/engineering-twelve-acceptance';
import {cases} from '../engineering/cases.mjs';
const devices=[{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}];
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
for(const device of devices){
 const context=await browser.newContext({viewport:device.viewport,isMobile:!!device.isMobile,hasTouch:!!device.hasTouch,locale:'th-TH',permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();
 await page.addInitScript(() => {
  window.__clipboardWrites = [];
  const originalWriteText = navigator.clipboard?.writeText?.bind(navigator.clipboard);
  if (originalWriteText) {
   navigator.clipboard.writeText = async text => {
    await originalWriteText(text);
    window.__clipboardWrites.push({method:'writeText',text:String(text)});
   };
  }
  const originalExecCommand = document.execCommand.bind(document);
  document.execCommand = function(command, ...args) {
   const selected = command.toLowerCase() === 'copy'
    ? (document.activeElement?.value?.slice?.(document.activeElement.selectionStart, document.activeElement.selectionEnd) || String(window.getSelection() || ''))
    : '';
   const successful = originalExecCommand(command, ...args);
   if (command.toLowerCase() === 'copy' && successful) window.__clipboardWrites.push({method:'execCommand',text:selected});
   return successful;
  };
 });
 for(const test of cases){
  let status='PASS',reason='',route='',outputRoute='',promptLength=0,clipboard='NOT TESTED',guidedIntake='NOT TESTED',qualityGates=null,promptEvidence={};
  const pageErrors=[],httpErrors=[];
  const onError=e=>pageErrors.push(String(e));
  const onResponse=r=>{if(r.url().startsWith(base)&&r.status()>=400)httpErrors.push(r.status()+':'+r.url())};
  page.on('pageerror',onError);page.on('response',onResponse);
  try{
   const response=await page.goto(base,{waitUntil:'load',timeout:30000});
   assert.equal(response?.status(),200);
   await page.locator('#promptInput').waitFor({state:'visible',timeout:15000});
   await page.waitForFunction(()=>typeof window.GovPromptCore?.createGovernmentPrompt==='function');
   const result=await page.evaluate(question=>{
    const core=window.GovPromptCore;
    const routed=core.routeRequest(question);
    const bundle=core.createGovernmentPrompt({question,route:routed,context:core.createSharedContext({facts:question,desiredOutput:question})});
    return {route:routed,outputRoute:bundle.route,prompt:bundle.prompt,gates:bundle.qualityGates};
   },test.question);
   route=result.route?.primaryModule||result.route?.moduleId||'';
   if(route!=='GP007') console.log('ROUTE_DIAGNOSTIC',device.name,test.id,JSON.stringify({route,reason:result.route?.reason,modules:result.route?.modules,confidence:result.route?.confidence,output:result.outputRoute}));
   outputRoute=result.outputRoute?.moduleId||result.outputRoute?.primaryModule||'';
   qualityGates=result.gates;
   promptEvidence={hasEngineeringMarker:/gov\.engineering|Construction QA/i.test(result.prompt),hasHumanReview:/Human Review/i.test(result.prompt),hasDecisionLock:/Decision Lock/i.test(result.prompt),hasEvidenceText:/Evidence|หลักฐาน/i.test(result.prompt),hasPRWorkflow:/Primary Workflow[^\n]*gov\.pr\b/i.test(result.prompt)};
   assert.ok([route,result.outputRoute?.moduleId].includes('GP007'),'Not GP007');
   assert.match(result.prompt,/gov\.engineering|Construction QA/i);
   assert.match(result.prompt,/Human Review/i);
   assert.ok(result.prompt.includes(test.task), 'Task-specific deliverable missing');
   assert.match(result.prompt,/Decision Lock: ON/);
   assert.match(result.prompt,/Trusted Numeric: NO-GO/);
   assert.match(result.prompt,/Decision Lock/i);
   assert.equal(result.gates?.evidenceRequired,true);
   assert.equal(result.gates?.decisionRequired,true);
   assert.ok(!/Primary Workflow[^\n]*gov\.pr\b/i.test(result.prompt),'PR misroute');
   promptLength=result.prompt.length;
   await page.locator('#promptInput').fill(test.question);
   await page.locator('#chatForm button[type="submit"]').click();
   if(test.id==='diagnose-4') console.log('DIAGNOSE_SUBMIT_SNAPSHOT',device.name,JSON.stringify(await page.evaluate(()=>({input:document.querySelector('#promptInput')?.value,conversation:document.querySelector('#conversation')?.innerText,toast:document.querySelector('[role="alert"]')?.innerText,htmlClass:document.documentElement.className,formData:document.querySelector('#chatForm')?.dataset}))));
   const choice=page.locator('#conversation .guided-intake-message button').filter({hasText:/ยังไม่ทราบ|ทำต่อ|ช่วยตั้งต้น/}).first();
   if(await choice.isVisible().catch(()=>false)){
    await choice.click();
    guidedIntake='CHOICE HANDLED';
    // Guided Intake resubmits asynchronously and may request a second missing-field round.
    const followup=page.locator('#conversation .guided-intake-message button').filter({hasText:/ยังไม่ทราบ|ทำต่อ|ช่วยตั้งต้น/}).last();
    await page.waitForTimeout(100);
    if(await followup.isVisible().catch(()=>false) && await page.locator('#conversation .message.assistant:not(.guided-intake-message)').count()===0){
     await followup.click();
     guidedIntake='TWO CHOICES HANDLED';
    }
   }else guidedIntake='NO CHOICE SHOWN';
   try { await page.locator('#conversation .message.assistant').first().waitFor({state:'attached',timeout:25000}); }
   catch (error) {
    const snapshot=await page.locator('#conversation').evaluate(el=>({text:el.innerText.slice(-1800),buttons:[...el.querySelectorAll('button')].map(b=>({text:b.innerText,disabled:b.disabled})),html:el.innerHTML.slice(-3000)})).catch(e=>({error:String(e)}));
    console.log('ASSISTANT_TIMEOUT_DIAGNOSTIC',device.name,test.id,JSON.stringify(snapshot));
    throw error;
   }
   await page.locator('#thinkingMessage').waitFor({state:'detached',timeout:25000});
   assert.equal(pageErrors.length,0,'Page errors: '+pageErrors.join(';'));
   assert.equal(httpErrors.length,0,'HTTP errors: '+httpErrors.join(';'));
   const copyButtons=page.locator('#conversation .answer-actions button').filter({hasText:/คัดลอกคำสั่งอย่างเดียว|คัดลอกไปใช้กับ AI|คัดลอกคำสั่ง/i});
   if(await copyButtons.count()){
    await page.waitForFunction(() => document.querySelector('#conversation .answer-card')?.dataset.leanModeReady === 'true');
    const copyButtonLabel=await copyButtons.first().innerText();
    await copyButtons.filter({hasText:/คัดลอกคำสั่งอย่างเดียว|คัดลอกไปใช้กับ AI|คัดลอกคำสั่ง/i}).first().click();
    if(test.id==='boq-1') console.log('COPY_DIAGNOSTIC',device.name,JSON.stringify(await page.evaluate(()=>({writes:window.__clipboardWrites,toast:document.querySelector('[role="alert"]')?.innerText,copyLabels:[...document.querySelectorAll('button')].filter(b=>/คัดลอก|copy/i.test(b.innerText)).map(b=>b.innerText),promptPrivacy:window.GovPromptCore?.sanitizeExternalContent?.(window.GovPromptCore?.canonicalHandoffPrompts?.get(document.querySelector('.answer-card')) || '')?.sensitiveContext}))),copyButtonLabel);
    await page.waitForFunction(() => (window.__clipboardWrites || []).length > 0,{},{timeout:3000});
    const clipResult=await page.evaluate(() => ({writes:window.__clipboardWrites || []}));
    assert.ok(clipResult.writes.length>0,'Neither native writeText nor legacy execCommand copied successfully');
    const lastWrite=clipResult.writes.at(-1);
    const clip=lastWrite.text;
    assert.ok(clip.length>0,'Empty clipboard payload');
    assert.ok(clip.includes(test.task),'Copied prompt lost task-specific contract');
    assert.match(clip,/Decision Lock: ON/);
    assert.match(clip,/Human Review/);
    assert.ok(clip.includes(test.question) || result.prompt.includes(clip) || clip.includes(result.prompt.slice(0,80)),'Copied content does not match generated prompt or question');
    clipboard='PASS ('+lastWrite.method+' successful with verified payload)';
   }else {
    const snapshot=await page.locator('#conversation').evaluate(el=>({text:el.innerText.slice(-1500),buttons:[...el.querySelectorAll('button')].map(b=>b.innerText),html:el.innerHTML.slice(-1800)}));
    console.log('MISSING_COPY_CONTROL',device.name,test.id,JSON.stringify(snapshot));
    clipboard='NOT TESTED (copy control absent)';throw Error('Clipboard not tested: copy control absent');
   }
   if(test.id.endsWith('-normal'))await page.screenshot({path:`${out}/${device.name}-${test.id}.png`,fullPage:true});
  }catch(e){
   status='FAIL';reason=String(e?.stack||e);
   await page.screenshot({path:`${out}/FAIL-${device.name}-${test.id}.png`,fullPage:true}).catch(()=>{});
  }finally{
   page.off('pageerror',onError);page.off('response',onResponse);
   results.push({device:device.name,...test,status,reason,route,outputRoute,qualityGates,promptEvidence,promptLength,clipboard,guidedIntake});
   console.log(device.name,test.id,status,'route='+route,'output='+outputRoute,'prompt='+JSON.stringify(promptEvidence),'clipboard='+clipboard,reason.slice(0,180));
  }
 }
 await context.close();
}
}finally{await browser.close();}
const summary={total:results.length,pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length,clipboardUnverified:results.filter(x=>!x.clipboard.startsWith('PASS (')).length,results};
await writeFile(`${out}/results.json`,JSON.stringify(summary,null,2));
await writeFile(`${out}/results.md`,'# Engineering twelve-task acceptance\n\n'+JSON.stringify({total:summary.total,pass:summary.pass,fail:summary.fail,clipboardUnverified:summary.clipboardUnverified},null,2)+'\n');
assert.equal(summary.total,72);
assert.equal(summary.clipboardUnverified,0,'Clipboard verification incomplete');
assert.equal(summary.fail,0,'Engineering twelve-task acceptance failures');
