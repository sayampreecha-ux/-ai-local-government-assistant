import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const frontend = process.env.GOVPROMPT_FRONTEND_URL || 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/index.html';
const RELEASE_HOME_VERSION = '6.4.1';
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
// The short generic budget command is intentionally handled by Guided Intake first. The public UI includes a deterministic
// “ยังไม่ทราบ...ทำต่อ” path that finalizes the pending intake, preserves missing fields as explicit unknowns, and lets the governed
// budget runtime proceed fail-closed rather than inventing facts. Exercise that exact production path here.
const prompt='จัดทำร่างงบประมาณ';
await page.locator('#promptInput').fill(prompt);
await page.locator('#chatForm .send-button').click();
const intakeCard=page.locator('.guided-intake-message').last();
await intakeCard.waitFor({state:'visible',timeout:10_000});
const continueUnknown=intakeCard.getByRole('button',{name:'ยังไม่ทราบบางข้อ — ทำต่อ',exact:true});
await continueUnknown.waitFor({state:'visible',timeout:5_000});
await continueUnknown.click();
await page.locator('.budget-runtime-result').waitFor({state:'visible',timeout:120_000});
await page.waitForTimeout(1000);

const state=await page.evaluate(()=>({
  guidedIntakeVisible:Boolean(document.querySelector('.guided-intake-message')),
  userMessages:[...document.querySelectorAll('.message.user .message-body')].map(node=>node.textContent||''),
  routeLabel:[...document.querySelectorAll('.message.assistant .route-label')].map(node=>node.textContent||'').find(text=>/แผน โครงการ และงบประมาณ/.test(text))||'',
  budgetText:document.querySelector('.budget-runtime-result')?.innerText||'',
  assistantText:[...document.querySelectorAll('.message.assistant')].map(node=>node.innerText||'').join('\n'),
  excelButton:[...document.querySelectorAll('button')].some(button=>button.textContent?.includes('ดาวน์โหลด Excel')),
  wordButton:[...document.querySelectorAll('button')].some(button=>button.textContent?.includes('ดาวน์โหลด Word')),
  submitGuardVersion:document.getElementById('chatForm')?.dataset?.privacySubmitGuard||'',
  homeScript:[...document.scripts].map(script=>script.src).find(src=>/home-v3\.js/.test(src))||''
}));

assert.equal(state.submitGuardVersion,'3','privacy submit guard must remain active');
assert.equal(state.guidedIntakeVisible,true,'generic budget command must pass through Guided Intake before runtime execution');
assert.ok(state.userMessages.some(message=>message.includes(prompt)),'guided intake continue path did not create expected safe user message');
assert.ok(state.userMessages.some(message=>/ข้อมูลที่ผู้ใช้ยังไม่ทราบ|yearOrg|sourceData|purpose/.test(message)),'guided intake continue path did not preserve missing budget fields as explicit unknowns');
assert.doesNotMatch(state.userMessages.join('\n'),/อบจ\.พะเยา/,'production E2E must not inject a real organization/place name');
assert.match(state.routeLabel,/แผน โครงการ และงบประมาณ/,'completed short budget intake routed to wrong government domain');
assert.match(state.budgetText,/ผู้ช่วยจัดทำร่างงบประมาณ/,'humanized Budget Draft Agent result surface missing');
assert.doesNotMatch(state.budgetText,/currentBudgetRule|baselineBudgetSource|latestRevenueActualsSource|targetYearPlanSource|baselineBudget|latestRevenueActuals/,'technical budget evidence keys leaked into user-facing production copy');
assert.match(state.assistantText,/Workflow:\s*บริบทและกรอบการจัดทำงบประมาณ|ผู้ช่วยจัดทำร่างงบประมาณ/,'governed budget workflow markers missing');
assert.match(state.homeScript,new RegExp(`home-v3\\.js\\?v=${RELEASE_HOME_VERSION.replaceAll('.','\\.')}`),'production home asset is stale');
assert.equal(pageErrors.length,0,`page errors: ${JSON.stringify(pageErrors)}`);
assert.equal(requests.some(item=>/\/api\/official-search/.test(item.url)),false,'budget workflow must not call GovPrompt official search automatically');
assert.equal(responses.some(item=>/\/api\/official-search/.test(item.url)),false,'budget workflow unexpectedly received GovPrompt official-search response');
assert.match(state.assistantText,/ให้ AI ของผู้ใช้ค้นเว็บสด|พร้อมส่งต่อ/,'budget workflow missing delegated user-AI live-search handoff');

for (const item of requests.filter(item=>/\/api\/official-document/.test(item.url))) {
  assert.match(item.url,/ai-local-government-assistant\.sayampreecha\.workers\.dev\/api\/official-document/,'document read used a non-production endpoint');
}

if (/ร่างทำงาน พร้อมส่งออก/.test(state.budgetText)) {
  assert.equal(state.excelButton,true,'ready budget artifact missing Excel download');
  assert.equal(state.wordButton,true,'ready budget artifact missing Word download');
} else {
  assert.match(state.budgetText,/ยังไม่พร้อมส่งออก|ต้องยืนยัน|สถานะ/,'blocked budget state did not explain its evidence gate');
  assert.doesNotMatch(state.budgetText,/ร่างทำงาน พร้อมส่งออก/,'blocked budget state must not claim export readiness');
}

console.log(JSON.stringify({frontend,releaseHomeVersion:RELEASE_HOME_VERSION,checks:{genericBudgetGuidedIntake:'PASS',guidedIntakeUnknownContinue:'PASS',budgetDomainRouting:'PASS',privacyGuard:'PASS',budgetSurface:'PASS',humanizedBudgetCopy:'PASS',governedWorkflowMarkers:'PASS',releaseCacheBust:'PASS',userAiSearchDelegation:'PASS',documentWorkerRouting:'PASS',officeExportOrFailClosed:'PASS'},requests,responses,pageErrors},null,2));
await browser.close();
