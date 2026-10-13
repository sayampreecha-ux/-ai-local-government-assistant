import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const fixtures = JSON.parse(await readFile('tests/fixtures/construction-qa/acceptance-cases.json', 'utf8'));
const modules = ['shared-context','prompt-registry','transaction-router','output-router','prompt-orchestrator'];
const browser = await chromium.launch({headless:true});
const results = [];
let failed = 0;
await mkdir('artifacts/construction-browser-e2e', {recursive:true});
try {
  for (const device of [{name:'desktop',viewport:{width:1440,height:900}}, {name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]) {
    const context = await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'th-TH'});
    const page = await context.newPage();
    await page.goto('about:blank');
    for (const module of modules) await page.addScriptTag({content:await readFile('assets/js/core/'+module+'.js','utf8')});
    for (const fixture of fixtures) {
      let status='PASS', error='';
      try {
        const actual = await page.evaluate(question => {
          const core=window.GovPromptCore;
          const result=core.createGovernmentPrompt({question,context:core.createSharedContext({facts:question,desiredOutput:question})});
          return {prompt:result.prompt,plan:result.taskPlan,gates:result.qualityGates};
        }, fixture.question);
        assert.ok(actual.prompt.includes(fixture.question),'question must be preserved');
        if (fixture.id.startsWith('TC')) {
          assert.equal(actual.plan.constructionReview,true);
          assert.equal(actual.plan.action,'verify');
          assert.ok(actual.plan.disciplines.includes('engineering'));
          assert.ok(actual.plan.disciplines.includes('procurement'));
          assert.equal(actual.gates.evidenceRequired,true);
          assert.equal(actual.gates.decisionRequired,true);
          assert.equal(actual.gates.legalVersionRequired,true);
          for (const phrase of ['Partial Decision Lock: ON','Human Review','Audit Trace','ห้ามอ้างว่าถอดแบบหรือตรวจหลักฐานแล้ว']) assert.ok(actual.prompt.includes(phrase),phrase);
        } else {
          assert.equal(actual.plan.constructionReview,undefined);
          assert.ok(!actual.prompt.includes('Construction QA —'));
        }
      } catch(e) {status='FAIL';error=String(e?.stack||e);failed++;}
      results.push({id:fixture.id,device:device.name,status,error,scope:'real-chromium-prompt-runtime',downstreamAnswer:'NOT TESTED',officialEngineeringEvidence:'NOT VERIFIED'});
      console.log(device.name,fixture.id,status,error.split('\n')[0]);
    }
    await context.close();
  }
} finally {await browser.close();}
await writeFile('artifacts/construction-browser-e2e/results.json',JSON.stringify({head:process.env.GITHUB_SHA||null,results},null,2));
console.log('Construction browser E2E:',results.filter(x=>x.status==='PASS').length+'/'+results.length);
if(failed) process.exitCode=1;
