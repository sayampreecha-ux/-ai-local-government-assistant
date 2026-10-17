// GP001 PR-head browser acceptance. Serves the checked-out dist; never deploys.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
const root=resolve('dist'), out=resolve('artifacts/gp001-browser-e2e');
await mkdir(out,{recursive:true});
const cases=[
 {id:'GP001-E01',question:'ร่างหนังสือราชการภายนอกขอความอนุเคราะห์ข้อมูลจากสำนักงานจังหวัดพะเยา'},
 {id:'GP001-E02',question:'ร่างหนังสือชี้แจง ป.ป.ช. กรณีมีข้อกล่าวหา 3 ประเด็น แต่ยังมีเอกสารยืนยันเพียง 2 ประเด็น'},
 {id:'GP001-E03',question:'ร่างหนังสือตอบข้อทักท้วงของสำนักงานการตรวจเงินแผ่นดิน โดยยังไม่ทราบเลขที่หนังสือและวันลงนาม'},
 {id:'GP001-E04',question:'ร่างหนังสือตอบข้อร้องเรียนประชาชนเรื่องถนนชำรุด โดยยังไม่ได้ตรวจสอบข้อเท็จจริง'},
 {id:'GP001-E05',question:'ร่างหนังสือหารือจังหวัดเกี่ยวกับอำนาจหน้าที่ของ อบจ. โดยขอให้ตรวจระเบียบล่าสุด'}
];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname;
 const file=resolve(root,'.'+(pathname==='/'?'/index.html':decodeURIComponent(pathname)));
 if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
 try{res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'}).end(await readFile(file));}
 catch{res.writeHead(404).end();}
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const device of [{name:'desktop',viewport:{width:1363,height:936}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]){
  const context=await browser.newContext({viewport:device.viewport,isMobile:!!device.isMobile,hasTouch:!!device.hasTouch,permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block',locale:'th-TH'});
  const page=await context.newPage();
  for(const fixture of cases){
   const result={id:fixture.id,device:device.name,scope:'isolated-pr-head-browser',status:'FAIL',downstreamAnswer:'NOT TESTED'};
   try{
    const response=await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
    assert.equal(response.status(),200);
    const input=page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'});
    await input.fill(fixture.question);
    await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
    const details=page.locator('.answer-card .answer-section details').filter({has:page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true})});
    await details.locator('summary').click({timeout:20000});
    const prompt=await details.locator('pre').textContent();
    assert.ok(prompt.includes(fixture.question),'original question preserved');
    for(const term of ['Issue Coverage Matrix','Human Review','Decision Lock','ข้อเท็จจริง'])assert.ok(prompt.includes(term),'missing '+term);
    await page.getByRole('button',{name:/^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/}).click();
    await page.waitForFunction(async expected=>(await navigator.clipboard.readText())===expected,prompt);
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),prompt);
    const layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
    assert.ok(layout.scrollWidth<=device.viewport.width+2,'horizontal overflow');
    result.status='PASS';result.promptLength=prompt.length;result.layout=layout;
   }catch(e){result.error=String(e.stack||e);}
   await page.screenshot({path:resolve(out,device.name+'-'+fixture.id+'.png'),fullPage:false});
   results.push(result);console.log(device.name,fixture.id,result.status,result.error||'');
  }
  await context.close();
 }
}finally{await browser?.close();await new Promise(done=>server.close(done));await writeFile(resolve(out,'results.json'),JSON.stringify({head:process.env.GITHUB_SHA||null,results},null,2));}
console.log('GP001 browser E2E:',results.filter(x=>x.status==='PASS').length+'/'+results.length);
assert.equal(results.length,10);assert.equal(results.filter(x=>x.status!=='PASS').length,0,'GP001 browser E2E failed');
