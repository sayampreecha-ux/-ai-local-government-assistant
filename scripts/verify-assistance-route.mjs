import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('assets/js/core/assistance-route-v1.js', 'utf8');
const context = { window: {}, console };
vm.runInNewContext(source, context, { filename: 'assistance-route-v1.js' });

const core = context.window.GovPromptCore;
assert.equal(core.ASSISTANCE_ROUTE_VERSION, '1.1.0');

const disaster = core.detectAssistanceRoute('น้ำท่วม ต้องการตรวจสิทธิและวงเงิน');
assert.equal(disaster.authorityRule, 'MOI-ASSIST-2566-19-1');
assert.equal(disaster.criteriaAuthority, 'กระทรวงการคลัง');
assert.equal(disaster.operationalAuthority, 'กรมป้องกันและบรรเทาสาธารณภัย');
assert.equal(disaster.decisionLock, true);
assert.ok(disaster.legalBase.includes('MOF-DISASTER-2569'));

const disease = core.detectAssistanceRoute('ขอความช่วยเหลือเพื่อป้องกันและควบคุมโรคติดต่อ');
assert.equal(disease.authorityRule, 'MOI-ASSIST-2566-19-3');
assert.equal(disease.criteriaAuthority, 'กระทรวงมหาดไทย หรือกระทรวงสาธารณสุข');

const farmer = core.detectAssistanceRoute('เกษตรกรผู้มีรายได้น้อยขอความช่วยเหลือผลผลิตเสียหาย');
assert.equal(farmer.authorityRule, 'MOI-ASSIST-2566-19-4');
assert.equal(farmer.criteriaAuthority, 'กระทรวงมหาดไทย หรือกระทรวงเกษตรและสหกรณ์');

const welfare = core.detectAssistanceRoute('ขอความช่วยเหลือด้านคุณภาพชีวิตสำหรับผู้ยากไร้');
assert.equal(welfare.authorityRule, 'MOI-ASSIST-2566-19-2');
assert.equal(welfare.criteriaAuthority, 'กระทรวงมหาดไทย หรือกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์');

assert.match(core.buildAssistancePromptBlock(disaster), /เจ้าของหลักเกณฑ์/);
assert.match(core.buildAssistancePromptBlock(disaster), /ห้าม hard-code/);
console.log('Assistance Route Authority Matrix regression: PASS');
