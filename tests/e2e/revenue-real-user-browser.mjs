import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const base = process.env.GOVPROMPT_TEST_URL || 'http://127.0.0.1:8765/';
const out = 'artifacts/revenue-real-user-browser';
await mkdir(out, { recursive:true });
const cases = [
 ['R03','อบจ.พะเยาจะจัดเก็บรายได้จากผู้เข้าพักโรงแรม ต้องตรวจข้อบัญญัติและหลักเกณฑ์อะไรบ้าง','ประเภท อปท.'],
 ['R04','อบจ.พะเยาต้องการจัดเก็บรายได้จากน้ำมัน ก๊าซ และยาสูบ สามารถใช้อัตราเดียวกันทั้งหมดได้หรือไม่ และต้องตรวจสอบกฎหมายกับข้อบัญญัติใดบ้างก่อนดำเนินการ?','ชนิดสินค้า'],
 ['R05','ประชาชนได้รับหนังสือแจ้งประเมินภาษีจากเทศบาล แต่ไม่ทราบวันที่รับหนังสือ จะยังสามารถยื่นอุทธรณ์ได้หรือไม่ ต้องตรวจสอบกฎหมาย ระยะเวลา และหลักฐานอะไรบ้าง?','หนังสือแจ้งประเมิน'],
 ['R06','เทศบาลมีผู้ค้างชำระภาษีที่ดินและสิ่งปลูกสร้างย้อนหลัง 3 ปี ยังไม่ได้ตรวจสอบหนังสือแจ้งและยอดหนี้ สามารถออกคำสั่งยึดทรัพย์ได้ทันทีหรือไม่ และต้องดำเนินการตามขั้นตอนกฎหมายอย่างไร?','ยอดค้าง'],
 ['R07','อบต.ต้องการเผยแพร่ข้อมูลแผนที่ภาษีและทะเบียนทรัพย์สินบนเว็บไซต์ โดยมีชื่อเจ้าของที่ดิน เลขบัตรประชาชน และข้อมูลสิ่งปลูกสร้าง สามารถเผยแพร่ทั้งหมดได้หรือไม่ ต้องตรวจสอบกฎหมายและ PDPA อย่างไร?','ทะเบียนทรัพย์สิน'],
 ['R08','เจ้าหน้าที่ อบต. พบข้อมูลแปลงที่ดินในระบบ LTAX ONLINE ไม่ตรงกับทะเบียนทรัพย์สิน ต้องตรวจสอบข้อมูลและแก้ไขอย่างไร โดยไม่กระทบข้อมูลภาษีเดิม?','คู่มือ'],
 ['R09','เทศบาลได้รับเงินภาษีที่ดินและสิ่งปลูกสร้างแล้ว แต่ยอดเงินตามใบเสร็จไม่ตรงกับยอดเงินในบัญชี ต้องตรวจสอบและบันทึกรายรับในระบบ New e-LAAS อย่างไรให้ถูกต้องตามระเบียบปัจจุบัน?','คู่มือ'],
 ['R10','ช่วยร่างหนังสือราชการแจ้งให้ผู้เสียภาษีที่ดินและสิ่งปลูกสร้างชำระภาษีค้าง โดยยังไม่มีเลขที่หนังสือ ยอดภาษีค้าง และข้อมูลผู้เสียภาษีที่ตรวจสอบแล้ว ให้เว้นช่องข้อมูลที่ขาดและระบุหลักเกณฑ์ที่ต้องตรวจสอบก่อนลงนาม','ประเภทเอกสาร']
];
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const device of [{name:'desktop',viewport:{width:1440,height:900}},{name:'mobile',viewport:{width:390,height:844},isMobile:true,hasTouch:true}]) {
  const context=await browser.newContext({viewport:device.viewport,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'th-TH',permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();
  const browserEvents=[];
  page.on('pageerror',e=>browserEvents.push('PAGEERROR '+String(e)));
  page.on('console',m=>{if(m.type()==='error')browserEvents.push('CONSOLE '+m.text())});
  page.on('requestfailed',req=>browserEvents.push('NETWORK '+req.url()+' '+req.failure()?.errorText));
  for(const [id,question,expectedEvidence] of cases) {
   let status='PASS',reason='',stage='submit';
   try {
    const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
    assert.equal(response?.status(),200);
    await page.locator('#promptInput').waitFor({state:'visible',timeout:15000});
    await page.waitForFunction(()=>typeof window.GovPromptCore?.createGovernmentPrompt==='function' && typeof window.GovPromptCore?.prepareGP223IntakeTurn==='function',null,{timeout:20000});
    await page.locator('#promptInput').fill(question);
    const preSubmit = await page.evaluate(()=>({readyState:document.readyState,homeScript:[...document.scripts].filter(x=>x.src.includes('home-v3')).map(x=>x.src),form:!!document.querySelector('#chatForm'),messageCount:document.querySelectorAll('#conversation .message.user').length,pathname:location.pathname}));
    await page.locator('#chatForm button[type="submit"]').click();
    if(id==='R07') {
      // An abstract question must not be intercepted by capture-phase Privacy Gate.
      await page.locator('#conversation .message.user').first().waitFor({state:'attached',timeout:20000});
    } else {
      await page.locator('#conversation .message.user').first().waitFor({state:'attached',timeout:20000});
    }
    const sourceMessage=await page.locator('#conversation .message.user').first().textContent();
    assert.ok(sourceMessage.includes(question),'submitted question missing from DOM');
    await page.locator('#thinkingMessage').waitFor({state:'detached',timeout:30000});
    stage='result';
    const card=page.locator('#conversation .message.assistant .answer-card').first();
    await card.waitFor({timeout:20000});
    const visible=await card.innerText();
    assert.match(visible,/งานจัดเก็บรายได้ อปท./,'missing topical revenue label');
    assert.ok(visible.includes(expectedEvidence),'missing case-specific evidence '+expectedEvidence);
    stage='handoff';
    const prompt=await card.locator('details pre').innerText();
    assert.ok(prompt.includes(question),'copyable prompt lost original question');
    assert.match(prompt,/Evidence Gate|หลักฐาน/);
    assert.match(prompt,/Decision Lock/);
    assert.match(prompt,/Human Review|ตรวจสอบก่อนใช้จริง|เจ้าหน้าที่ตรวจสอบ/);
    const handoff=await card.locator('button').filter({hasText:'คัดลอกไปใช้กับ AI'}).count();
    assert.ok(handoff>=1,'copy button missing');
    if(id==='R10') assert.match(prompt,/ร่าง|เว้นช่อง|ข้อมูลที่ขาด/);
    if(id==='R07'){
      stage='privacy-negative';
      await page.goto(base,{waitUntil:'domcontentloaded'});
      await page.locator('#promptInput').fill('ข้อมูลภาษีของนายสมชาย ใจดี เลขบัตรประชาชน 1234567890123');
      await page.locator('#chatForm button[type="submit"]').click();
      await page.waitForTimeout(250);
      assert.equal(await page.locator('#conversation .message.user').count(),0,'PII unexpectedly reached UI');
    }
   } catch(e) { status='FAIL';reason=String(e?.stack||e);reason+='\nBROWSER_EVENTS: '+browserEvents.slice(-16).join(' | '); reason+='\nDOM_STATE: '+JSON.stringify(await page.evaluate(()=>({url:location.href,readyState:document.readyState,input:document.querySelector('#promptInput')?.value,form:document.querySelector('#chatForm')?.outerHTML.slice(0,450),conversation:document.querySelector('#conversation')?.innerText.slice(0,450),result:document.documentElement.className})).catch(()=>({unavailable:true})));}
   try {await page.screenshot({path:`${out}/${device.name}-${id}-${status}.png`,fullPage:true});}catch{}
   results.push({id,device:device.name,status,stage,reason,head:process.env.GITHUB_SHA||null,source:'local-PR-branch-http-server',downstreamAnswer:'NOT TESTED'});
   console.log(device.name,id,status,stage,reason.slice(0,2500));
  }
  await context.close();
 }
} finally {await browser.close();}
await writeFile(`${out}/results.json`,JSON.stringify({base,head:process.env.GITHUB_SHA||null,results},null,2));
if(results.some(r=>r.status==='FAIL')) process.exitCode=1;
