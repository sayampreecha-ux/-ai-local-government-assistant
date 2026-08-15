import { chromium } from 'playwright';

const frontend='https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({serviceWorkers:'allow',viewport:{width:390,height:844},isMobile:true,hasTouch:true});
const page=await context.newPage();
const requests=[]; const responses=[]; const errors=[]; const consoles=[];
page.on('request',r=>{if(/official-(?:search|document)/.test(r.url()))requests.push({url:r.url(),method:r.method()});});
page.on('response',r=>{if(/official-(?:search|document)/.test(r.url()))responses.push({url:r.url(),status:r.status()});});
page.on('pageerror',e=>errors.push(String(e?.stack||e)));
page.on('console',m=>consoles.push(`${m.type()}: ${m.text()}`));
page.on('dialog',async d=>d.dismiss());
await page.goto(`${frontend}?diag=${Date.now()}`,{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset?.privacySubmitGuard==='3',{timeout:20000});
const direct=await page.evaluate(async()=>{
  try{
    const m=await import('./assets/js/core/government-workflow-runtime-v5.js?v=5.1.0');
    const v=m.buildWorkflowRuntimeView({query:'ทำร่างงบปี 70 อบจ.พะเยา'});
    return {ok:true,workflowIds:v.workflowIds,primary:v.primary?.workflowId,stage:v.primary?.currentStage?.id,status:v.status};
  }catch(e){return {ok:false,error:String(e?.stack||e)};}
});
await page.locator('#promptInput').fill('ทำร่างงบปี 70 อบจ.พะเยา');
await page.locator('#chatForm .send-button').click();
await page.waitForTimeout(30000);
const state=await page.evaluate(()=>({
  user:[...document.querySelectorAll('.message.user')].map(x=>x.innerText),
  assistant:[...document.querySelectorAll('.message.assistant')].map(x=>x.innerText),
  thinking:document.querySelector('#thinkingMessage')?.innerText||'',
  budget:document.querySelector('.budget-runtime-result')?.innerText||'',
  prompt:document.querySelector('#promptInput')?.value||'',
  toasts:[...document.querySelectorAll('.toast,.govprompt-toast,[role=status]')].map(x=>x.innerText).filter(Boolean)
}));
console.log(JSON.stringify({direct,requests,responses,errors,consoles:consoles.slice(-30),state},null,2));
await browser.close();
