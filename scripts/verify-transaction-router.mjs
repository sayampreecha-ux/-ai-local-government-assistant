import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/gp005.html' } };
vm.runInNewContext(await readFile('assets/js/core/shared-context.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/transaction-router.js', 'utf8'), sandbox);

const { MODULES, detectModuleId, detectTransactionType, routeTransaction } = sandbox.window.GovPromptCore;
assert.equal(MODULES.length, 12);
assert.equal(detectModuleId({ pathname: '/tools/gp1.html' }), 'GP001');
assert.equal(detectModuleId({ moduleId: ' gp012 ' }), 'GP012');
assert.equal(detectModuleId({ pathname: '/gp013.html' }), 'GP005');

const cases = [
  ['งานสารบรรณและหนังสือภายใน', 'GP001'],
  ['ตรวจข้อกฎหมายและระเบียบ', 'GP002'],
  ['จัดซื้อพัสดุและจัดทำ TOR', 'GP003'],
  ['จัดทำแผนและงบประมาณ', 'GP004'],
  ['เบิกจ่ายและบันทึกบัญชี', 'GP005'],
  ['โอนย้ายบุคลากร', 'GP006'],
  ['งานสาธารณสุขและสุขาภิบาล', 'GP007'],
  ['ควบคุมงานก่อสร้างถนน', 'GP008'],
  ['แผนการศึกษาโรงเรียน', 'GP009'],
  ['ตรวจสอบภายในและควบคุมความเสี่ยง', 'GP010'],
  ['สรุปเพื่อผู้บริหารตัดสินใจ', 'GP011'],
  ['เขียนข่าวประชาสัมพันธ์', 'GP012']
];

for (const [transactionType, expectedModuleId] of cases) {
  const route = routeTransaction({ transactionType }, { moduleId: 'GP001' });
  assert.equal(route.moduleId, expectedModuleId, transactionType);
  assert.equal(route.assistant.path, `${expectedModuleId.toLowerCase()}.html`);
  assert.equal(route.context.transactionType, transactionType);
  assert.equal(route.preservePrompt, true);
}

const normalized = routeTransaction(null, { moduleId: 'GP005' });
assert.equal(normalized.moduleId, 'GP005');
assert.equal(normalized.transactionType, 'general');
assert.deepEqual(Object.keys(normalized.context), Array.from(sandbox.window.GovPromptCore.CONTEXT_FIELDS));
assert.equal(detectTransactionType({ facts: 'ต้องจัดซื้อวัสดุ' }), 'procurement');

const insertedScripts = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/transaction-router.js"></script>';
for (let index = 1; index <= 12; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = await readFile(file, 'utf8');
  const baseline = execFileSync('git', ['show', `fe34a11:${file}`], { encoding: 'utf8' });
  assert.equal(current.includes(insertedScripts), true, `${file}: router scripts not integrated`);
  const normalizeEol = text => text.replace(/\r\n/g, '\n');
  assert.equal(normalizeEol(current.replace(insertedScripts, '')), normalizeEol(baseline), `${file}: existing UI or prompt behavior changed`);
}

console.log('Transaction Router verification passed for GP001-GP012.');
