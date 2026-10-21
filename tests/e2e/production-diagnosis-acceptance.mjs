// Built branch acceptance, not production or downstream AI certification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
const root=resolve('dist'),out=resolve('artifacts/production-diagnosis');await mkdir(out,{recursive:true});
const source=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const cases=[
 ['TOR04','ร่าง TOR งานก่อสร้างถนน พร้อมตรวจความสอดคล้องกับ BOQ และรายการประมาณราคา','tor'],
 ['DRAW01','จัดทำแบบรูปรายการงานก่อสร้างอาคาร ไม่ขอประมาณราคา ไม่ขอ TOR','technical-drawing'],
 ['BOQ01','จัดทำ BOQ ปร.4 งานก่อสร้างถนนพร้อมราคาวัสดุและแรงงาน','engineering-boq'],
 ['STRUCT01','ตรวจแบบก่อสร้างอาคารและโครงสร้าง ประเมินความเสี่ยง ไม่รับรองความปลอดภัย','drawing-review'],
 ['PDPA','อธิบายหลัก PDPA สำหรับข้อมูลสุขภาพ ศาสนา และประวัติอาชญากรรม โดยไม่ใช้ข้อมูลบุคคลจริง',null],
 ['FUND','ร่างโครงการอาหารปลอดภัยของ รพ.สต. ใช้เงินบำรุง วงเงิน 50000 บาท สำหรับกิจกรรมอบรม 1 วัน โดยยังไม่ยืนยันสิทธิเบิกจ่าย','project'],
 ['GP012','เขียนข่าวประชาสัมพันธ์กิจกรรมปลูกต้นไม้ของ อบจ. โดยใช้ช่องว่างสำหรับวันเวลาและสถานที่',null],
 ['GP001','ร่างหนังสือราชการเชิญประชุมหัวหน้าส่วนราชการ ใช้ช่องว่างสำหรับวันเวลา','official-document'],
 ['GP002','อธิบายวิธีตรวจฐานอำนาจขององค์กรปกครองส่วนท้องถิ่นก่อนออกคำสั่ง',null],
 ['GP005','สรุปงบประมาณรวม 100000 บาท เบิกจ่ายรวม 40000 บาท คงเหลือ 60000 บาท จัดทำตารางติดตาม','table'],
 ['REVENUE','ทำ checklist ขั้นตอนจัดเก็บภาษีที่ดินและสิ่งปลูกสร้างของเทศบาล โดยไม่มีข้อมูลผู้เสียภาษีจริง','checklist'],
 ['GP004','ร่างโครงการอบรมดิจิทัลของ อบจ. 1 วัน ใช้ช่องว่างสำหรับวงเงินและจำนวนผู้เข้าร่วม','project'],
 ['GP003','จัดทำ checklist เตรียมเอกสารจัดซื้อวัสดุสำนักงาน โดยยังไม่ระบุวงเงิน','checklist'],
 ['GP006','ทำ checklist การจัดทำแผนอัตรากำลังของเทศบาล ไม่ใช้ข้อมูลเจ้าหน้าที่จริง','checklist'],
 ['GP011','ร่างสรุปผู้บริหารเรื่องติดตามงานภายใน 30 วัน ใช้ตารางผู้รับผิดชอบและกำหนดเวลา','executive-summary'],
 ['GP008','สรุปภารกิจสาธารณสุขของ รพ.สต. สำหรับเจ้าหน้าที่ใหม่',null],
 ['GP009','ร่างโครงการส่งเสริมการอ่านของโรงเรียน 1 วัน ใช้ช่องว่างสำหรับงบประมาณ','project'],
 ['GP013','ร่างระเบียบวาระประชุมสภาท้องถิ่น โดยใช้ช่องว่างสำหรับวันเวลาและเรื่องเสนอ','council-agenda'],
 ['ESTIMATE','ตรวจปริมาณงานซ่อมถนนคอนกรีตและราคากลาง','engineering-estimate'],
 ['K','ตรวจสอบค่า K งานก่อสร้างถนน','k-review'],
 ['GP001-AUDIT','ร่างหนังสือตอบ สตง. เรื่องงานก่อสร้างถนน','official-document'],
 ['PR-CONTROL','ทำโพสต์ประชาสัมพันธ์งานก่อสร้างถนน',null]
];
const blocked=[
 'อธิบายหลัก PDPA สำหรับข้อมูลสุขภาพ โดยไม่ใช้ข้อมูลบุคคลจริง HN1234',
 'อธิบายข้อมูลสุขภาพ นายสมชาย ใจดี เป็นเบาหวาน',
 'PDPA ไม่มีข้อมูลจริง password=demo-secret',
 'PDPA ไม่มีข้อมูลจริง เลขบัตรประชาชน 1234567890123',
 'ข้อมูลศาสนา พุทธ',
 'จัดซื้อจัดจ้างอยู่ระหว่างพิจารณา บริษัททดสอบ ราคาเสนอ 500000 บาท'
];
const server=createServer(async(req,res)=>{const path=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}try{res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream'}).end(await readFile(path));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const results=[];let browser;
async function startNew(page){
 if(!page.url().startsWith(base))await page.goto(base+'/?gpv=20261001-2',{waitUntil:'networkidle'});
 else {
  const stableHome=page.waitForURL(url=>url.pathname==='/index.html' && url.searchParams.get('gpv')==='20261001-2' && !url.searchParams.has('view'),{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'เริ่มงานใหม่',exact:true}).click();await stableHome;
 }
 await page.waitForLoadState('networkidle');
 await page.waitForFunction(()=>document.getElementById('chatForm')?.dataset.privacySubmitGuard==='3' && typeof window.GovPrompt?.on==='function');
}
try{
 browser=await chromium.launch({headless:true});
 for(const [device,width] of [['mobile',390],['desktop',1365]]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',permissions:['clipboard-read','clipboard-write'],locale:'th-TH'});
  // No external data requests or downstream AI during this branch test.
  await context.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
  const page=await context.newPage();let previousQuestion='';
  for(const [id,q,format] of cases){const row={id,device,width,source,status:'FAIL',downstreamAI:'NOT VERIFIED'};
   try{
    await startNew(page);
    await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(q);await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
    const summary=page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true}),skip=page.getByRole('button',{name:'ยังไม่ทราบบางข้อ — ทำต่อ',exact:true});
    await summary.or(skip).first().waitFor({state:'visible',timeout:30000});if(await skip.isVisible()){row.intake=await page.locator('main').innerText();await skip.click();}
    await summary.last().click({timeout:30000});const prompt=await page.locator('.answer-card .answer-section details pre').last().textContent();row.question=q;row.prompt=prompt;
    assert.ok(prompt.includes(q),'original question retained');if(previousQuestion)assert.ok(!prompt.includes(previousQuestion),'no previous task contamination');
    if(format)assert.ok(prompt.includes('- รูปแบบ: '+format),'actual final prompt format '+format);
    if(id==='GP013')assert.match(prompt,/ชิ้นงานที่ควรส่งมอบ: council-agenda/);
    if(['TOR04','DRAW01','BOQ01','STRUCT01','ESTIMATE','K'].includes(id)){assert.match(prompt,/Human Review/);assert.match(prompt,/Decision Lock: ON/);}
    if(id==='FUND'){assert.match(prompt,/- แหล่งเงิน: เงินบำรุง/);assert.doesNotMatch(prompt,/- แหล่งเงิน: \[ยังไม่ได้ระบุ\]/);assert.match(prompt,/Primary workflow: gov.project/);}
    if(id==='PDPA')assert.doesNotMatch(prompt,/Primary workflow: gov.hr/);
    if(id==='STRUCT01')assert.match(prompt,/ห้ามรับรองความมั่นคงปลอดภัย/);
    if(id==='ESTIMATE'){assert.match(prompt,/ตาราง C/);assert.match(prompt,/Factor F/);}
    await page.getByRole('button',{name:/^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/}).click();assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),prompt,'clipboard matches expanded prompt');
    row.layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(row.layout.scroll<=width+2,'no horizontal overflow');row.status='PASS';
   }catch(e){row.error=String(e.stack||e);}
   await page.screenshot({path:resolve(out,`${device}-${id}.png`),fullPage:true}).catch(()=>{});results.push(row);console.log(device,id,row.status,row.error?.split('\n')[0]||'');previousQuestion=q;
  }
  for(const [n,q] of blocked.entries()){const row={id:'BLOCK-'+n,device,source,status:'FAIL'};try{await startNew(page);await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(q);await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();await page.locator('#privacySubmitWarning').waitFor({state:'visible'});assert.equal(await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).inputValue(),'');assert.equal(await page.locator('.answer-card').count(),0);row.reason=await page.locator('#privacySubmitWarning').textContent();row.status='PASS';}catch(e){row.error=String(e.stack||e);}results.push(row);console.log(device,row.id,row.status);}
  await context.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile(resolve(out,'results.json'),JSON.stringify({source,scope:'built branch; UI + clipboard + 13-domain smoke',downstreamAI:'NOT VERIFIED',results},null,2));}
assert.equal(results.length,(cases.length+blocked.length)*2);assert.equal(results.filter(x=>x.status!=='PASS').length,0,'branch UI acceptance failures');
