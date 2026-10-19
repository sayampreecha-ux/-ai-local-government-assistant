import test from 'node:test';
import assert from 'node:assert/strict';
import { REVENUE_DOMAINS, revenueGuidance } from '../src/revenue-guidance.js';
const samples = [
 ['land-building',['ภาษีที่ดิน','สิ่งปลูกสร้าง','ช่วยดูภาษีที่ดิน','ตรวจสิ่งปลูกสร้าง','คำนวณภาษีที่ดิน']],
 ['sign',['ภาษีป้าย','ประเภทป้าย','คำนวณภาษีป้าย','ตรวจภาษีป้าย','แจ้งภาษีป้าย']],
 ['assessment-appeal',['ประเมินภาษี','คัดค้านภาษี','อุทธรณ์ภาษี','ตรวจประเมินภาษี','ร่างอุทธรณ์ภาษี']],
 ['arrears',['ภาษีค้าง','เร่งรัดภาษี','เบี้ยปรับภาษี','เงินเพิ่มภาษี','ตรวจภาษีค้าง']],
 ['tax-map',['แผนที่ภาษี','สำรวจทรัพย์สิน','ตรวจแผนที่ภาษี','ช่วยสำรวจทรัพย์สิน','ข้อมูลแผนที่ภาษี']],
 ['ltax',['LTAX','ltax online','LTAX GIS','คู่มือ LTAX','แก้ปัญหา LTAX']],
 ['elaas',['e-LAAS','New e-LAAS','บันทึกรายรับ','คู่มือ e-LAAS','ตรวจ e-LAAS']],
 ['documents',['หนังสือแจ้งภาษี','บันทึกข้อความภาษี','แบบฟอร์มภาษี','ร่างหนังสือแจ้งภาษี','ตรวจแบบฟอร์มภาษี']]
];
for (const [domain, questions] of samples) {
  for (const question of questions) test(`${domain}: ${question}`, () => {
    const result = revenueGuidance(question);
    assert.equal(result?.domain, domain);
    assert.equal(result?.decisionLock, true);
    assert.equal(result?.mode, 'guidance-only');
    assert.ok(result.missingEvidence.length > 0);
    assert.ok(result.instructions.some(x=>x.includes('ห้ามสมมุติ')));
  });
}
test('unrelated tasks remain untouched',()=>assert.equal(revenueGuidance('ร่างหนังสือราชการทั่วไป'),null));
test('all verified evidence lifts only the evidence lock',()=>{
  const evidence=Object.fromEntries(REVENUE_DOMAINS[0].evidence.map(k=>[k,true]));
  const result=revenueGuidance('ภาษีที่ดิน',evidence);
  assert.equal(result.decisionLock,false);
  assert.equal(result.mode,'guidance-only');
});
test('missing question is inert',()=>assert.equal(revenueGuidance(null),null));

test('runtime integration imports the module and appends guidance without replacing route', async () => {
  const { readFile } = await import('node:fs/promises');
  const home = await readFile(new URL('../assets/js/home-v3.js', import.meta.url), 'utf8');
  assert.match(home, /await import\('\.\.\/\.\.\/src\/revenue-guidance\.js'\)/);
  assert.match(home, /const revenue = revenueGuidance\(text\)/);
  assert.match(home, /prompt: promptBundle\.prompt \+ '\\n\\n' \+ revenueBlock/);
  assert.match(home, /revenueGuidanceDomain: revenue\.domain/);
});
test('authority and external-system safety instructions remain mandatory', () => {
  const instructions = revenueGuidance('ภาษีที่ดิน').instructions.join(' ');
  assert.match(instructions, /อำนาจจัดเก็บภาษี/);
  assert.match(instructions, /ห้ามอ้างว่าเชื่อมต่อ LTAX/);
  assert.match(instructions, /ข้อมูลส่วนบุคคล/);
});
test('explicit source evidence does not imply live system connection', () => {
  const evidence = Object.fromEntries(REVENUE_DOMAINS[5].evidence.map(key => [key, true]));
  const result = revenueGuidance('LTAX ONLINE', evidence);
  assert.equal(result.decisionLock, false);
  assert.equal(result.mode, 'guidance-only');
  assert.ok(result.instructions.some(line => line.includes('ห้ามอ้างว่าเชื่อมต่อ')));
});

