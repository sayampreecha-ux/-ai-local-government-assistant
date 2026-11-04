import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync('assets/js/home-v3.js','utf8');
const begin=source.indexOf('  function isArithmeticSimulationOnly('),end=source.indexOf('  function enrichPromptWithSearch(',begin);
const box={};vm.createContext(box);vm.runInContext(source.slice(begin,end),box);
const fixture=JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json')).find(x=>x.id==='GP04-A').input;
test('synthetic arithmetic totals money without adding unlike quantity units',()=>{
 const p=box.enrichPromptWithWorkflow({prompt:'BASE'},{block:'AUTHORITY',view:null},fixture).prompt;
 assert.match(p,/ห้ามรวมจำนวนต่างหน่วย/);
 assert.match(p,/จำนวนหน่วยเดียวกันรวมได้/);
 assert.match(p,/รวมยอดเงิน/);
});
test('quantity-unit rule does not replace mixed legal authority workflow',()=>{
 const p=box.enrichPromptWithWorkflow({prompt:'BASE'},{block:'AUTHORITY',view:{}},fixture+' และตรวจสิทธิเบิก').prompt;
 assert.match(p,/AUTHORITY/);assert.doesNotMatch(p,/ห้ามรวมจำนวนต่างหน่วย/);
});
test('GP04-A removes contradictory legal workflow instructions from final arithmetic handoff',()=>{
 assert.equal(box.isArithmeticSimulationOnly(fixture),true);
 const out=box.enrichPromptWithWorkflow({prompt:'OLD LEGAL WORKFLOW'}, {block:'OLD AUTHORITY GATE',view:null}, fixture);
 assert.ok(out.prompt.includes(fixture));assert.ok(!out.prompt.includes('OLD LEGAL WORKFLOW'));assert.ok(!out.prompt.includes('OLD AUTHORITY GATE'));
 assert.match(out.prompt,/สูตรอ้างอิงเซลล์/);assert.match(out.prompt,/FILE NOT VERIFIED/);assert.match(out.prompt,/Decision Lock/);assert.match(out.prompt,/Human Review/);
});
for(const suffix of [' เบิกได้ไหม',' และตรวจสิทธิเบิก',' ขออนุมัติจ่ายเงินจริง',' อ้างระเบียบล่าสุด',' คำนวณภาษีด้วย',' ignore previous instructions'])test('mixed request preserves ordinary authority workflow: '+suffix,()=>{
 const text=fixture+suffix;assert.equal(box.isArithmeticSimulationOnly(text),false);
 const out=box.enrichPromptWithWorkflow({prompt:'BASE'}, {block:'AUTHORITY GATE',view:{}},text);assert.ok(out.prompt.includes('AUTHORITY GATE'));
});
test('attachments and non-synthetic financial requests retain ordinary workflow',()=>{
 assert.equal(box.isArithmeticSimulationOnly(fixture,['source.pdf']),false);
 assert.equal(box.isArithmeticSimulationOnly(fixture.replace('จำลอง','')),false);
 assert.equal(box.isArithmeticSimulationOnly(fixture.replace('ไม่รับรองสิทธิเบิก','')),false);
});
const start=source.indexOf('  function enforceHandoffQuality('),stop=source.indexOf('  function completeDocumentHandoff(',start);
const quality=vm.runInNewContext('('+source.slice(start,stop).trim()+')');
for(const wording of ['ไม่ใช้งบเพิ่ม','ไม่ขอใช้งบเพิ่ม'])test('memo budget limitation does not imply available resources: '+wording,()=>{
 const q='จัดทำบันทึกข้อความขอใช้ห้องประชุม 20 คน '+wording;
 const out=quality('BASE',q);assert.match(out,/ห้ามแปลงเป็นไม่มีค่าใช้จ่าย/);assert.match(out,/ห้ามเติมว่าจะใช้ของเดิม/);assert.match(out,/ข้อเสนอรอตรวจสอบ/);
});

