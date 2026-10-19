// Browser evidence: measure the final copyable prompt after home-v3 runtime enrichment.
// This is a head-branch runtime measurement; it is not a before/after tokenizer benchmark.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';
const root=resolve(process.env.PROMPT_RUNTIME_ROOT || 'dist'), out=resolve('artifacts/prompt-efficiency-runtime');
await mkdir(out,{recursive:true});
const examples=[
 ['GP001','ร่างหนังสือราชการขอข้อมูลการประชุม'],
 ['GP002','วิเคราะห์อำนาจ อบจ. ตามกฎหมายปัจจุบัน'],
 ['GP003','ตรวจ TOR จัดซื้อจัดจ้างและหลักเกณฑ์'],
 ['GP004','จัดทำโครงการและงบประมาณประจำปี'],
 ['GP005','ค่าอาหารและเครื่องดื่มในงานราชการเบิกได้หรือไม่'],
 ['GP006','ตรวจสิทธิการเลื่อนเงินเดือนข้าราชการท้องถิ่น'],
 ['GP007','ตรวจปริมาณงานซ่อมถนนคอนกรีตและราคากลาง'],
 ['GP008','จัดทำโครงการสาธารณสุข รพ.สต.'],
 ['GP009','ร่างกิจกรรมการศึกษาสำหรับนักเรียน'],
 ['GP010','ตรวจประเมินควบคุมภายใน ปค.5'],
 ['GP011','สรุปข้อเสนอเชิงนโยบายผู้บริหาร'],
 ['GP012','เขียนข่าวประชาสัมพันธ์กิจกรรมท้องถิ่น'],
 ['GP013','จัดทำวาระประชุมสภาท้องถิ่น'],
 ['HIGH-RISK-FINANCE','อบจ. ตั้งงบ 500000 บาท แสดงความจงรักภักดี เบิกค่าดอกไม้จันทน์และอาหารได้หรือไม่'],
 ['HIGH-RISK-LEGAL','อบจ. มีอำนาจจัดเก็บภาษีที่ดินและสิ่งปลูกสร้างหรือไม่'],
 ['HIGH-RISK-PROCUREMENT','ตรวจ TOR และการจัดซื้อจัดจ้างโดยวิธีเฉพาะเจาะจงถูกกฎหมายหรือไม่'],
 ['RUNTIME-REVENUE','ตรวจภาษีป้ายที่ค้างชำระและการอุทธรณ์'],
 ['RUNTIME-GP223','ร่าง TOR จ้างเหมาบริการบุคคลธรรมดา ตำแหน่งธุรการ']
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
let browser; const rows=[];
try {
 browser=await chromium.launch({headless:true});
 const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block',locale:'th-TH'});
 // Control only exogenous inputs before application modules execute, identically for base/head.
 // generateCaseId uses Date.now and Math.random; variable base-36 IDs are not prompt growth.
 await context.addInitScript(() => {
  Date.now = () => 1792440000000;
  Math.random = () => 0.5;
 });
 const page=await context.newPage();
 for (const [scenario,question] of examples) {
  const row={scenario,status:'FAIL',measurement:'FINAL_COPYABLE_BROWSER_PROMPT'};
  try {
   await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
   await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(question);
   await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
   const details=page.locator('.answer-card .answer-section details').filter({has:page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true})});
   await details.locator('summary').click({timeout:30000});
   const prompt=await details.locator('pre').textContent({timeout:30000});
   assert.ok(prompt?.includes(question),scenario+': missing user question');
   await page.getByRole('button',{name:/^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/}).click();
   const copied=await page.evaluate(()=>navigator.clipboard.readText());
   assert.equal(copied,prompt,scenario+': copy differs from preview');
   const caseLine=prompt.match(/^- Case: (case-[a-z0-9]+-[a-z0-9]+) ·/m);
   if(caseLine) assert.equal(caseLine[1],'case-mvfohvk0-89oqgw',scenario+': uncontrolled Case ID');
   row.prompt=prompt;
   row.status='PASS';row.chars=[...prompt].length;row.utf8Bytes=Buffer.byteLength(prompt,'utf8');
   row.sha256=createHash('sha256').update(prompt,'utf8').digest('hex');
   row.tokenEstimate=Math.ceil(row.utf8Bytes/4);
   row.qualityStandard=prompt.includes('GovPrompt Prompt Quality Standard v7.2');
   row.revenueGuidance=prompt.includes('งานจัดเก็บรายได้ท้องถิ่น — ข้อกำหนดเฉพาะ');
   console.log(scenario,JSON.stringify(row));
  } catch(e){row.error=String(e.message||e);console.error(scenario,row.error);}
  rows.push(row);
 }
 await context.close();
}finally{
 await browser?.close();await new Promise(done=>server.close(done));
 await writeFile(resolve(out,process.env.PROMPT_RUNTIME_REPORT || 'results.json'),JSON.stringify({head:process.env.PROMPT_RUNTIME_SOURCE_REF||process.env.GITHUB_SHA||null,tokenMeasure:'ceil(UTF8 bytes/4), not provider tokenizer',rows},null,2));
}
assert.equal(rows.length,examples.length);
assert.equal(rows.filter(r=>r.status!=='PASS').length,0,'final browser prompt scenarios failed');
assert.ok(rows.find(r=>r.scenario==='RUNTIME-REVENUE')?.revenueGuidance,'revenue runtime enrichment absent');
