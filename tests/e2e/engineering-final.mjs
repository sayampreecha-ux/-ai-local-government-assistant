// Actual browser UI only. Source links are real; adverse scenarios are labelled test variations.
// This tests GovPrompt handoff, never claims downstream AI read PDFs or certified calculations.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
import {engineeringLabels as labels,actionLabels} from '../helpers/engineering-menu.mjs';
const root=resolve('dist');
const dir=resolve('artifacts/engineering-final');await mkdir(dir,{recursive:true});
const cases=JSON.parse(await readFile('tests/fixtures/engineering-final/cases.json','utf8'));
const source=JSON.parse(await readFile('tests/fixtures/engineering-final/source.json','utf8'));

const server=createServer(async(req,res)=>{
 const path=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const body=await readFile(path);res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.ENGINEERING_PRODUCTION==='1'?'https://sayampreecha-ux.github.io/-ai-local-government-assistant/':`http://127.0.0.1:${server.address().port}/`;
const scope=process.env.ENGINEERING_PRODUCTION==='1'?'production':'built-checkout';
const commit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
// A submitted intake answer may finalize asynchronously and remove the old button.
// Wait for the new response, never act on the still-visible previous intake card.
async function submitAndWait(page,text){
 const previous=await page.locator('.message.assistant').last().elementHandle();
 await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(text);
 await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
 await page.waitForFunction(previous=>{
  const last=[...document.querySelectorAll('.message.assistant')].at(-1);
  return last && last!==previous && !document.querySelector('#thinkingMessage') &&
   (last.matches('.guided-intake-message') || last.querySelector('.answer-section details pre'));
 },previous,{timeout:30000});
 await previous?.dispose();
}
const menuCases=[
 {id:'MENU_DRAWING',action:'drawing',menuOnly:true,scenario:'จัดทำแบบรูปรายการงานก่อสร้างจากข้อมูลที่มี ห้ามเดาขนาดหรือเหล็กเสริม',expect:['ผู้ประกอบวิชาชีพ','ข้อจำกัด']},
 {id:'MENU_REVIEW',action:'review',menuOnly:true,scenario:'ตรวจแบบ BOQ ปร.4 ปร.5 ราคากลาง Factor F และเงื่อนไขสัญญา',expect:['ผลกระทบ','UNVERIFIED']}
];
const results=[],menuResults=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  for(const c of [...cases,...menuCases]){
   const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile',serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});
   const page=await context.newPage();const record={id:c.id,device,scope,commit,status:'FAIL',downstreamAI:'NOT VERIFIED',source:source.source};
   try{
    await page.goto(base,{waitUntil:'networkidle'});
    const group=page.locator('[data-category-id="engineering"]');
    const buttons=group.locator('.work-catalog-task');
    await group.getByRole('button',{name:actionLabels.k,exact:true}).waitFor({state:'attached'});
    assert.deepEqual(await buttons.allTextContents(),labels);
    await group.getByRole('button',{name:'งานช่างและวิศวกรรม',exact:true}).click();
    assert.ok(await buttons.first().isVisible());
    await group.getByRole('button',{name:'งานช่างและวิศวกรรม',exact:true}).click();
    assert.equal(await buttons.first().isVisible(),false);
    await group.getByRole('button',{name:'งานช่างและวิศวกรรม',exact:true}).click();
    const menuButton=group.getByRole('button',{name:c.action==='tor'?actionLabels.drawing:actionLabels[c.action],exact:true});
    if(c.action==='tor'||c.action==='drawing'){
     await menuButton.click();
     const choice=page.getByRole('dialog').getByRole('button',{name:c.action==='tor'?actionLabels.tor:'จัดทำแบบรูปรายการ',exact:true});
     record.seed=await choice.getAttribute('data-prompt');await choice.click();
    }else{record.seed=await menuButton.getAttribute('data-prompt');await menuButton.click();}
    const summary=page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true});
    const skip=page.locator('.guided-intake-message .answer-actions button').last();
    await summary.or(skip).first().waitFor({state:'visible',timeout:30000});
    if(await skip.isVisible()){
     const answer=`โครงการ ${source.project} จังหวัดเชียงใหม่ วงเงินยังไม่ยืนยัน ต้องการ ${actionLabels[c.action]} ${c.scenario} แหล่งโครงการจริง ${source.source} เอกสาร ${Object.values(source.documents).join(' ')} ยังไม่ได้แนบไฟล์ใน GovPrompt ให้ AI ปลายทางอ่านต้นฉบับก่อนวิเคราะห์`;
     await submitAndWait(page,answer);
     await summary.or(skip).first().waitFor({state:'visible',timeout:30000});
     if(await skip.isVisible())await skip.click();
    }else{
     // Menu can already render a handoff. Submit the same selected seed plus case through public UI.
     await submitAndWait(page,`${record.seed} ${c.scenario} โครงการ ${source.project} จังหวัดเชียงใหม่ วงเงินไม่ทราบ ${source.source}`);
    }
    await summary.last().click({timeout:30000});
    const pre=page.locator('.answer-card .answer-section details pre').last();
    record.prompt=await pre.textContent();
    assert.ok(record.prompt.includes(c.scenario),'test scenario preserved');
    assert.ok(record.prompt.includes(record.seed),'selected menu seed preserved');
    for(const text of c.expect)assert.ok(record.prompt.includes(text),text);
    if(['boq','tor','price'].includes(c.action))for(const text of ['VERIFIED','PENDING','BLOCKED','Partial Decision Lock','Human Review'])assert.ok(record.prompt.includes(text),text);
    // Read-only diagnostic: preserve the exact submitted prompt and the runtime routing decisions.
    record.route=await page.locator('.route-label').last().innerText();
    record.submittedQuestion=await page.locator('.message.user .message-body').last().textContent();
    record.routingDiagnostic=await page.evaluate(question=>{
      const core=window.GovPromptCore;
      const ctx=core.createSharedContext({facts:question,desiredOutput:question});
      const direct=core.routeRequest(question);
      const transaction=core.routeTransaction(ctx);
      const summarize=route=>({
        primaryModule:route.primaryModule||route.moduleId,
        reason:route.reason,
        domainOverride:route.domainOverride,
        actionIntent:route.actionIntent,
        ranking:(route.ranking||[]).filter(x=>['GP003','GP007','GP012'].includes(x.moduleId)).map(x=>({
          moduleId:x.moduleId,rawScore:x.rawScore,matchedIntents:x.matchedIntents
        }))
      });
      return {question,routeRequest:summarize(direct),routeTransaction:summarize(transaction),
        output:core.routeOutput(question,{moduleId:transaction.moduleId},ctx)};
    },record.submittedQuestion);
    if(device==='desktop'&&c.id==='BOQ01'){
      record.negativePrDiagnostics=await page.evaluate(()=>{
        const core=window.GovPromptCore;
        return ['ทำข่าวประชาสัมพันธ์กิจกรรมของ อบจ.','เขียนโพสต์เฟซบุ๊กประชาสัมพันธ์โครงการ','สร้างอินโฟกราฟิกประชาสัมพันธ์'].map(question=>{
          const r=core.routeRequest(question);
          const t=core.routeTransaction(core.createSharedContext({facts:question,desiredOutput:question}));
          return {question,transactionModule:t.moduleId,primaryModule:r.primaryModule,domainOverride:r.domainOverride,actionIntent:r.actionIntent,
            ranking:r.ranking.filter(x=>['GP007','GP012'].includes(x.moduleId)).map(x=>({moduleId:x.moduleId,rawScore:x.rawScore,matchedIntents:x.matchedIntents}))};
        });
      });
      for(const r of record.negativePrDiagnostics){assert.equal(r.primaryModule,'GP012');assert.equal(r.transactionModule,'GP012');}
    }
    assert.ok(['GP003','GP007'].includes(record.routingDiagnostic.routeTransaction.primaryModule),'actual submitted transaction route');
    assert.match(record.route,/ช่าง|วิศวกรรม|พัสดุ|จัดซื้อ/,'engineering or procurement route');
    record.layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    assert.ok(record.layout.scrollWidth<=viewport.width+2,'no horizontal overflow');
    record.status='PASS';
   }catch(e){record.error=String(e.stack||e);}
   await page.screenshot({path:resolve(dir,`${device}-${c.id}.png`),fullPage:true}).catch(()=>{});
   await writeFile(resolve(dir,`${device}-${c.id}.json`),JSON.stringify(record,null,2));(c.menuOnly?menuResults:results).push(record);console.log(c.id,device,record.status,record.error?.split('\n')[0]||'');await context.close();
  }
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile(resolve(dir,'results.json'),JSON.stringify({scope,source,results,menuResults,downstreamAI:'NOT VERIFIED'},null,2));}
assert.equal(results.length,36);assert.equal(results.filter(r=>r.status!=='PASS').length,0);

assert.equal(menuResults.length,4);assert.equal(menuResults.filter(r=>r.status!=='PASS').length,0);
