import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/js/core/assistance-route-v1.js', 'utf8');
const context = { window: {}, console };
vm.runInNewContext(source, context, { filename: 'assistance-route-v1.js' });
const core = context.window.GovPromptCore;

const scenarios = [
  {
    name: 'น้ำท่วม/ตรวจสิทธิและวงเงิน',
    query: 'น้ำท่วม ต้องการตรวจสิทธิและวงเงินช่วยเหลือประชาชน',
    rule: 'MOI-ASSIST-2566-19-1',
    authority: 'กระทรวงการคลัง',
    disaster: true,
    lock: true,
    source: 'MOF-DISASTER-2569'
  },
  {
    name: 'โรคติดต่อ/ตรวจสิทธิ',
    query: 'กรณีโรคติดต่อ ต้องการตรวจสิทธิและหลักเกณฑ์การช่วยเหลือ',
    rule: 'MOI-ASSIST-2566-19-3',
    authority: 'กระทรวงมหาดไทย หรือกระทรวงสาธารณสุข',
    disaster: false,
    lock: true
  },
  {
    name: 'คุณภาพชีวิต/ตรวจสิทธิ',
    query: 'ผู้ยากไร้ต้องการตรวจสิทธิการช่วยเหลือด้านคุณภาพชีวิต',
    rule: 'MOI-ASSIST-2566-19-2',
    authority: 'กระทรวงมหาดไทย หรือกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์',
    disaster: false,
    lock: true
  },
  {
    name: 'เกษตรกรรายได้น้อย/ตรวจสิทธิ',
    query: 'เกษตรกรผู้มีรายได้น้อยต้องการตรวจสิทธิช่วยเหลือผลผลิตเสียหาย',
    rule: 'MOI-ASSIST-2566-19-4',
    authority: 'กระทรวงมหาดไทย หรือกระทรวงเกษตรและสหกรณ์',
    disaster: false,
    lock: true
  }
];

for (const scenario of scenarios) {
  const route = core.detectAssistanceRoute(scenario.query);
  assert.ok(route, scenario.name + ': route not detected');
  assert.equal(route.authorityRule, scenario.rule, scenario.name + ': authority rule mismatch');
  assert.equal(route.criteriaAuthority, scenario.authority, scenario.name + ': criteria authority mismatch');
  assert.equal(route.disaster, scenario.disaster, scenario.name + ': disaster flag mismatch');
  assert.equal(route.decisionLock, scenario.lock, scenario.name + ': decision lock mismatch');
  if (scenario.source) assert.ok(route.legalBase.includes(scenario.source), scenario.name + ': required source missing');

  const block = core.buildAssistancePromptBlock(route);
  assert.match(block, /AUTHORITY → VERSION → TIME → FACT_MATCH → LATER_CHANGE → CONFLICT_TRANSITION/);
  assert.match(block, /ห้าม hard-code/);
  assert.match(block, /ข้อมูลที่ยังขาด/);
}

console.log('Assistance Route real-world scenario simulation: PASS (4/4)');
