import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildWorkflowRuntimeView } from '../assets/js/core/government-workflow-runtime-v5.js';

const home = readFileSync('assets/js/home-v3.js', 'utf8');
const css = readFileSync('assets/css/home-v3.css', 'utf8');
const statusCopy = readFileSync('assets/js/ui/status-copy.js', 'utf8');
const stateFunction = home.slice(home.indexOf('  function workflowResultState('), home.indexOf('  function setResultState('));
const scope = vm.createContext({});
vm.runInContext(stateFunction, scope);

test('the reported relocation lodging query shows missing information, not ready', () => {
  const view = buildWorkflowRuntimeView({ query: 'เบิกค่าที่พักกรณีย้าย' });
  const state = scope.workflowResultState(view);
  assert.equal(state.needsInput, true);
  assert.equal(state.label, 'รอข้อมูลเพิ่มเติม');
});

test('all missing-evidence workflows retain an input regardless of category', () => {
  for (const workflowId of ['gov.finance', 'gov.hr', 'gov.correspondence', 'gov.public-relations']) {
    const state = scope.workflowResultState({ primary: { workflowId, missingEvidence: ['facts'] } });
    assert.equal(state.needsInput, true);
    assert.equal(state.label, 'รอข้อมูลเพิ่มเติม');
  }
  assert.equal(scope.workflowResultState({ primary: { workflowStatus: 'blocked-official-source' } }).needsInput, true);
  assert.equal(scope.workflowResultState({ primary: { approvalRequired: true } }).label, 'รอผู้มีอำนาจตรวจและอนุมัติ');
  assert.equal(scope.workflowResultState({ primary: { workflowStatus: 'complete' } }).needsInput, false);
});

test('typed submissions enter a separate route without reloading or serializing attachments', () => {
  const routing = home.slice(home.indexOf('  function enterResultPage('), home.indexOf('  function installResultHeader('));
  assert.match(routing, /window\.history\.pushState/);
  assert.match(routing, /searchParams\.set\('view', 'result'\)/);
  assert.match(routing, /conversation\.after\(document\.querySelector\('\.composer-region'\)\)/);
  assert.match(routing, /document\.addEventListener\('submit'/);
  assert.doesNotMatch(routing, /sessionStorage|localStorage|clearAttachments|location\.assign/);
});

test('follow-up submission includes the original task and preserves files while waiting', () => {
  assert.match(home, /text = `\$\{currentRequestText\}\\n\\nข้อมูลเพิ่มเติมจากผู้ใช้:\\n\$\{text\}`/);
  assert.match(home, /if \(!document\.documentElement\.classList\.contains\('result-intake'\)\) clearAttachments\(\)/);
  assert.match(css, /html\.result-route\.result-intake \.composer-region\{display:block!important/);
  assert.match(statusCopy, /heading\.textContent = pendingLabel \|\|/);
  assert.match(statusCopy, /if \(!pendingLabel\) addSimpleHandoffGuide/);
});
