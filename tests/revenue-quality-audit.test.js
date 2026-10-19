import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {revenueGuidance} from '../src/revenue-guidance.js';

const sandbox={window:{}};
for(const path of ["assets/js/core/shared-context.js","assets/js/core/prompt-orchestrator.js","assets/js/core/tool-routing-policy.js","assets/js/core/prompt-registry.js","assets/js/core/transaction-router.js"]) {
  vm.runInNewContext(await readFile(new URL('../'+path,import.meta.url),'utf8'),sandbox);
}
const core=sandbox.window.GovPromptCore;
// Synthetic contract cases: these are not downstream AI answers or live transactions.
const cases=[
  {
    "id": "R01-1",
    "domain": "land-building",
    "route": "GP002",
    "kind": "general",
    "question": "เทศบาลต้องตรวจข้อมูลอะไรบ้างก่อนประเมินภาษีที่ดินและสิ่งปลูกสร้าง"
  },
  {
    "id": "R01-2",
    "domain": "land-building",
    "route": "GP002",
    "kind": "current",
    "question": "อบต. จะใช้อัตราภาษีที่ดินปี 2570 ต้องตรวจฉบับใด"
  },
  {
    "id": "R01-3",
    "domain": "land-building",
    "route": "GP002",
    "kind": "lock",
    "question": "อบจ. ขอคำนวณภาษีที่ดินทันทีแต่ไม่มีฐานภาษีและปีภาษี"
  },
  {
    "id": "R02-1",
    "domain": "sign",
    "route": "GP002",
    "kind": "general",
    "question": "อบต. ต้องตรวจประเภทและขนาดป้ายก่อนประเมินภาษีป้ายอย่างไร"
  },
  {
    "id": "R02-2",
    "domain": "sign",
    "route": "GP002",
    "kind": "current",
    "question": "เทศบาลตรวจอัตราภาษีป้ายฉบับปัจจุบันและข้อยกเว้น"
  },
  {
    "id": "R02-3",
    "domain": "sign",
    "route": "GP002",
    "kind": "lock",
    "question": "คำนวณภาษีป้ายให้เลย ไม่มีขนาดหรือภาพป้าย"
  },
  {
    "id": "R03-1",
    "domain": "hotel",
    "route": "GP002",
    "kind": "general",
    "question": "ภาษีผู้เข้าพักโรงแรมของ อบจ. ต้องตรวจอะไรบ้าง"
  },
  {
    "id": "R03-2",
    "domain": "hotel",
    "route": "GP002",
    "kind": "current",
    "question": "ตรวจข้อบัญญัติภาษีผู้เข้าพักโรงแรมและอัตราปัจจุบันของ อบจ."
  },
  {
    "id": "R03-3",
    "domain": "hotel",
    "route": "GP002",
    "kind": "lock",
    "question": "เทศบาลขอเก็บภาษีผู้เข้าพักโรงแรมทันที ไม่มีข้อบัญญัติ"
  },
  {
    "id": "R04-1",
    "domain": "fuel-tobacco",
    "route": "GP002",
    "kind": "general",
    "question": "รายได้ อบจ. จากน้ำมัน ก๊าซ และยาสูบต้องตรวจอำนาจอย่างไร"
  },
  {
    "id": "R04-2",
    "domain": "fuel-tobacco",
    "route": "GP002",
    "kind": "current",
    "question": "ตรวจข้อบัญญัติ อบจ. เรื่องน้ำมัน ก๊าซ และยาสูบฉบับปัจจุบัน"
  },
  {
    "id": "R04-3",
    "domain": "fuel-tobacco",
    "route": "GP002",
    "kind": "lock",
    "question": "อบต. ขอเก็บภาษีน้ำมัน ก๊าซ และยาสูบทันทีโดยไม่มีหลักฐาน"
  },
  {
    "id": "R05-1",
    "domain": "assessment-appeal",
    "route": "GP002",
    "kind": "general",
    "question": "ประชาชนจะอุทธรณ์ภาษีต้องเตรียมเอกสารอะไร"
  },
  {
    "id": "R05-2",
    "domain": "assessment-appeal",
    "route": "GP002",
    "kind": "current",
    "question": "ตรวจขั้นตอนอุทธรณ์ภาษีตามกฎหมายฉบับปัจจุบัน"
  },
  {
    "id": "R05-3",
    "domain": "assessment-appeal",
    "route": "GP002",
    "kind": "lock",
    "question": "ฟันธงว่ายังอุทธรณ์ภาษีได้ไหม ไม่มีวันรับแจ้งประเมิน"
  },
  {
    "id": "R06-1",
    "domain": "arrears",
    "route": "GP005",
    "kind": "general",
    "question": "เทศบาลจะเร่งรัดภาษีค้างชำระอย่างไร"
  },
  {
    "id": "R06-2",
    "domain": "arrears",
    "route": "GP005",
    "kind": "current",
    "question": "ตรวจเบี้ยปรับภาษีและเงินเพิ่มภาษีที่ใช้บังคับปีนี้"
  },
  {
    "id": "R06-3",
    "domain": "arrears",
    "route": "GP005",
    "kind": "lock",
    "question": "ภาษีค้างหลายปี ขอใช้อำนาจยึดทรัพย์ทันที ไม่มียอดหรือหลักฐานแจ้ง"
  },
  {
    "id": "R07-1",
    "domain": "tax-map",
    "route": "GP002",
    "kind": "general",
    "question": "อบต. วางแผนสำรวจทรัพย์สินและปรับปรุงแผนที่ภาษีอย่างไร"
  },
  {
    "id": "R07-2",
    "domain": "tax-map",
    "route": "GP002",
    "kind": "current",
    "question": "ตรวจคู่มือแผนที่ภาษีและสำรวจทรัพย์สินฉบับปัจจุบัน"
  },
  {
    "id": "R07-3",
    "domain": "tax-map",
    "route": "GP002",
    "kind": "lock",
    "question": "นำทะเบียนแผนที่ภาษีที่มีเลขประชาชนไปเผยแพร่ทั้งหมดได้ไหม"
  },
  {
    "id": "R08-1",
    "domain": "ltax",
    "route": "GP002",
    "kind": "general",
    "question": "LTAX GIS และ LTAX ONLINE ใช้ตรวจข้อมูลก่อนประเมินอย่างไร"
  },
  {
    "id": "R08-2",
    "domain": "ltax",
    "route": "GP002",
    "kind": "current",
    "question": "ตรวจคู่มือ LTAX ONLINE ฉบับตรงรุ่นปัจจุบัน"
  },
  {
    "id": "R08-3",
    "domain": "ltax",
    "route": "GP002",
    "kind": "lock",
    "question": "แก้ข้อมูล LTAX ให้เลย ไม่ทราบรุ่นและไม่มีสิทธิระบบ"
  },
  {
    "id": "R09-1",
    "domain": "elaas",
    "route": "GP005",
    "kind": "general",
    "question": "New e-LAAS ต้องเตรียมอะไรเพื่อบันทึกรายรับภาษี"
  },
  {
    "id": "R09-2",
    "domain": "elaas",
    "route": "GP005",
    "kind": "current",
    "question": "ตรวจคู่มือ New e-LAAS และประเภทรายรับฉบับปัจจุบัน"
  },
  {
    "id": "R09-3",
    "domain": "elaas",
    "route": "GP005",
    "kind": "lock",
    "question": "บันทึกรายรับภาษีใน e-LAAS ให้เลย ไม่มีใบเสร็จหรือยอดรับ"
  },
  {
    "id": "R10-1",
    "domain": "documents",
    "route": "GP001",
    "kind": "general",
    "question": "ช่วยร่างหนังสือแจ้งภาษีโดยใช้ช่องว่างเฉพาะข้อมูลที่ขาด"
  },
  {
    "id": "R10-2",
    "domain": "documents",
    "route": "GP001",
    "kind": "current",
    "question": "ช่วยร่างหนังสือแจ้งภาษี ตรวจแบบฟอร์มและกฎหมายปัจจุบันก่อน"
  },
  {
    "id": "R10-3",
    "domain": "documents",
    "route": "GP001",
    "kind": "lock",
    "question": "ช่วยร่างหนังสือแจ้งภาษีและใส่ยอดเอง ไม่มีข้อมูลผู้เสียภาษี"
  }
];
for(const c of cases) test('revenue quality '+c.id+' '+c.kind,()=>{
  const g=revenueGuidance(c.question);
  assert.equal(g?.domain,c.domain,c.question);
  assert.equal(g.decisionLock,true);
  assert.ok(g.missingEvidence.length>0);
  assert.equal(g.mode,'guidance-only');
  const p=core.planUniversalTask(c.question);
  assert.equal(p.riskLevel,'HIGH');
  for(const gate of ['evidenceRequired','legalVersionRequired','decisionRequired']) assert.equal(p.qualityGates[gate],true);
  assert.equal(p.applicableAuthorityCheck.required,true);
  assert.equal(p.applicableAuthorityCheck.decisionLock,'ON');
  assert.equal(p.evidenceMode,'verify-applicable-primary-source');
  const route=core.routeRequest(c.question);
  assert.equal(route.primaryModule,c.route);
  const t=core.createToolRoutingPlan({question:c.question});
  assert.equal(t.mode,'web-when-needed');
  assert.equal(t.flags.needsPrimarySource,true);
  const bundle=core.createGovernmentPrompt({question:c.question,route});
  assert.ok(bundle.prompt.includes(c.question));
  assert.match(bundle.prompt,/Answer First/);
  assert.match(bundle.prompt,/ห้ามแต่ง/);
  assert.match(g.instructions.join(' '),/อำนาจจัดเก็บภาษี/);
  assert.match(g.instructions.join(' '),/เจ้าหน้าที่ตรวจสอบ/);
  if(c.domain==='documents') {
    assert.equal(p.action,'draft');
    assert.match(bundle.prompt,/ร่าง/);
    assert.match(bundle.prompt,/ข้อมูล.*ขาด|ข้อมูล.*ไม่พอ|ระบุ|ยังไม่/);
  }
});

