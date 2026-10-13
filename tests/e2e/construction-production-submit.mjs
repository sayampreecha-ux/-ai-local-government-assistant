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
        await page.locator('#promptInput').fill(fixture.question);
        await page.locator('#chatForm button[type="submit"]').click();
        await page.waitForFunction(()=>document.querySelector('#conversation')?.innerText.trim().length>20,{timeout:20000}).catch(()=>{});
        await page.waitForTimeout(700);
        const visible=await page.locator('#conversation').innerText();
        if(visible.length<20)throw Error('no visible conversation output after submit');
        if(!visible.includes(fixture.question.slice(0,12)))throw Error('question not visible in conversation');
        if(fixture.id==='TC01'||fixture.id==='TC09'||fixture.id==='TC12') await page.screenshot({path:`${output}/${device.name}-${fixture.id}.png`,fullPage:true});
        results.push({id:fixture.id,device:device.name,status,visibleExcerpt:visible.slice(0,500),scope:'production-ui-submit',engineeringEvidence:'NOT VERIFIED'});
      }catch(e){
        status='FAIL';reason=String(e);
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
