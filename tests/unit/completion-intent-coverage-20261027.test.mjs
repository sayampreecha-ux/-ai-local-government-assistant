import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const home=readFileSync('assets/js/home-v3.js','utf8');
const start=home.indexOf('  function completeDocumentHandoff(');
const end=home.indexOf('\n  function addRouteResult',start);
assert.ok(start>=0&&end>start);
const context={};
vm.runInNewContext(home.slice(start,end)+';this.complete=completeDocumentHandoff;',context);
const base='CANONICAL SOURCE\nEvidence Gate / Legal Version Gate / Decision Lock / Human Review';
for(const q of [
 'จัดทำความเห็นทางกฎหมายเรื่องการโอนข้าราชการ ยังไม่มีหลักเกณฑ์ต้นฉบับ ห้ามเดาระยะเวลา',
 'จัดทำแผนรณรงค์ลดแหล่งเพาะพันธุ์ยุง 4 สัปดาห์ 5 ชุมชน ไม่มีข้อมูลผู้ป่วย',
 'จัดทำกำหนดการอบรมเยาวชน 09.00–16.00 พัก 12.00–13.00 ไม่ใช้ชื่อจริง'
])test('creation receives completion instructions: '+q,()=>{
 const result=context.complete(base,q);
 assert.ok(result.startsWith(base));
 assert.ok(result.includes('[GP_DELIVERABLE_HANDOFF_V1]'));
 assert.match(result,/ชิ้นงานฉบับเต็ม/);
 assert.match(result,/Decision Lock/);
 assert.match(result,/ห้ามทำลิงก์ดาวน์โหลดปลอม/);
 assert.equal(context.complete(result,q),result,'completion must be idempotent');
});
for(const q of ['ทำไมต้องทำแผน','อธิบายการจัดทำแผนสุขภาพ','ขอคำแนะนำเกี่ยวกับกำหนดการ','ไม่ต้องจัดทำแผน ขอคำอธิบาย','ช่วยอธิบายการร่างความเห็น'])test('advice/refusal remains unchanged: '+q,()=>assert.equal(context.complete(base,q),base));
