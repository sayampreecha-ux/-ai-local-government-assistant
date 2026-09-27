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

console.log('Emergency Procurement Gate regression: PASS');
