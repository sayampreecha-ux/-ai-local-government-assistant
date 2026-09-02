import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/gp005.html' } };
vm.runInNewContext(await readFile('assets/js/core/shared-context.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/prompt-registry.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/transaction-router.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/router-regression-overrides.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/hybrid-intent-classifier.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/hybrid-real-world-overrides.js', 'utf8'), sandbox);

const { MODULES, V7_MODULE_IDS, detectModuleId, detectTransactionType, routeRequest, routeTransaction } = sandbox.window.GovPromptCore;
assert.equal(MODULES.length, 13);
assert.equal(V7_MODULE_IDS.length, 13);
assert.equal(detectModuleId({ pathname: '/tools/gp1.html' }), 'GP001');
assert.equal(detectModuleId({ moduleId: ' gp012 ' }), 'GP012');
assert.equal(detectModuleId({ pathname: '/gp013.html' }), 'GP013');

const cases = [
  ['ร่างหนังสือราชการ', 'GP001'],
  ['วิเคราะห์ข้อกฎหมายและฐานอำนาจ', 'GP002'],
  ['ตรวจ TOR งานจัดซื้อ', 'GP003'],
  ['จัดทำโครงการและงบประมาณ', 'GP004'],
  ['เบิกค่าเดินทางไปราชการ', 'GP005'],
  ['ขาดราชการเกิน 15 วัน', 'GP006'],
  ['ตรวจความหนาแน่นชั้นทาง', 'GP007'],
  ['เงินบำรุง รพ.สต. ใช้ได้ไหม', 'GP008'],
  ['ศพดทำกิจกรรมวันเด็ก', 'GP009'],
  ['ตรวจสอบการเบิกจ่าย', 'GP010'],
  ['ร่างคำกล่าวเปิดงานวันเด็ก', 'GP011'],
  ['ทำอินโฟสรุปกฎหมาย', 'GP012'],
  ['ญัตติงบประมาณในสภาท้องถิ่น', 'GP013']
];

for (const [request, expectedModuleId] of cases) {
  const routed = routeRequest(request, { multiModule: false });
  assert.equal(routed.primaryModule, expectedModuleId, request);
  assert.equal(typeof routed.confidence, 'number');
  const compatible = routeTransaction({ transactionType: request }, { moduleId: 'GP001' });
  assert.equal(compatible.moduleId, expectedModuleId, request);
  assert.equal(compatible.assistant.path, `${expectedModuleId.toLowerCase()}.html`);
  assert.equal(compatible.preservePrompt, true);
}

const adversarial = [
  ['จัดซื้อครุภัณฑ์ รพ.สต.', 'GP003'],
  ['จัดซื้ออาหารโรงเรียน', 'GP003'],
  ['จ้างที่ปรึกษาตรวจสอบภายใน', 'GP003'],
  ['มติสภาเรื่องเงินบำรุง', 'GP013'],
  ['เงินบำรุงใช้ซื้อวัสดุได้ไหม', 'GP008'],
  ['บันทึกข้อความเสนอผู้บริหาร', 'GP001'],
  ['ซื้อคอม', 'GP003'],
  ['รถเสียระหว่างไปราชการ', 'GP005'],
  ['กล่าวปิดงานยาเสพติด', 'GP011'],
  ['ตรวจ TOR งานก่อสร้าง', 'GP003']
];
for (const [request, expectedModuleId] of adversarial) {
  assert.equal(routeRequest(request).primaryModule, expectedModuleId, `adversarial: ${request}`);
  assert.equal(routeTransaction({ facts: request }).moduleId, expectedModuleId, `transaction adversarial: ${request}`);
}

