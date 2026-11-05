// PR #367: exact real-browser, main-vs-branch GP001 copy/preview evidence.
// Browser renders the static built app; no external AI service or paid API is invoked.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const cases = [
  ['PR367-MEMO', 'จัดทำบันทึกข้อความเรื่องการประชุมประจำเดือนขององค์การบริหารส่วนจังหวัดพะเยา'],
  ['PR367-LETTER', 'จัดทำหนังสือราชการเรื่องขอความร่วมมือประชาสัมพันธ์กิจกรรมขององค์การบริหารส่วนจังหวัดพะเยา']
];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
async function inspect(root, browser) {
  const directory=resolve(root);
  const server=createServer(async(req,res)=>{
    let path;
    try {
      const uri=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      path=resolve(directory,'.'+(uri==='/'?'/index.html':uri));
      if(!path.startsWith(directory+sep)){res.writeHead(403).end();return;}
      res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'}).end(await readFile(path));
    }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const origin='http://127.0.0.1:'+server.address().port;
  const context=await browser.newContext({permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block',locale:'th-TH'});
  const rows=[];
  try {
    await context.addInitScript(()=>{Date.now=()=>1792440000000;Math.random=()=>0.5;});
    const page=await context.newPage();
    for(const [scenario,question] of cases){
      await page.goto(origin+'/index.html',{waitUntil:'networkidle'});
      await page.getByRole('textbox',{name:'ข้อความถึง GovPrompt'}).fill(question);
      await page.getByRole('button',{name:'ส่งข้อความ',exact:true}).click();
      const details=page.locator('.answer-card .answer-section details').filter({has:page.getByText('ดูคำสั่งที่ GovPrompt เตรียมไว้',{exact:true})});
      await details.locator('summary').click({timeout:30000});
      const preview=await details.locator('pre').textContent({timeout:30000});
      assert.ok(preview&&preview.includes(question),scenario+': user text absent');
      await page.getByRole('button',{name:/^คัดลอก(?:ไปใช้กับ AI|คำสั่งอย่างเดียว|คำสั่ง)$/}).click();
      const copied=await page.evaluate(()=>navigator.clipboard.readText());
      assert.equal(copied,preview,scenario+': clipboard mismatch');
      const required=['[GP_DOCUMENT_HANDOFF_V1]','เนื้อหาฉบับเต็ม','[รอตรวจสอบ]','ห้ามทำลิงก์ดาวน์โหลดปลอม','Evidence','Decision Lock','Legal Version Gate','Human Review'];
      for(const text of required)assert.ok(preview.includes(text),scenario+': missing '+text);
      if(scenario==='PR367-MEMO')assert.ok(preview.includes('ส่วนราชการ ที่ วันที่ เรื่อง เรียน'),scenario+': memo structure missing');
      if(scenario==='PR367-LETTER')assert.ok(preview.includes('อย่าเปลี่ยนเป็นบันทึกข้อความ'),scenario+': external letter contract missing');
      rows.push({
        scenario,question,status:'PASS',previewCopyEqual:true,
        chars:[...preview].length,utf8Bytes:Buffer.byteLength(preview,'utf8'),
        estimatedTokens:Math.ceil(Buffer.byteLength(preview,'utf8')/4),
        sha256:createHash('sha256').update(preview,'utf8').digest('hex'),
        verifiedTerms:required
      });
    }
  }finally{await context.close();await new Promise(done=>server.close(done));}
  return rows;
}
const dir=resolve('artifacts/prompt-efficiency-runtime');await mkdir(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
let base,head;
try {
  base=await inspect('.prompt-base/dist',browser);
  head=await inspect('dist',browser);
}finally{await browser.close();}
const comparisons=cases.map(([scenario,question])=>{
  const b=base.find(x=>x.scenario===scenario),h=head.find(x=>x.scenario===scenario);
  assert.ok(b&&h,scenario+': missing measurement');
  const deltaChars=h.chars-b.chars,deltaUtf8Bytes=h.utf8Bytes-b.utf8Bytes;
  assert.ok(deltaChars<0&&deltaUtf8Bytes<0,scenario+': prompt not shorter');
  assert.notEqual(b.sha256,h.sha256,scenario+': content unchanged');
  return {scenario,question,base:b,head:h,deltaChars,deltaUtf8Bytes,deltaEstimatedTokens:h.estimatedTokens-b.estimatedTokens,improvementPct:Math.round((-deltaUtf8Bytes/b.utf8Bytes)*10000)/100,copyPreview:'PASS',contract:'PASS',downstreamDocx:'NOT VERIFIED'};
});
const result={head:process.env.GITHUB_SHA||null,method:'Playwright final browser copy; base build compared to PR HEAD build',tokenCaveat:'Estimated tokens = ceil(UTF-8 bytes/4), not provider tokens',cases:comparisons,downstreamAiCalls:0,fullAcceptance:'NOT VERIFIED - downstream AI DOCX not executed'};
await writeFile(resolve(dir,'pr367-memo-letter-comparison.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