test('static build publishes revenue guidance at the browser import path', async () => {
  const { readFile } = await import('node:fs/promises');
  const build = await readFile(new URL('../scripts/build-static.mjs', import.meta.url), 'utf8');
  assert.ok(build.includes('"revenue-guidance.js"'));
  assert.ok(build.includes('await cp(join("src", file), join(runtimeOutput, file))'));
});

const productionAcceptanceQuestions = [
  ['land-building', 'อบจ. มีอำนาจจัดเก็บภาษีที่ดินและสิ่งปลูกสร้างหรือไม่'],
  ['sign', 'เทศบาลต้องประเมินภาษีป้ายร้านค้าที่มีภาษาไทยและต่างประเทศอย่างไร'],
  ['assessment-appeal', 'ประชาชนได้รับหนังสือแจ้งประเมินภาษีและต้องการอุทธรณ์ภาษี'],
  ['arrears', 'เทศบาลมีภาษีค้างชำระหลายปี จะเร่งรัดภาษีอย่างไร'],
  ['tax-map', 'เทศบาลปรับปรุงแผนที่ภาษีและสำรวจทรัพย์สินใหม่'],
  ['ltax', 'ตรวจสอบข้อมูลในระบบ LTAX GIS และ LTAX ONLINE ก่อนนำไปประเมินภาษี'],
  ['elaas', 'เจ้าหน้าที่บันทึกรายรับภาษีใน New e-LAAS'],
  ['documents', 'ช่วยร่างหนังสือแจ้งภาษีโดยไม่มีข้อมูลผู้เสียภาษี']
];
for (const [expected, question] of productionAcceptanceQuestions) {
  test('production acceptance intent: ' + expected, () => {
    const guidance = revenueGuidance(question);
    assert.equal(guidance?.domain, expected);
    assert.equal(guidance.decisionLock, true);
    assert.equal(guidance.mode, 'guidance-only');
  });
}
test('LTAX wins over incidental assessment while retaining both sets of evidence', () => {
  const result = revenueGuidance('LTAX GIS นำข้อมูลไปประเมินภาษี');
  assert.equal(result.domain, 'ltax');
  assert.ok(result.relatedDomains.includes('assessment-appeal'));
  assert.ok(result.missingEvidence.includes('คู่มือทางการฉบับตรงรุ่น'));
  assert.ok(result.missingEvidence.includes('หนังสือแจ้งประเมิน'));
});
test('New e-LAAS takes precedence over generic revenue recording', () => {
  const result = revenueGuidance('ตรวจบันทึกรายรับในระบบ New e-LAAS');
  assert.equal(result.domain, 'elaas');
});
test('tax arrears still requires primary law even with generic LOW or ai-only routing', () => {
  const result = revenueGuidance('ภาษีค้างชำระหลายปี เร่งรัดภาษีและเบี้ยปรับภาษี');
  assert.equal(result.domain, 'arrears');
  assert.ok(result.instructions.some(x => x.includes('LOW') && x.includes('ai-only')));
  assert.ok(result.missingEvidence.includes('กฎหมายฉบับใช้บังคับ'));
});
test('unrelated administrative work has no revenue side effects', () => {
  assert.equal(revenueGuidance('ช่วยจัดตารางประชุมเจ้าหน้าที่'), null);
});
test('generated prompt contains scoped revenue safety override without altering router', async () => {
  const { readFile } = await import('node:fs/promises');
  const home = await readFile(new URL('../assets/js/home-v3.js', import.meta.url), 'utf8');
  assert.match(home, /Revenue Safety Override/);
  assert.match(home, /revenue.relatedDomains.join/);
  assert.match(home, /prompt: promptBundle.prompt \+ '\\n\\n' \+ revenueBlock/);
});

