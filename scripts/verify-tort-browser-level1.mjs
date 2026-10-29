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
   const retrievalQuestion='รถราชการชนท้ายรถคู่กรณีระหว่างเดินทางไปปฏิบัติราชการ ขอขั้นตอนสอบละเมิด การซ่อมรถ และการตรวจสอบอำนาจแต่งตั้งกรรมการ';
   const retrieval = await page.evaluate(question => {
     const core=window.GovPromptCore;
     const route={moduleId:'GP002',reason:'explicit-legal-tort-quick-action'};
     const plan=core.createOfficialSearchPlan(question,{module:route.moduleId});
     const output=core.routeOutput(question,route,{facts:question});
     return {plan,output:{id:output.id,format:output.format,instructions:output.instructions},policy:core.OFFICIAL_SEARCH_USER_AI_ONLY};
   },retrievalQuestion);
   if(retrieval.plan.originalQuery!==retrievalQuestion || !retrieval.plan.query.includes(retrievalQuestion))throw Error('Retrieval query truncated or lost reported collision facts');
   if(retrieval.plan.routedModules[0]!=='GP002' || retrieval.plan.query.includes('จัดซื้อจัดจ้าง พัสดุภาครัฐ'))throw Error('Tort retrieval routed to procurement');
   if(retrieval.output.id!=='tort-level1-document' || !retrieval.output.instructions.some(t=>t.includes('7 ส่วน')))throw Error('Tort output not seven-part document');
   if(retrieval.policy!==true)throw Error('Retrieval policy must delegate live lookup to selected user AI');
   console.log('PASS browser retrieval and seven-part output',size.name);
   await page.locator('#promptInput').fill('สอบละเมิดเจ้าหน้าที่ กรณีรถราชการชนคู่กรณี ใช้ข้อมูลจำลอง ขอรายการหลักฐานและร่างเอกสาร');
   await page.locator('#chatForm button[type=submit]').click();
   await page.locator('#conversation .message.assistant details pre').first().waitFor({state:'attached',timeout:20000});
   const body=await page.locator('#conversation .message.assistant details pre').first().textContent();
   for(const expected of ['GP_TORT_LEVEL1_HANDOFF_V1','ว66/ว141','NOT VERIFIED','ร่างเอกสาร 7 ส่วน']){
     if(!body.includes(expected))throw Error('Missing browser output: '+expected);
   }
   await page.getByRole('button',{name:'คัดลอกไปใช้กับ AI'}).first().click();
   const clip=await page.evaluate(()=>navigator.clipboard.readText());
   for(const required of ['GP_TORT_LEVEL1_HANDOFF_V1','ว66/ว141','NOT VERIFIED']){
     if(!clip.includes(required))throw Error('Clipboard missing: '+required);
   }
   if(errors.length)throw Error('Browser console: '+errors.join(' | '));
   console.log('PASS browser tort',size.name);
 }catch(err){failed++;console.error('FAIL browser tort',size.name,err.message)}
 await page.screenshot({path:'artifacts/tort-browser/'+size.name+'.png',fullPage:true});
 await context.close();
}
await browser.close();
if(failed)process.exitCode=1;
