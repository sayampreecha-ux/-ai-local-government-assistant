import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';

const fixtures=JSON.parse(await readFile('tests/fixtures/construction-qa/acceptance-cases.json','utf8'));
const base='https://sayampreecha-ux.github.io/-ai-local-government-assistant/';
const output='artifacts/construction-production-submit';
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for(const device of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]) {
    const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'th-TH'});
    const page=await context.newPage();
    for(const fixture of fixtures) {
      let status='PASS',reason='';
      try {
        const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:45000});
        if(response?.status()!==200)throw Error('production HTTP '+response?.status());
        await page.locator('#promptInput').waitFor({state:'visible',timeout:15000});
        await page.waitForFunction(() => document.readyState === 'complete' && typeof window.GovPromptCore?.prepareGP223IntakeTurn === 'function' && typeof window.GovPromptCore?.createGovernmentPrompt === 'function', null, {timeout:20000});
        await page.locator('#promptInput').fill(fixture.question);
        await page.locator('#chatForm button[type="submit"]').click();
        await page.locator('#conversation .message.user').first().waitFor({state:'visible',timeout:20000});
        await page.locator('#thinkingMessage').waitFor({state:'detached',timeout:20000});
        const visible=await page.locator('#conversation').innerText();
        const userText=await page.locator('#conversation .message.user').first().innerText();
        if(!userText.includes(fixture.question.slice(0,12)))throw Error('question not preserved in user message');
        if(!(await page.locator('#conversation .message.assistant').count()))throw Error('assistant output missing');
        if(visible.length<30)throw Error('insufficient visible conversation output');
        if(fixture.id==='TC01'||fixture.id==='TC09'||fixture.id==='TC12') await page.screenshot({path:`${output}/${device.name}-${fixture.id}.png`,fullPage:true});
        results.push({id:fixture.id,device:device.name,status,visibleExcerpt:visible.slice(0,500),scope:'production-ui-submit',engineeringEvidence:'NOT VERIFIED'});
      }catch(e){
        status='FAIL';reason=String(e);
        try {await page.screenshot({path:`${output}/${device.name}-${fixture.id}-FAIL.png`,fullPage:true});}catch{}
        results.push({id:fixture.id,device:device.name,status,reason,scope:'production-ui-submit'});
      }
      console.log(device.name,fixture.id,status,reason);
    }
    await context.close();
  }
}finally{await browser.close();}
await writeFile(`${output}/results.json`,JSON.stringify({url:base,results},null,2));
console.log('Production UI submit',results.filter(x=>x.status==='PASS').length,'/',results.length);
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