test('revenue upstream risk, authority and tool routing use real policy state', async () => {
  const { readFile } = await import('node:fs/promises');
  const vm = await import('node:vm');
  const sandbox = { window: {} };
  for (const path of [
    '../assets/js/core/shared-context.js',
    '../assets/js/core/prompt-orchestrator.js',
    '../assets/js/core/tool-routing-policy.js',
    '../assets/js/core/prompt-registry.js',
    '../assets/js/core/transaction-router.js'
  ]) {
    vm.runInNewContext(await readFile(new URL(path, import.meta.url), 'utf8'), sandbox);
  }
  const core = sandbox.window.GovPromptCore;
  const cases = [
    ['อบจ. มีอำนาจจัดเก็บภาษีที่ดินและสิ่งปลูกสร้างหรือไม่', 'GP002'],
    ['เทศบาลต้องประเมินภาษีป้ายร้านค้าที่มีภาษาไทยและภาษาต่างประเทศอย่างไร', 'GP002'],
    ['ประชาชนได้รับหนังสือแจ้งประเมินภาษีและต้องการอุทธรณ์ภาษี', 'GP002'],
    ['เทศบาลมีภาษีค้างชำระหลายปี จะเร่งรัดภาษี คิดเบี้ยปรับภาษีอย่างไร', 'GP005'],
    ['เทศบาลต้องปรับปรุงแผนที่ภาษีและสำรวจทรัพย์สินใหม่', 'GP002'],
    ['ตรวจข้อมูล LTAX GIS และ LTAX ONLINE ก่อนนำไปประเมินภาษี', 'GP002'],
    ['เจ้าหน้าที่เทศบาลต้องบันทึกรายรับภาษีใน New e-LAAS', 'GP005'],
    ['ช่วยร่างหนังสือแจ้งภาษีโดยไม่สมมุติข้อมูลหรือจำนวนเงิน', 'GP001']
  ];
  for (const [question, expectedModule] of cases) {
    const plan = core.planUniversalTask(question);
    assert.equal(plan.riskLevel, 'HIGH', question + ': risk level');
    assert.equal(plan.qualityGates.evidenceRequired, true, question + ': evidence');
    assert.equal(plan.qualityGates.legalVersionRequired, true, question + ': legal version');
    assert.equal(plan.qualityGates.decisionRequired, true, question + ': decision');
    assert.equal(plan.evidenceMode, 'verify-applicable-primary-source', question + ': evidence mode');
    assert.equal(plan.applicableAuthorityCheck.required, true, question + ': applicable authority');
    assert.equal(core.routeRequest(question).primaryModule, expectedModule, question + ': primary route');
    const toolPlan = core.createToolRoutingPlan({question});
    assert.equal(toolPlan.mode, 'web-when-needed', question + ': tool mode');
    assert.equal(toolPlan.flags.needsPrimarySource, true, question + ': primary source');
    assert.ok(toolPlan.tools.includes('web-search'), question + ': official web search');
  }
});
test('revenue overrides do not change unrelated low risk meeting notes', async () => {
  const { readFile } = await import('node:fs/promises');
  const vm = await import('node:vm');
  const sandbox = {window:{}};
  for (const path of ['../assets/js/core/shared-context.js','../assets/js/core/prompt-orchestrator.js','../assets/js/core/tool-routing-policy.js','../assets/js/core/prompt-registry.js','../assets/js/core/transaction-router.js']) {
    vm.runInNewContext(await readFile(new URL(path, import.meta.url),'utf8'), sandbox);
  }
  const core = sandbox.window.GovPromptCore;
  assert.equal(core.planUniversalTask('สรุปข้อความนัดประชุม').riskLevel, 'LOW');
  assert.equal(core.createToolRoutingPlan({question:'สรุปข้อความนัดประชุม'}).mode, 'ai-only');
});
