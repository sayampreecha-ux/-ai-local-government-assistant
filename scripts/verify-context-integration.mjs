import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const values = {
  agency: { value: ' สำนักปลัด ' },
  facts: { value: ' ข้อเท็จจริง ' },
  law: { value: ' ระเบียบที่เกี่ยวข้อง ' },
  objective: { value: ' ร่างคำตอบ ' },
  make: { addEventListener() {} }
};
const document = {
  documentElement: { dataset: {} },
  getElementById(id) { return values[id]; },
  querySelector(selector) {
    return selector === '.task.active' ? { dataset: { task: 'หนังสือภายใน' } } : undefined;
  }
};
const sandbox = { window: {}, document, location: { pathname: '/gp001.html' } };
for (const file of ['shared-context.js', 'prompt-registry.js', 'transaction-router.js', 'context-integration.js']) {
  vm.runInNewContext(await readFile(`assets/js/core/${file}`, 'utf8'), sandbox, { filename: file });
}

const core = sandbox.window.GovPromptCore;
const context = core.getAssistantContext();
assert.deepEqual(Object.keys(context), Array.from(core.CONTEXT_FIELDS));
assert.equal(context.owningUnit, 'สำนักปลัด');
assert.equal(context.domain, 'records');
assert.equal(context.transactionType, 'หนังสือภายใน');
assert.equal(context.facts, 'ข้อเท็จจริง');
assert.equal(context.documents, 'ระเบียบที่เกี่ยวข้อง');
assert.equal(context.desiredOutput, 'ร่างคำตอบ');
assert.equal(core.getCurrentRoute().currentModuleId, 'GP001');
assert.equal(JSON.stringify(core.getCurrentRoute().context), JSON.stringify(context));

const integrationScripts = '<script src="assets/js/core/shared-context.js"></script><script src="assets/js/core/prompt-registry.js"></script><script src="assets/js/core/transaction-router.js"></script><script src="assets/js/core/context-integration.js"></script><script src="assets/js/core/document-loader.js"></script><script src="assets/js/core/citation-engine.js"></script><script src="assets/js/core/knowledge-index.js"></script><script src="assets/js/core/semantic-search.js"></script><script src="assets/js/core/knowledge-engine.js"></script>';
for (let index = 1; index <= 13; index += 1) {
  const file = `gp${String(index).padStart(3, '0')}.html`;
  const current = (await readFile(file, 'utf8')).replace(/\r\n/g, '\n');

  if (file === 'gp008.html') {
    const compactCurrent = current.replace(/>\s+</g, '><');
    assert.equal(compactCurrent.includes(integrationScripts), true, `${file}: Shared Context integration missing`);
    assert.match(current, /data-module-id=["']GP008["']/i, `${file}: explicit GP008 module marker missing`);
    assert.match(current, /id=["']healthWorkerToolkitTask["']/i, `${file}: health toolkit entry missing`);
    assert.match(current, /public-health-worker-toolkit-v1\.js\?v=1\.0\.1/i, `${file}: health toolkit runtime missing`);
    continue;
  }

  const baseline = execFileSync('git', ['show', `12dc26760dd0badb283a665f3b58aa3aa976c713:${file}`], { encoding: 'utf8' }).replace(/\r\n/g, '\n');
  assert.equal(current.includes(integrationScripts), true, `${file}: Shared Context integration missing`);
  assert.equal(current.replace(integrationScripts, ''), baseline, `${file}: Sprint 3.3 output behavior changed`);
}

console.log('Shared Context integration verification passed for GP001-GP013; GP008 explicitly validates the approved static health-tool entry while other assistants remain baseline-locked.');