test('PAO hotel menu wording and fee alias receive the same protections',()=>{
  for(const q of ['ตรวจภาษีจากผู้เข้าพักในโรงแรมขององค์การบริหารส่วนจังหวัด','ค่าธรรมเนียมบำรุง อบจ. จากผู้พักในโรงแรม']) {
    assert.equal(revenueGuidance(q)?.domain,'hotel');
    assert.equal(core.planUniversalTask(q).riskLevel,'HIGH');
    assert.equal(core.routeRequest(q).primaryModule,'GP002');
    assert.equal(core.createToolRoutingPlan({question:q}).flags.needsPrimarySource,true);
  }
});
test('each commodity is scoped to revenue, never a permanent rate or assumed PAO power',()=>{
  for(const item of ['น้ำมัน','ก๊าซ','ก๊าส','ยาสูบ']) {
    const q='ตรวจรายได้ อบจ. จาก'+item;
    const g=revenueGuidance(q);
    assert.equal(g?.domain,'fuel-tobacco');
    assert.equal(core.planUniversalTask(q).qualityGates.decisionRequired,true);
    assert.equal(core.createToolRoutingPlan({question:q}).flags.needsPrimarySource,true);
    assert.match(g.instructions.join(' '),/จัดเก็บเองหรือจัดสรร/);
  }
});
test('mixed revenue retains all applicable evidence and explicit document/appeal routes',()=>{
  const g=revenueGuidance('ภาษีผู้เข้าพักโรงแรมและรายได้จากยาสูบ');
  assert.ok(g.relatedDomains.includes('hotel'));
  assert.ok(g.relatedDomains.includes('fuel-tobacco'));
  assert.ok(g.missingEvidence.includes('ชนิดสินค้าและลักษณะรายได้'));
  assert.equal(core.routeRequest('ช่วยร่างหนังสือแจ้งภาษีผู้เข้าพักโรงแรม').primaryModule,'GP001');
  assert.equal(core.routeRequest('อุทธรณ์ภาษีผู้เข้าพักโรงแรม').primaryModule,'GP002');
});
test('new PAO domains do not classify unrelated purchases, meetings or PR as revenue',()=>{
  for(const q of ['ร่าง TOR จัดซื้อน้ำมันเชื้อเพลิง','จองโรงแรมประชุม','ทำข่าวรณรงค์งดสูบบุหรี่']) assert.equal(revenueGuidance(q),null);
});
