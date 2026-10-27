import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const origin=process.env.TORT_BASE_URL || 'http://127.0.0.1:8765/';
const cases=[
 {name:'mobile',width:390,height:844},
 {name:'desktop',width:1366,height:768}
];
mkdirSync('artifacts/tort-browser',{recursive:true});
const browser=await chromium.launch({headless:true});
let failed=0;
for(const size of cases){
 const context=await browser.newContext({viewport:{width:size.width,height:size.height},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try {
   await page.goto(origin,{waitUntil:'domcontentloaded',timeout:30000});
   await page.locator('#promptInput').fill('สอบละเมิดเจ้าหน้าที่ กรณีรถราชการชนคู่กรณี ใช้ข้อมูลจำลอง ขอรายการหลักฐานและร่างเอกสาร');
   await page.locator('#chatForm button[type=submit]').click();
   await page.getByText('[GP_TORT_LEVEL1_HANDOFF_V1]',{exact:false}).first().waitFor({timeout:20000});
   const body=await page.locator('#conversation').innerText();
   for(const expected of ['GP_TORT_LEVEL1_HANDOFF_V1','ว66/ว141','NOT VERIFIED','ร่างเอกสาร 7 ส่วน']){
     if(!body.includes(expected))throw Error('Missing browser output: '+expected);
   }
   if(errors.length)throw Error('Browser console: '+errors.join(' | '));
   console.log('PASS browser tort',size.name);
 }catch(err){failed++;console.error('FAIL browser tort',size.name,err.message)}
 await page.screenshot({path:'artifacts/tort-browser/'+size.name+'.png',fullPage:true});
 await context.close();
}
await browser.close();
if(failed)process.exitCode=1;