const realLanguage = [
  ['ซื้อคอม', 'GP003'],
  ['รถเสียเบิกได้ไหม', 'GP005'],
  ['ขาดงาน 16 วันทำไง', 'GP006'],
  ['ร่างหนังสือถึงผู้ว่า', 'GP001'],
  ['ช่วยทำหนังสือเชิญ', 'GP001'],
  ['เปิดงานวันเด็กพูดว่าไง', 'GP011'],
  ['กล่าวปิดแข่งกีฬา', 'GP011'],
  ['เงินบำรุงซื้อของได้ไหม', 'GP008'],
  ['รพ.สต.ทำโครงการได้ไหม', 'GP008'],
  ['ตรวจ TOR ถนน', 'GP003'],
  ['จ้างทำถนน', 'GP003'],
  ['ถนนพังตรวจยังไง', 'GP007'],
  ['เบิกค่าเครื่องบิน', 'GP005'],
  ['ค่าโรงแรมเบิกไหม', 'GP005'],
  ['ครูเบิกค่าอาหารเด็ก', 'GP009'],
  ['ศพด.จัดงานวันเด็ก', 'GP009'],
  ['ตรวจการเบิกเงิน', 'GP010'],
  ['audit พัสดุ', 'GP010'],
  ['ทำอินโฟกฎหมาย', 'GP012'],
  ['โพสต์ข่าวให้หน่อย', 'GP012'],
  ['สภาจะเปิดประชุม', 'GP013'],
  ['ญัตติงบ', 'GP013'],
  ['มติสภาเรื่องเงินบำรุง', 'GP013'],
  ['หน่วยงานทำเรื่องนี้ได้ไหม', 'GP002'],
  ['ผิดกฎหมายไหม', 'GP002'],
  ['ซื้อของให้ รพ.สต.', 'GP003'],
  ['จัดซื้ออาหารโรงเรียน', 'GP003'],
  ['ร่างคำสั่งแต่งตั้ง', 'GP001'],
  ['โอนงบทำยังไง', 'GP004'],
  ['ทำโครงการ 5 แสน', 'GP004'],
  ['โครงการคุณธรรม', 'GP004'],
  ['โครงการจริยธรรม', 'GP004'],
  ['โครงการธรรมาภิบาล', 'GP004'],
  ['โครงการป้องกันการทุจริต', 'GP004'],
  ['โครงการส่งเสริมสุขภาพ', 'GP008'],
  ['โรงเรียนทำโครงการคุณธรรม', 'GP009']
];
for (const [request, expectedModuleId] of realLanguage) {
  assert.equal(routeRequest(request).primaryModule, expectedModuleId, `real-language: ${request}`);
  assert.equal(routeTransaction({ facts: request }).moduleId, expectedModuleId, `transaction real-language: ${request}`);
}

const multi = routeRequest('ตรวจ TOR งานก่อสร้าง', { multiModule: true });
assert.equal(multi.primaryModule, 'GP003');
assert.equal(multi.modules.includes('GP007'), true);

const normalized = routeTransaction(null, { moduleId: 'GP005' });
assert.equal(normalized.moduleId, 'GP005');
assert.equal(normalized.transactionType, 'finance');
assert.deepEqual(Object.keys(normalized.context), Array.from(sandbox.window.GovPromptCore.CONTEXT_FIELDS));
assert.equal(detectTransactionType({ facts: 'จัดซื้อจัดจ้าง TOR' }), 'procurement');
assert.equal(detectTransactionType({ facts: 'ข้อบัญญัติและองค์ประชุมสภาท้องถิ่น' }), 'council');

const insertedScripts = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/prompt-registry.js"></script><script src="assets/js/core/transaction-router.js"></script><script src="assets/js/core/context-integration.js"></script><script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script><script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script><script src="assets/js/core/knowledge-engine.js"></script>';
for (let index = 1; index <= 13; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = await readFile(file, 'utf8');
  const normalizeEol = text => text.replace(/\r\n/g, '\n');

  if (file === 'gp008.html') {
    const compactCurrent = current.replace(/>\s+</g, '><');
    assert.equal(compactCurrent.includes(insertedScripts), true, `${file}: router scripts not integrated`);
    assert.match(current, /data-module-id=["']GP008["']/i, `${file}: GP008 module marker missing`);
    assert.match(current, /id=["']publicHealthOtherToolsHeading["'][^>]*>\s*อื่นๆ\s*</i, `${file}: Other heading missing`);
    assert.match(current, /id=["']healthWorkerToolkitTask["']/i, `${file}: static health toolkit entry missing`);
    assert.match(current, /public-health-worker-toolkit-v1\.js\?v=1\.0\.3/i, `${file}: health toolkit cache-busted script missing`);
    assert.match(current, /mosquito-survey-onepage-v1\.js\?v=1\.0\.1/i, `${file}: mosquito tool cache-busted script missing`);
    assert.match(current, /หลีกเลี่ยงชื่อผู้ป่วย เลขบัตรประชาชน/i, `${file}: PDPA warning missing`);
    continue;
  }

  const baseline = execFileSync('git', ['show', `12dc26760dd0badb283a665f3b58aa3aa976c713:${file}`], { encoding: 'utf8' });
  assert.equal(current.includes(insertedScripts), true, `${file}: router scripts not integrated`);
  assert.equal(normalizeEol(current.replace(insertedScripts, '')), normalizeEol(baseline), `${file}: existing UI or prompt behavior changed`);
}

console.log('GovPrompt hybrid intent router verification passed for GP001-GP013, cross-domain adversarial cases, GP008 static health tools, and 36 real-language production queries.');
