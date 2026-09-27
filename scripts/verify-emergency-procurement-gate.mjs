import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const assistanceSource = fs.readFileSync('assets/js/core/assistance-route-v1.js','utf8');
const gateSource = fs.readFileSync('assets/js/core/emergency-procurement-gate-v1.js','utf8');
const context = vm.createContext({ window: {}, console });
vm.runInContext(assistanceSource, context, { filename: 'assistance-route-v1.js' });
vm.runInContext(gateSource, context, { filename: 'emergency-procurement-gate-v1.js' });

const core = context.window.GovPromptCore;
assert.equal(core.EMERGENCY_PROCUREMENT_GATE_VERSION, '1.1.0');

const route = core.detectAssistanceRoute('อุทกภัย น้ำท่วม ต้องจัดซื้อกระสอบทราย วงเงิน 300,000 บาท เร่งด่วน');
assert.ok(route, 'assistance route must be detected');
assert.ok(route.emergencyProcurementGate, 'emergency procurement gate must attach');
assert.equal(route.emergencyProcurementGate.decisionLock, true);
assert.equal(route.emergencyProcurementGate.amountBand, 'LE_500K');
assert.match(route.emergencyProcurementGate.candidateBases.join(' '), /ม\\.56\\(2\\)\\(ข\\)/);
assert.match(route.emergencyProcurementGate.candidateBases.join(' '), /ข้อ 2\\(5\\)/);

const block = core.buildAssistancePromptBlock(route);
assert.match(block, /EMERGENCY PROCUREMENT DECISION GATE/);
assert.match(block, /e-GP/);
assert.match(block, /แบ่งซื้อแบ่งจ้าง/);
assert.match(block, /Decision Lock/);

const nonProcurement = core.detectEmergencyProcurementGate('ประชาชนประสบอุทกภัย ต้องการความช่วยเหลือ');
assert.equal(nonProcurement, null);


const realWorldCases = [
  { name: 'จัดทำถุงยังชีพ', prompt: 'สถานการณ์น้ำท่วม จัดทำถุงยังชีพ วงเงิน 200,000 บาท ต้องดำเนินการเร่งด่วน' },
  { name: 'จัดซื้อวัสดุทำกระสอบทราย', prompt: 'สถานการณ์น้ำท่วม จัดซื้อวัสดุทำกระสอบทราย วงเงิน 300,000 บาท เร่งด่วน' },
  { name: 'จัดซื้อเครื่องสูบน้ำ', prompt: 'สถานการณ์น้ำท่วม จัดซื้อเครื่องสูบน้ำ วงเงิน 450,000 บาท เร่งด่วน' },
  { name: 'ซ่อมแซมถนน', prompt: 'สถานการณ์น้ำท่วม จ้างซ่อมแซมถนนที่เสียหาย วงเงิน 500,000 บาท เร่งด่วน' }
];

for (const item of realWorldCases) {
  const caseRoute = core.detectAssistanceRoute(item.prompt);
  assert.ok(caseRoute, item.name + ': assistance route must be detected');
  assert.ok(caseRoute.emergencyProcurementGate, item.name + ': emergency procurement gate must attach');
  assert.equal(caseRoute.emergencyProcurementGate.decisionLock, true, item.name + ': decision lock must remain on');
  assert.match(core.buildAssistancePromptBlock(caseRoute), /EMERGENCY PROCUREMENT DECISION GATE/);
}

console.log('Emergency Procurement Gate regression: PASS');
