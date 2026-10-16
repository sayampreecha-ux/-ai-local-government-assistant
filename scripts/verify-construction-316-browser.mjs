// Browser E2E against isolated checkout, not downstream AI or production evidence.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve(process.env.FAT_UI_ROOT||'.'),dir=resolve('artifacts/construction-316');
await mkdir(dir,{recursive:true});
const cases=[
['TC01','ตรวจราคากลางถนนคอนกรีต 100 เมตร กว้าง 6 เมตร หนา 0.15 เมตร BOQ 90 ลูกบาศก์เมตร'],
['TC02','ตรวจสอบ ปร.4 รายการ 1000+1000 บาท เทียบ ปร.5 สรุป 2100 บาท'],
['TC03','ตรวจ Factor F งานก่อสร้างโดยยังไม่มีตาราง Factor F ฉบับที่ใช้'],
['TC04','ตรวจราคาวัสดุและค่าแรงจังหวัดปี 2569 โดยยังไม่มีประกาศราคา'],
['TC05','ตรวจ BOQ 95 ลูกบาศก์เมตร เทียบแบบก่อสร้าง 90 ลูกบาศก์เมตร'],
['TC06','ถอดปริมาณงานจาก PDF แบบก่อสร้าง 74 รายการ แต่ยังไม่ได้แนบ PDF'],
['TC07','ตรวจค่า K งานหินคลุกปรับเกลี่ยเรียบไม่มีบดอัด ยังไม่มีดัชนีและเงื่อนไขสัญญา'],
['TC08','ตรวจถนนตามแบบกว้าง 6.00 เมตร วัดจริง 5.90 เมตร ยาว 100 เมตร'],
['TC09','ตรวจรับคอนกรีตส่งงาน 25 กันยายน สัญญาหมด 29 กันยายน ผลทดสอบออก 2 ตุลาคม'],
['TC10','ตรวจราคากลางงานก่อสร้างอาคารห้องน้ำ แต่ยังไม่มีแบบและ ปร.4'],
['TC11','ตรวจราคาวัสดุ 1250 บาท ไม่มีหลักฐานแหล่งราคาทางการ'],
['TC12','ตรวจเอกสารเบิกจ่ายค่าก่อสร้างไม่ครบ ไม่มีรายงานตรวจรับลงนาม']
];
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{const p=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://localhost').pathname)));if(!p.startsWith(root+sep)){res.writeHead(403).end();return;}try{const body=await readFile(p);res.writeHead(200,{'content-type':types[extname(p)]||'application/octet-stream'}).end(body);}catch{res.writeHead(404).end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const origin='http://127.0.0.1:'+server.address().port,results=[];let browser;
try{browser=await chromium.launch({headless:true});
for(const [mode,viewport] of [['desktop',{width:1363,height:936}],['mobile',{width:390,height:844}]]){
const context=await browser.newContext({viewport,isMobile:mode==='mobile',hasTouch:mode==='mobile',permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block'});const page=await context.newPage();
for(const [id,question] of cases){const record={id,mode,question,status:'FAIL',scope:'isolated-checkout-ui',downstreamAnswer:'NOT TESTED'};
try{await page.goto(origin+'/index.html',{waitUntil:'networkidle'});const input=page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'});await input.fill(question);await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
const details=page.locator('.answer-card .answer-section details').filter({has:page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true})});await details.locator('summary').click({timeout:20000});record.preview=await details.locator('pre').textContent();assert.ok(record.preview.includes(question),'original question retained');
await page.getByRole('button',{name:/^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/}).click();await page.waitForFunction(async expected=>(await navigator.clipboard.readText())===expected,record.preview);record.copied=await page.evaluate(()=>navigator.clipboard.readText());assert.equal(record.copied,record.preview);
record.route=await page.locator('.route-label').last().innerText();record.layout=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));assert.ok(record.layout.scrollWidth<=viewport.width+2);
if(id==='TC07'){assert.match(record.preview,/ค่า\s*K|ค่าเค|ค่าชดเชยค่างาน/);}
assert.match(record.preview,/constructionEvidenceStatus=UNVERIFIED; decisionLock=ON/,'construction certification remains locked until evidence is verified');
assert.doesNotMatch(record.preview,/Evidence Gate: OFF|Legal Version Gate: OFF/,'construction evidence gates must not contradict the lock');
assert.match(record.preview,/ตัวเลขและราคาจำลองไม่ใช่ราคามาตรฐานราชการ/);
assert.match(record.preview,/ห้ามอ้างว่าเปิดอ่านหรือถอดปริมาณแล้ว/);
assert.match(record.preview,/ส่วนต่างเชิงคณิตศาสตร์ไม่ใช่ยอดหักตามสัญญาอัตโนมัติ/);
record.status='PASS';}catch(e){record.error=String(e.stack||e);}await page.screenshot({path:resolve(dir,mode+'-'+id+'.png')});results.push(record);await writeFile(resolve(dir,mode+'-'+id+'.json'),JSON.stringify(record,null,2));}await context.close();}
}finally{await browser?.close();await new Promise(ok=>server.close(ok));await writeFile(resolve(dir,'results.json'),JSON.stringify({scope:'isolated-checkout-ui',results},null,2));}
console.log(JSON.stringify({cases:results.length,pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length}));assert.equal(results.length,24);assert.equal(results.filter(x=>x.status==='FAIL').length,0);
