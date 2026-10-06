import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const sandbox = { window: {}, location: { pathname: '/index.html' } };
for (const name of ['shared-context','prompt-registry','transaction-router','output-router','prompt-orchestrator']) {
  vm.runInNewContext(readFileSync(`assets/js/core/${name}.js`, 'utf8'), sandbox);
}
const core = sandbox.window.GovPromptCore;
const cases = [
  ['โครงการอาหารปลอดภัย กินดีชีวีมีสุข ใช้เงินบำรุง', /ห้ามพาไปเพิ่มเติม\/เปลี่ยนแปลงแผนพัฒนาท้องถิ่นโดยอัตโนมัติ/],
  ['โครงการส่งเสริมสุขภาพ ใช้เงินบำรุง', /ห้ามส่งสภาเพียงเพราะเป็นโครงการ/],
  ['ซื้อเครื่องมือแพทย์ด้วยเงินบำรุง', /จำแนกวัสดุ\/ครุภัณฑ์ก่อน/],
  ['ซ่อมหลังคาหน่วยบริการด้วยเงินบำรุง', /ห้ามถือว่าเป็นสิ่งก่อสร้างอัตโนมัติ/],
  ['ก่อสร้างอาคารหน่วยบริการใหม่ด้วยเงินบำรุง', /ผู้บริหารท้องถิ่นให้ความเห็นชอบ → สภาองค์กรปกครองส่วนท้องถิ่นอนุมัติ/],
  ['โครงการอาหารปลอดภัย ใช้งบประมาณ อปท.', /งบประมาณรายจ่ายของ อปท. → หยุด Workflow เงินบำรุง/],
  ['หน่วยบริการจะทำโครงการอาหารปลอดภัย', /รายการนี้ใช้เงินบำรุงของหน่วยบริการ งบประมาณของ อปท. หรือเงินจากแหล่งอื่น\?/],
  ['รพ.สต.มีเงินบำรุง 250,000 บาท จะซื้อครุภัณฑ์ 100,000 บาท', /เหลือ 150,000 ต่ำกว่า 200,000 → Decision Lock/]
];
for (const agency of ['อบจ.', 'เทศบาล', 'อบต.']) for (const [q, rule] of cases) {
  test(`${agency} generated downstream prompt: ${q}`, () => {
    const question = `${agency} ${q}`;
    const context = core.createSharedContext({ facts: question });
    const result = core.createGovernmentPrompt({ question, context, route: core.routeTransaction(context) });
    assert.match(result.prompt, /SOURCE OF FUNDS FIRST/);
    assert.match(result.prompt, rule);
    assert.match(result.prompt, /Official Source \/ Authority \/ Version \/ Evidence/);
    assert.match(result.prompt, /หากระบุแหล่งเงินแล้วห้ามถามซ้ำ/);
  });
}
test('unrelated tasks do not get health policy; health page and fund-specific work do', () => {
  assert.equal(core.buildHealthFundingInstructions('ร่างคำกล่าววันเด็ก'), '');
  assert.match(core.buildHealthFundingInstructions('ซื้อโต๊ะ', { healthContext: true }), /SOURCE OF FUNDS FIRST/);
  assert.match(core.buildHealthFundingInstructions('สอน. ใช้เงินกองทุน'), /ตรวจเงื่อนไขและกฎของแหล่งเงินนั้นก่อน/);
  assert.match(readFileSync('gp008.html','utf8'), /buildHealthFundingInstructions/);
});