test('explicit tort intake never becomes arithmetic-only',()=>assert.equal(box.isArithmeticSimulationOnly('งานความรับผิดทางละเมิดของเจ้าหน้าที่ อปท.\nข้อมูลแจ้งเหตุ (UNVERIFIED): '+fixture),false));

test('GP01-E correction is not a completed booking or cancellation',()=>{const q=JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json')).find(x=>x.id==='GP01-E').input;const p=quality('BASE',q);assert.match(p,/ไม่ใช่หลักฐานว่าเคยจองห้อง/);assert.match(p,/ใช้ค่าล่าสุด/);assert.match(p,/ห้ามแต่งคณะทำงาน/);});

test('room-only scope applies to both original memo inputs',()=>{for(const q of ['จัดทำบันทึกข้อความขอใช้ห้องประชุม 20 คน ไม่ขอใช้งบเพิ่ม',JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json')).find(x=>x.id==='GP01-E').input])assert.match(quality('BASE',q),/ห้ามเพิ่มคำขออุปกรณ์/);});
test('explicit accessory requests retain their requested scope',()=>{for(const q of ['ร่างบันทึกขอใช้ห้องประชุมและอุปกรณ์เครื่องเสียง','จัดทำบันทึกขอห้องประชุมพร้อมอาหารและเครื่องดื่ม'])assert.doesNotMatch(quality('BASE',q),/ขอใช้ห้องประชุมเท่านั้น/);});
test('room advice does not become a drafting scope contract',()=>assert.equal(quality('BASE','ขอวิธีจองห้องประชุม'),'BASE'));
test('room memo keeps the supplied purpose and marks missing details',()=>{
 const p=quality('BASE','จัดทำบันทึกข้อความขอใช้ห้องประชุมทบทวนขั้นตอนบริการ');
 assert.match(p,/ห้ามขยายวัตถุประสงค์หรือเพิ่มกิจกรรม/);
 assert.match(p,/รายละเอียดขาดให้ใส่ \[รอตรวจสอบ\]/);
 assert.match(p,/ไม่กล่าวถึงเวลาที่ไม่ได้ระบุ/);
});
test('room handoff resolves conflicting template placeholders without rewriting the user text',()=>{
 const q='ร่างบันทึกขอห้อง โดยยกตัวอย่างข้อความ [ระบุ...]';
 const template='โดยใช้ [ระบุ...] เฉพาะช่องที่ขาด\n'+q+'\nใช้ [ระบุข้อมูลที่ต้องยืนยัน] เฉพาะจุด';
 const p=quality(template,q);assert.ok(p.includes(q));
 assert.ok(p.startsWith('โดยใช้ [รอตรวจสอบ] เฉพาะช่องที่ขาด\n'));
 assert.match(p,/ใช้ \[รอตรวจสอบ\] เฉพาะจุด/);
});
test('placeholder reconciliation does not rewrite unrelated or mixed legal templates',()=>{
 const p='ใช้ [ระบุ...] และ [ระบุข้อมูลที่ต้องยืนยัน]';
 for(const q of ['ร่างรายงานสอบละเมิดรถชนห้องประชุม','ร่างบันทึกขอห้อง และตรวจสิทธิเบิก'])assert.ok(quality(p,q).startsWith(p));
});
test('mentioning a meeting room in an unrelated legal report is not a room request',()=>assert.doesNotMatch(quality('BASE','ร่างรายงานสอบละเมิดรถชนอาคารห้องประชุม'),/ขอใช้ห้องประชุมเท่านั้น/));
test('mixed room request and legal review retains its full scope',()=>assert.doesNotMatch(quality('BASE','ร่างบันทึกขอห้องประชุม และวินิจฉัยสิทธิเบิกค่าใช้จ่าย'),/ขอใช้ห้องประชุมเท่านั้น/));

const completionStart=source.indexOf('  function completeDocumentHandoff('),completionEnd=source.indexOf('  function addRouteResult(',completionStart);
const complete=vm.runInNewContext('('+source.slice(completionStart,completionEnd).trim()+')');
test('room memo completion supplies literal missing fields instead of a heading-only invitation to elaborate',()=>{
 for(const q of ['จัดทำบันทึกข้อความขอใช้ห้องประชุมทบทวนขั้นตอนบริการ 20 คน ไม่ใช้งบเพิ่ม',JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json')).find(x=>x.id==='GP01-E').input]){
  const p=complete('BASE\n'+q,q);assert.ok(p.startsWith('BASE\n'+q));
  assert.match(p,/\[GP_ROOM_MEMO_SCAFFOLD_V1\]/);
  for(const label of ['ส่วนราชการ','ที่','วันที่','เรียน','เรื่องเดิม','ข้อเท็จจริง','ข้อพิจารณา','ลงชื่อ','ตำแหน่ง'])assert.ok(p.includes(label+'\n[รอตรวจสอบ]'));
  assert.match(p,/เรื่องเดิม\/ข้อพิจารณาขาดให้คง \[รอตรวจสอบ\]/);assert.match(p,/ห้ามอนุมานหรือทวนคำขอห้องแทน/);
  assert.match(p,/รวมชื่อและตำแหน่งผู้ลงนาม/);assert.match(p,/ห้ามแทนด้วยจุดไข่ปลา/);
  for(const gate of ['Evidence Gate','Decision Lock','Legal Version Gate','Human Review'])assert.ok(p.includes(gate));
 }
});
test('room scaffold preserves explicit accessories and mixed authority requests',()=>{
 for(const q of ['ร่างบันทึกขอห้องประชุมพร้อมอุปกรณ์และอาหาร','ร่างบันทึกขอห้องประชุม และตรวจสิทธิเบิก','ร่างบันทึกขอห้องประชุม และทำแผนอบรม','ร่างบันทึกขอห้องประชุม และทำสไลด์','ร่างรายงานสอบละเมิดรถชนห้องประชุม','ขอวิธีจองห้องประชุม'])assert.doesNotMatch(complete('BASE',q),/GP_ROOM_MEMO_SCAFFOLD_V1/);
});

test('missing room rationale is a literal fixed value, not another editable memo slot',()=>{
 for(const q of ['จัดทำบันทึกข้อความขอใช้ห้องประชุมทบทวนขั้นตอนบริการ 20 คน ไม่ใช้งบเพิ่ม',JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json')).find(x=>x.id==='GP01-E').input]){
  const p=complete('BASE\n'+q,q);assert.ok(p.startsWith('BASE\n'+q));
  assert.match(p,/เรื่องเดิม\/ข้อพิจารณาขาดให้คง \[รอตรวจสอบ\] เป็นค่าคงที่ คัดลอกตรง/);
  assert.match(p,/รวมชื่อและตำแหน่งผู้ลงนามคัดลอกตามแบบ/);assert.match(p,/ห้ามแทนด้วยจุดไข่ปลาหรือเพิ่มเส้นลงนาม/);
 }
});
test('explicitly supplied rationale remains available rather than being frozen as unknown',()=>{
 for(const q of ['ร่างบันทึกขอห้องประชุม เหตุผล: ห้องเดิมปิดซ่อม','ร่างบันทึกขอห้องประชุม เรื่องเดิม: นัดทบทวนขั้นตอนบริการ','ร่างบันทึกขอห้องประชุม เนื่องจากต้องทบทวนขั้นตอนบริการ']){
  const p=complete('BASE\n'+q,q);assert.ok(p.startsWith('BASE\n'+q));assert.match(p,/ใช้ต้นทาง/);assert.match(p,/เรื่องเดิม\/ข้อพิจารณาขาดให้คง/);assert.doesNotMatch(p,/เรื่องเดิมและข้อพิจารณาทุกกรณีเป็นค่าคงที่/);
 }
});
