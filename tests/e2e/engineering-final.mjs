// Actual browser UI only. Source links are real; adverse scenarios are labelled test variations.
// This tests GovPrompt handoff, never claims downstream AI read PDFs or certified calculations.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('dist');
const dir=resolve('artifacts/engineering-final');await mkdir(dir,{recursive:true});
const cases=JSON.parse(await readFile('tests/fixtures/engineering-final/cases.json','utf8'));
const source=JSON.parse(await readFile('tests/fixtures/engineering-final/source.json','utf8'));
const labels=['ถอดแบบและจัดทำ BOQ','แบบรูปรายการ / TOR งานก่อสร้าง','จัดทำราคากลางงานก่อสร้าง','ตรวจแบบ / ตรวจงาน / ตรวจรับ','วิเคราะห์ปัญหาถนน / อาคาร / โครงสร้าง','🔍 ตรวจสอบค่า K'];
const server=createServer(async(req,res)=>{
 const path=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));
 if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{const body=await readFile(path);res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.ENGINEERING_PRODUCTION==='1'?'https://sayampreecha-ux.github.io/-ai-local-government-assistant/':`http://127.0.0.1:${server.address().port}/`;
const scope=process.env.ENGINEERING_PRODUCTION==='1'?'production':'built-checkout';
const results=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const [device,viewport] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
  for(const c of cases){
   const context=await browser.newContext({viewport,isMobile:device==='mobile',hasTouch:device==='mobile',serviceWorkers:'block',permissions:['clipboard-read','clipboard-write']});
   const page=await context.newPage();const record={id:c.id,device,scope,status:'FAIL',downstreamAI:'NOT VERIFIED',source:source.source};
   try{
    await page.goto(base,{waitUntil:'networkidle'});
    const group=page.locator('[data-category-id="engineering"]');
    const buttons=group.locator('.work-catalog-task');
    await buttons.nth(5).waitFor({state:'attached'});
    assert.deepEqual(await buttons.allTextContents(),labels);
    await group.getByRole('button',{name:'งานช่างและวิศวกรรม',exact:true}).click();
    assert.ok(await buttons.first().isVisible());
    await group.getByRole('button',{name:'งานช่างและวิศวกรรม',exact:true}).click();
    assert.equal(await buttons.first().isVisible(),false);
    await group.getByRole('button',{name:'งานช่างและวิศวกรรม',exact:true}).click();
    record.seed=await buttons.nth(c.button).getAttribute('data-prompt');
    await buttons.nth(c.button).click();
    const summary=page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true});
    const skip=page.getByRole('button',{name:'ยังไม่ทราบบางข้อ — ทำต่อ',exact:true});
    await summary.or(skip).first().waitFor({state:'visible',timeout:30000});
    if(await skip.isVisible()){
     const answer=`โครงการ ${source.project} จังหวัดเชียงใหม่ วงเงินยังไม่ยืนยัน ต้องการ ${labels[c.button]} ${c.scenario} แหล่งโครงการจริง ${source.source} เอกสาร ${Object.values(source.documents).join(' ')} ยังไม่ได้แนบไฟล์ใน GovPrompt ให้ AI ปลายทางอ่านต้นฉบับก่อนวิเคราะห์`;
     await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(answer);
     await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
     await summary.or(skip).first().waitFor({state:'visible',timeout:30000});
     if(await skip.isVisible())await skip.click();
    }else{
     // Menu can already render a handoff. Submit the same selected seed plus case through public UI.
     await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(`${record.seed} ${c.scenario} โครงการ ${source.project} จังหวัดเชียงใหม่ วงเงินไม่ทราบ ${source.source}`);
     await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
    }
    await summary.last().click({timeout:30000});
    const pre=page.locator('.answer-card .answer-section details pre').last();
    record.prompt=await pre.textContent();
    assert.ok(record.prompt.includes(c.scenario),'test scenario preserved');
    assert.ok(record.prompt.includes(record.seed),'selected menu seed preserved');
    for(const text of c.expect)assert.ok(record.prompt.includes(text),text);
    if(c.button<3)for(const text of ['VERIFIED','PENDING','BLOCKED','Partial Decision Lock','Human Review'])assert.ok(record.prompt.includes(text),text);
    record.route=await page.locator('.route-label').last().innerText();
    assert.match(record.route,/ช่าง|วิศวกรรม|พัสดุ|จัดซื้อ/,'engineering or procurement route');
    record.layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    assert.ok(record.layout.scrollWidth<=viewport.width+2,'no horizontal overflow');
    record.status='PASS';
   }catch(e){record.error=String(e.stack||e);}
   await page.screenshot({path:resolve(dir,`${device}-${c.id}.png`),fullPage:true}).catch(()=>{});
   await writeFile(resolve(dir,`${device}-${c.id}.json`),JSON.stringify(record,null,2));results.push(record);console.log(c.id,device,record.status,record.error?.split('\n')[0]||'');await context.close();
  }
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile(resolve(dir,'results.json'),JSON.stringify({scope,source,results,downstreamAI:'NOT VERIFIED'},null,2));}
assert.equal(results.length,36);assert.equal(results.filter(r=>r.status!=='PASS').length,0);
