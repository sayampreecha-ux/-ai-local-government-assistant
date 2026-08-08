import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, location: { pathname: '/gp005.html' } };
vm.runInNewContext(await readFile('assets/js/core/shared-context.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/prompt-registry.js', 'utf8'), sandbox);
vm.runInNewContext(await readFile('assets/js/core/transaction-router.js', 'utf8'), sandbox);

const { MODULES, V7_MODULE_IDS, detectModuleId, detectTransactionType, routeRequest, routeTransaction } = sandbox.window.GovPromptCore;
assert.equal(MODULES.length, 13);
assert.equal(V7_MODULE_IDS.length, 13);
assert.equal(detectModuleId({ pathname: '/tools/gp1.html' }), 'GP001');
assert.equal(detectModuleId({ moduleId: ' gp012 ' }), 'GP012');
assert.equal(detectModuleId({ pathname: '/gp013.html' }), 'GP013');

const cases = [
  ['official letter memorandum', 'GP001'], ['legal authority law', 'GP002'],
  ['procurement TOR', 'GP003'], ['budget project KPI', 'GP004'],
  ['travel expense reimbursement', 'GP005'], ['human resources promotion', 'GP006'],
  ['engineering construction road', 'GP007'], ['public health รพ.สต.', 'GP008'],
  ['education school teacher', 'GP009'], ['internal audit ปค.5', 'GP010'],
  ['executive policy นายก', 'GP011'], ['public relations press release', 'GP012'],
  ['council quorum motion', 'GP013']
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

const multi = routeRequest('procurement law budget', { confidenceThreshold: 0.3, multiModuleThreshold: 0.2 });
assert.equal(multi.primaryModule, 'GP002');
assert.equal(multi.modules.includes('GP003'), true);
assert.equal(multi.modules.includes('GP004'), true);

const normalized = routeTransaction(null, { moduleId: 'GP005' });
assert.equal(normalized.moduleId, 'GP005');
assert.equal(normalized.transactionType, 'finance');
assert.deepEqual(Object.keys(normalized.context), Array.from(sandbox.window.GovPromptCore.CONTEXT_FIELDS));
assert.equal(detectTransactionType({ facts: 'procurement TOR review' }), 'procurement');
assert.equal(detectTransactionType({ facts: 'ข้อบัญญัติและองค์ประชุมสภาท้องถิ่น' }), 'council');

const insertedScripts = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/prompt-registry.js"></script><script src="assets/js/core/transaction-router.js"></script><script src="assets/js/core/context-integration.js"></script><script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script><script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script><script src="assets/js/core/knowledge-engine.js"></script>';
for (let index = 1; index <= 13; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = await readFile(file, 'utf8');
  const baseline = execFileSync('git', ['show', `12dc26760dd0badb283a665f3b58aa3aa976c713:${file}`], { encoding: 'utf8' });
  assert.equal(current.includes(insertedScripts), true, `${file}: router scripts not integrated`);
  const normalizeEol = text => text.replace(/\r\n/g, '\n');
  assert.equal(normalizeEol(current.replace(insertedScripts, '')), normalizeEol(baseline), `${file}: existing UI or prompt behavior changed`);
}

console.log('GovPrompt v7 Transaction Router verification passed for GP001-GP013 with registry alignment and legacy page compatibility.');
