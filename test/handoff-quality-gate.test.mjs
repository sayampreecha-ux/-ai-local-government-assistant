import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const home = readFileSync('assets/js/home-v3.js','utf8');
const start = home.indexOf('  function enforceHandoffQuality(');
const end = home.indexOf('  function completeDocumentHandoff(', start);
assert.ok(start !== -1 && end > start);
const quality = vm.runInNewContext('(' + home.slice(start,end).trim() + ')');
const fixture = JSON.parse(readFileSync('tests/fixtures/acceptance-65-20261026.json','utf8'));
const cases = ['GP01-E','GP04-A','GP05-E','GP07-E','GP08-A','GP08-E','GP10-C','GP10-D','GP13-A'];
for (const id of cases) {
 test('QA60 quality handoff '+id, () => {
  const input = fixture.find(x=>x.id===id)?.input;
  assert.ok(input,'fixture missing: '+id);
  const original='BASE PROMPT\n'+input;
  const actual=quality(original,input);
  assert.ok(actual.startsWith(original),'original request preserved');
  assert.match(actual,/\[GP_HANDOFF_QUALITY_V1\]/);
  assert.match(actual,/\[รอตรวจสอบ\]/);
  assert.match(actual,/ข้อเสนอ/);
  assert.equal(quality(actual,input),actual,'idempotent');
  if(id==='GP04-A'||id==='GP13-A') {
    assert.match(actual,/cached formula values\/recalculation/);
    assert.match(actual,/ยอดรับเงินจริง/);
  }
  if(id==='GP10-C'||id==='GP10-D') assert.match(actual,/เริ่มสอบสวน/);
 });
}
for (const input of ['สวัสดี','ขอคำอธิบายรายได้คืออะไร','ทำไมต้องมีบันทึกข้อความ','ต้องตรวจสอบกฎหมายอะไร','มีอำนาจจัดอบรมไหม']) {
 test('non-creation prompts stay unchanged: '+input,()=>assert.equal(quality('BASE',input),'BASE'));
}
test('does not invent output file or imply it was reviewed',()=>{
 const output=quality('BASE','สร้าง XLSX ตารางค่าใช้จ่ายจำลอง');
 assert.match(output,/ถ้าตรวจไฟล์จริงไม่ได้ให้แจ้ง NOT VERIFIED/);
 assert.doesNotMatch(output,/สร้างไฟล์แล้ว/);
});
