import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const src=readFileSync(new URL('../../assets/js/home-v3.js',import.meta.url),'utf8');
const start=src.indexOf('  function completeTortLevel1Handoff(');
const end=src.indexOf('  function addRouteResult(',start);
assert.ok(start!==-1 && end>start,'handoff must exist in actual home rendering source');
const snippet=src.slice(start,end);
function handoff(prompt,request){
 const ctx={};vm.runInNewContext(snippet+';this.applyTort=completeTortLevel1Handoff;',ctx);
 return ctx.applyTort(prompt,request);
}
const scenarios=[
'สอบละเมิดเจ้าหน้าที่','ความรับผิดทางละเมิดของเจ้าหน้าที่','รถราชการชนเสียหาย',
'คำสั่งเรียกชดใช้','แต่งตั้งกรรมการสอบสวนละเมิด',
];
for(const q of scenarios)test('home output handoff '+q,()=>{
 const v=handoff('BASE',q);
 assert.match(v,/GP_TORT_LEVEL1_HANDOFF_V1/);
 assert.match(v,/ว66\/ว141/);
 assert.match(v,/NOT VERIFIED/);
 assert.equal(handoff(v,q),v,'must not append handoff twice');
 assert.ok(v.includes('\n[GP_TORT_LEVEL1_HANDOFF_V1]'));
});
test('unrelated domain unchanged',()=>assert.equal(handoff('BASE','ร่างหนังสือเชิญประชุม'),'BASE'));
test('home actually invokes new handoff before rendering card',()=>{
 assert.match(src.slice(end,end+700),/promptBundle\.prompt, originalRequest/);
});

test('regression: simulated assertions cannot become verified facts',()=>{
 const v=handoff('BASE','สอบละเมิดรถราชการชนคู่กรณี ข้อมูลจำลอง');
 for(const token of ['UNVERIFIED','Verified Facts','[รอตรวจสอบ]','ข้อกล่าวหา'])assert.ok(v.includes(token),token);
});
test('regression: prohibit invented component damage and unauthenticated evidence',()=>{
 const v=handoff('BASE','รถราชการชนคู่กรณี');
 for(const token of ['ชิ้นส่วนรถ','ใบอนุญาตใช้รถ','บันทึกตำรวจ','ห้ามแต่ง'])assert.ok(v.includes(token),token);
});
test('regression: prohibit pretending an inquiry already happened',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 for(const token of ['ยังไม่ได้สอบสวน','คณะกรรมการได้สอบสวนแล้ว','ลายมือชื่อ'])assert.ok(v.includes(token),token);
});
test('regression: prohibit automatic legal duty and negligence findings',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 for(const token of ['การกระทำในการปฏิบัติหน้าที่ตามกฎหมาย','ประมาทเลินเล่ออย่างร้ายแรง','ผู้มีอำนาจแต่งตั้ง'])assert.ok(v.includes(token),token);
});
test('regression: prohibit fabricated regulatory titles or accrued limitation start',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 for(const token of ['ห้ามตั้งชื่อระเบียบขึ้นเอง','วันเริ่มนับอายุความ','NOT VERIFIED'])assert.ok(v.includes(token),token);
});
test('regression: preserve seven deliverables, decision lock, human and PDPA gate',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 for(const token of ['ร่างเอกสาร 7 ส่วน','ว66/ว141','Human Review','HUMAN REVIEW CHECKLIST','ปกปิดข้อมูลส่วนบุคคล'])assert.ok(v.includes(token),token);
});

test('legal accuracy: exact official PMO regulation title and no shorter wrong title',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 assert.ok(v.includes('ระเบียบสำนักนายกรัฐมนตรีว่าด้วยหลักเกณฑ์การปฏิบัติเกี่ยวกับความรับผิดทางละเมิดของเจ้าหน้าที่ พ.ศ. 2539'));
 assert.ok(v.includes('ห้ามเรียกว่า ระเบียบนายกรัฐมนตรี'));
 assert.ok(v.includes('การให้ชื่อตรงไม่ใช่การรับรองว่าได้ตรวจฉบับปัจจุบันแล้ว'));
});
test('legal accuracy: no blanket clause 8/9 and PAO appointing authority assumptions',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 for(const token of ['ห้ามอ้างข้อ 8 และข้อ 9 คู่กัน','ข้อ 12/1','[รอตรวจสอบโดยนิติกร]','ห้ามร่างคำสั่งในรูปพร้อมลงนาม'])assert.ok(v.includes(token),token);
});
test('legal accuracy: unverified incident uses notification not established finding',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 assert.ok(v.includes('ได้รับรายงานเบื้องต้นว่า'));
 assert.ok(v.includes('ห้ามใช้ ปรากฏข้อเท็จจริงว่า'));
 assert.ok(v.includes('ปรากฏข้อเท็จจริงเบื้องต้นว่า'));
});
test('legal accuracy: self-certified reviewed checkboxes prohibited',()=>{
 const v=handoff('BASE','สอบละเมิดเจ้าหน้าที่');
 for(const token of ['[ ]','ห้าม AI ทำเครื่องหมาย [x]','NOT VERIFIED','แหล่งต้นฉบับ'])assert.ok(v.includes(token),token);
});
