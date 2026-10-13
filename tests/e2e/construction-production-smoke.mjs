import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const url = 'https://sayampreecha-ux.github.io/-ai-local-government-assistant/';
const out = 'artifacts/construction-production-ui';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
  for (const device of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]) {
    const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'th-TH'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    let status='PASS', reason='';
    try {
      const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForTimeout(1200);
      const code=response?.status()||0;
      if(code!==200) throw Error('HTTP '+code);
      const title=await page.title();
      const inputs=await page.locator('textarea,input:not([type="hidden"]),[contenteditable="true"]').count();
      const buttons=await page.locator('button').count();
      const bodyText=(await page.locator('body').innerText()).slice(0,800);
      await page.screenshot({path:`${out}/${device.name}.png`,fullPage:true});
      if(!bodyText.trim()) throw Error('empty page body');
      results.push({device:device.name,status,code,title,inputs,buttons,pageErrors:errors,bodyExcerpt:bodyText,scope:'production-page-load-and-render-only',questionSubmission:'NOT TESTED',engineeringEvidence:'NOT VERIFIED'});
    } catch(e) {
      status='FAIL';reason=String(e);
      results.push({device:device.name,status,reason,pageErrors:errors,scope:'production-page-load-and-render-only'});
    }
    console.log(device.name,status,reason);
    await context.close();
  }
} finally {await browser.close();}
await writeFile(`${out}/results.json`,JSON.stringify({url,results},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
