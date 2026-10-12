import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const files = [
  'shared-context.js', 'prompt-registry.js', 'transaction-router.js',
  'hybrid-intent-classifier.js', 'hybrid-real-world-overrides.js',
  'tool-routing-policy.js', 'agent-governance-policy.js',
  'output-router.js', 'prompt-orchestrator.js'
];
const sandbox = vm.createContext({window: {}, document: {addEventListener() {}}, location: {pathname: '/index.html'}, console});
for (const file of files) vm.runInContext(fs.readFileSync('assets/js/core/' + file, 'utf8'), sandbox);
delete sandbox.document;
vm.runInContext(fs.readFileSync('assets/js/ui/status-copy.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;
const status = sandbox.window.GovPromptStatusCopy;
const legal = [
  'ป.ป.ช. ไต่สวนและชี้มูลภายใน 2 ปี ผู้บังคับบัญชาต้องดำเนินการอย่างไร',
  'ป.ป.ช. ขยายระยะเวลาไต่สวนจาก 2 ปีเป็น 3 ปี ต้องมีเงื่อนไขและหลักฐานใด',
  'ป.ป.ช. ชี้มูลเกิน 3 ปี ผู้บังคับบัญชาต้องผูกพันตามสำนวนหรือไม่ และยังดำเนินการทางวินัยได้หรือไม่',
  'ผู้ถูกกล่าวหาพ้นราชการก่อน ป.ป.ช. มีมติชี้มูล ต้องดำเนินการอย่างไร',
  'ป.ป.ช. ชี้มูลข้าราชการ อบจ. ผู้มีอำนาจดำเนินการทางวินัยคือใคร ต้องใช้กฎหมายและหลักเกณฑ์ใด',
  'ไม่มีหลักฐานวันเริ่มไต่สวน วันขยายเวลา หรือวันพ้นราชการ ระบบต้องใช้ Decision Lock และไม่สรุปผลเกินหลักฐาน'
];
function build(question) {
  const context = core.createSharedContext({facts: question, desiredOutput: question});
  return core.createGovernmentPrompt({question, context, route: core.routeTransaction(context)});
}
for (const [index, question] of legal.entries()) {
  test(`TC0${index + 1} detects disciplinary review and keeps authority locked`, () => {
    const result = build(question);
    assert.equal(result.taskPlan.riskLevel, 'HIGH');
    assert.ok(result.taskPlan.disciplines.includes('legal'));
    assert.ok(result.taskPlan.disciplines.includes('human-resources'));
    assert.ok(!result.taskPlan.disciplines.includes('public-health'));
    assert.equal(result.taskPlan.applicableAuthorityCheck.mode, 'FULL');
    assert.equal(result.taskPlan.applicableAuthorityCheck.decisionLock, 'ON');
    assert.ok(['GP002', 'GP006'].includes(result.route.moduleId));
    assert.match(result.prompt, /Decision Gate: ON/);
    assert.match(result.prompt, /Legal Version Gate: ON/);
    assert.match(result.prompt, /Evidence Gate: ON/);
    assert.match(result.prompt, /แยกข้อเท็จจริง คำชี้แจงคู่กรณี ตัวบท เหตุผลของศาล และผลคำวินิจฉัย/);
    assert.match(result.prompt, /ห้ามสรุปว่าเกิน 3 ปีแล้วพ้นผิดโดยอัตโนมัติ/);
    assert.match(result.prompt, /ต่างประเทศ/);
    assert.match(result.prompt, /วันและเหตุพ้นราชการ/);
    assert.match(result.prompt, /ก\.จ\.\/ก\.จ\.จ\./);
    assert.equal(core.buildAuthorityPolicy(question).recommendedMode, 'web-when-needed');
  });
}
for (const [amount, question] of [
  ['100,000', 'วิเคราะห์ระเบียบพัสดุ การจัดซื้อวัสดุสำนักงานวงเงิน 100,000 บาท ของ อบจ. ต้องใช้วิธีใดและตรวจฐานอำนาจก่อนสรุป'],
  ['300,000', 'จัดทำ TOR จ้างบริการระบบตอบรับโทรศัพท์ AI ของ อบจ. วงเงิน 300,000 บาท ระยะเวลา 1 ปี พร้อมผลส่งมอบและเกณฑ์ตรวจรับ'],
  ['20,000', 'จัดทำโครงการอบรมการใช้ AI สำหรับบุคลากร อบจ. จำนวน 30 คน ระยะเวลา 1 วัน งบประมาณ 20,000 บาท พร้อมวัตถุประสงค์ กิจกรรม ตัวชี้วัด และประเมินผล'],
  ['1,234,567', 'วิเคราะห์ระเบียบการเบิกวงเงิน 1,234,567 บาท ของ อบจ. ต้องใช้ฐานใด']
]) {
  test(`authority extraction and search preserve amount ${amount}`, () => {
    const result = build(question);
    const gate = result.casePrecedentGate;
    assert.ok(gate);
    assert.ok(JSON.stringify(gate.fingerprint).includes(amount));
    const queries = result.prompt.split('\n').filter(line => /- Query \d:/.test(line));
    assert.ok(queries.length);
    assert.ok(queries.every(line => line.includes(amount)), queries.join('\n'));
    assert.ok(!result.prompt.includes('\u2060'));
  });
}
test('official letter in Phayao does not acquire a medication discipline', () => {
  const result = build('ร่างหนังสือราชการของ อบจ.พะเยา ขอเชิญหัวหน้าส่วนราชการประชุม วันที่ 20 ตุลาคม 2569 เวลา 09.00 น. ให้เว้นชื่อผู้ลงนาม');
  assert.ok(result.taskPlan.disciplines.includes('records'));
  assert.ok(!result.taskPlan.disciplines.includes('public-health'));
});
test('actual medication and public health requests retain their discipline', () => {
  for (const question of ['จัดซื้อยาและเวชภัณฑ์ให้ รพ.สต.', 'วิเคราะห์ค่ายารักษาโรค', 'เบิกยา ได้ไหม']) {
    assert.ok(build(question).taskPlan.disciplines.includes('public-health'), question);
  }
});
test('PDF evidence URL does not become document formatting intent', () => {
  assert.equal(status.isDocumentFormattingQuestion(legal[0] + ' https://ratchakitcha.soc.go.th/documents/134156.pdf'), false);
  assert.equal(status.isDocumentFormattingQuestion('ช่วยจัดหน้าเอกสาร PDF ให้เป็นทางการ'), true);
  assert.equal(status.isDocumentFormattingQuestion('ช่วยแปลงเอกสารเป็น PowerPoint'), true);
});
test('handoff uses canonical assembled prompt rather than a separate UI template', () => {
  const card = {};
  const canonical = build(legal[0]).prompt;
  core.canonicalHandoffPrompts = new WeakMap([[card, canonical]]);
  assert.equal(status.buildHandoffPrompt(card), canonical);
});
test('PK5 remains a document draft with source verification and human review', () => {
  const result = build('จัดทำ ปค.5 งานพัสดุ อบจ. ความเสี่ยงส่งมอบพัสดุล่าช้า มีการติดตามสัญญารายเดือน ให้แสดงช่องตามแบบและเว้นข้อมูลที่ยังไม่มี');
  assert.match(result.prompt, /เอกสารเป้าหมาย: ปค\.5/);
  assert.match(result.prompt, /ตรวจแบบราชการต้นฉบับ/);
  assert.match(result.prompt, /(?:ห้าม|ไม่)แต่งผลประเมิน/);
  assert.equal(result.taskPlan.applicableAuthorityCheck.mode, 'NONE');
});
