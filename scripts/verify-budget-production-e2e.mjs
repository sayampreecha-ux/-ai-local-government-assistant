import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const RELEASE_HOME_VERSION = '6.1.1';
const browser = await chromium.launch({ headless:true });
const context = await browser.newContext({ serviceWorkers:'allow', viewport:{width:390,height:844}, isMobile:true, hasTouch:true });
const page = await context.newPage();
const requests = [];
const responses = [];
const pageErrors = [];
page.on('request',request=>{ const url=request.url(); if (/\/api\/official-(?:search|document)/.test(url)) requests.push({url,method:request.method()}); });
page.on('response',response=>{ const url=response.url(); if (/\/api\/official-(?:search|document)/.test(url)) responses.push({url,status:response.status()}); });
page.on('pageerror',error=>pageErrors.push(String(error?.stack||error?.message||error)));
page.on('dialog',async dialog=>{ await dialog.dismiss(); });

const url = new URL(frontend);
url.searchParams.set('budget-e2e','2570');
url.searchParams.set('nonce',`${Date.now()}-${Math.random().toString(16).slice(2)}`);
await page.goto(url.toString(),{waitUntil:'domcontentloaded',timeout:30_000});
await page.waitForFunction(()=>document.readyState==='complete' && document.getElementById('chatForm')?.dataset?.privacySubmitGuard==='3' && typeof window.GovPromptCore?.officialSearchConnector?.search==='function',undefined,{timeout:20_000});

// Keep production verification organization-neutral: never inject a real organization/place name into the visible chat surface.
const prompt='จัดทำงบประมาณปี 2570';
await page.locator('#promptInput').fill(prompt);
await page.locator('#chatForm .send-button').click();
await page.locator('.budget-runtime-result').waitFor({state:'visible',timeout:120_000});
await page.waitForTimeout(1000);

const state=await page.evaluate(()=>({
  userMessages:[...document.querySelectorAll('.message.user .message-body')].map(node=>node.textContent||''),
  routeLabel:document.querySelector('.message.assistant .route-label')?.textContent||'',
  budgetText:document.querySelector('.budget-runtime-result')?.innerText||'',
  assistantText:[...document.querySelectorAll('.message.assistant')].map(node=>node.innerText||'').join('\n'),
  excelButton:[...document.querySelectorAll('button')].some(button=>button.textContent?.includes('ดาวน์โหลด Excel')),
  wordButton:[...document.querySelectorAll('button')].some(button=>button.textContent?.includes('ดาวน์โหลด Word')),
  submitGuardVersion:document.getElementById('chatForm')?.dataset?.privacySubmitGuard||'',
  homeScript:[...document.scripts].map(script=>script.src).find(src=>/home-v3\.js/.test(src))||''
}));

assert.equal(state.submitGuardVersion,'3','privacy submit guard must remain active');
assert.ok(state.userMessages.includes(prompt),'budget command did not create expected safe user message');
assert.doesNotMatch(state.userMessages.join('\n'),/อบจ\.พะเยา/,'production E2E must not inject a real organization/place name');
assert.match(state.routeLabel,/แผน โครงการ และงบประมาณ/,'short budget command routed to wrong government domain');
assert.match(state.budgetText,/Budget Draft Agent/,'Budget Draft Agent result surface missing');
assert.match(state.assistantText,/Workflow:\s*บริบทและกรอบการจัดทำงบประมาณ|Budget Draft Agent/,'governed budget workflow markers missing');
assert.match(state.homeScript,new RegExp(`home-v3\\.js\\?v=${RELEASE_HOME_VERSION.replaceAll('.','\\.')}`),'production home asset is stale');
assert.equal(pageErrors.length,0,`page errors: ${JSON.stringify(pageErrors)}`);
assert.ok(requests.some(item=>/\/api\/official-search/.test(item.url)),'budget workflow did not call official search Worker');
assert.ok(responses.some(item=>/\/api\/official-search/.test(item.url)),'official search Worker returned no response');

for (const item of requests.filter(item=>/\/api\/official-document/.test(item.url))) {
  assert.match(item.url,/ai-local-government-assistant\.sayampreecha\.workers\.dev\/api\/official-document/,'document read used a non-production endpoint');
}

if (/Working Draft พร้อมส่งออก/.test(state.budgetText)) {
  assert.equal(state.excelButton,true,'ready budget artifact missing Excel download');
  assert.equal(state.wordButton,true,'ready budget artifact missing Word download');
} else {
  assert.match(state.budgetText,/ยังไม่พร้อมส่งออก|ต้องยืนยัน|สถานะ/,'blocked budget state did not explain its evidence gate');
  assert.doesNotMatch(state.budgetText,/Working Draft พร้อมส่งออก/,'blocked budget state must not claim export readiness');
}

console.log(JSON.stringify({frontend,releaseHomeVersion:RELEASE_HOME_VERSION,checks:{genericBudgetCommand:'PASS',budgetDomainRouting:'PASS',privacyGuard:'PASS',budgetSurface:'PASS',governedWorkflowMarkers:'PASS',releaseCacheBust:'PASS',officialSearchWorker:'PASS',documentWorkerRouting:'PASS',officeExportOrFailClosed:'PASS'},requests,responses,pageErrors},null,2));
await browser.close();
