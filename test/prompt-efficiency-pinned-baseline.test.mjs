import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { detectGovernmentWorkflows } from '../src/government-workflow-suite.js';
import { buildWorkflowRuntimeView, buildWorkflowPromptBlock } from '../assets/js/core/government-workflow-runtime-v5.js';

test('P0 baseline pins exact tested merge main parent, never stale event base', () => {
  const workflow=readFileSync('.github/workflows/ci.yml','utf8');
  assert.equal((workflow.match(/BASE_REF="\$\(git rev-parse HEAD\^1\)"/g)||[]).length,2);
  assert.doesNotMatch(workflow,/BASE_REF="\$\{\{ github\.event\.pull_request\.base\.sha \}\}"/);
  assert.match(workflow,/deltaUtf8Bytes>0/);
  assert.match(workflow,/sha256Equal:base\.sha256===item\.sha256/);
  assert.match(workflow,/!x\.sha256Equal/);
});

test('browser verifier hashes the exact copied prompt and checks byte length', () => {
  const verifier=readFileSync('scripts/verify-prompt-efficiency-runtime.mjs','utf8');
  assert.match(verifier,/assert\.equal\(copied,prompt/);
  assert.match(verifier,/Buffer\.byteLength\(prompt,'utf8'\)/);
  assert.match(verifier,/createHash\('sha256'\)\.update\(prompt,'utf8'\)\.digest\('hex'\)/);
});

test('browser comparison controls the Case ID entropy at input without normalizing output', () => {
  const verifier=readFileSync('scripts/verify-prompt-efficiency-runtime.mjs','utf8');
  const hook=verifier.match(/await context\.addInitScript\((\(\) => \{[\s\S]*?\n \})\);/);
  assert.ok(hook, 'deterministic inputs must be installed before loading application modules');
  const memory=readFileSync('src/government-case-memory-v1.js','utf8').replace(/^export /gm,'');
  const actualId=(random, now, controlled) => {
    const sandbox=vm.createContext({});
    vm.runInContext('Math.random=()=>'+random+';Date.now=()=>'+now, sandbox);
    if(controlled) vm.runInContext('('+hook[1]+')()', sandbox);
    vm.runInContext(memory, sandbox);
    return vm.runInContext('generateCaseId()',sandbox);
  };
  assert.notEqual(actualId(0.001,1000,false).length,actualId(0.9,1000,false).length,
    'uncontrolled base-36 random IDs reproduce byte-length drift');
  const before=actualId(0.001,1000,true), after=actualId(0.9,9999,true);
  assert.equal(before,'case-mvfohvk0-89oqgw');
  assert.equal(after,before);
  assert.ok(verifier.indexOf('context.addInitScript') < verifier.indexOf('context.newPage'));
  assert.match(verifier,/row\.prompt=prompt/);
});

test('explicit revenue route survives the installed hybrid fallback', () => {
  const sandbox=vm.createContext({window:{},location:{pathname:'/index.html'}});
  for(const file of ['shared-context','prompt-registry','transaction-router','router-regression-overrides',
    'hybrid-intent-classifier','hybrid-real-world-overrides','output-router','prompt-orchestrator']) {
    vm.runInContext(readFileSync('assets/js/core/'+file+'.js','utf8'),sandbox);
  }
  const core=sandbox.window.GovPromptCore;
  for(const question of ['ตรวจภาษีป้ายที่ค้างชำระและการอุทธรณ์','ตรวจภาษีป้าย','ตรวจภาษีที่ดินและสิ่งปลูกสร้าง']) {
    const route=core.routeTransaction(core.createSharedContext({facts:question,desiredOutput:question}));
    assert.equal(route.moduleId,'GP002',question);
    assert.equal(route.fallback,false,question);
    const bundle=core.createGovernmentPrompt({question,route});
    assert.ok(bundle.prompt.includes(question));
    assert.equal(bundle.taskPlan.riskLevel,'HIGH');
    assert.equal(bundle.qualityGates.evidenceRequired,true);
  }
});

test('technical quantity review keeps engineering primary and procurement supporting', () => {
  const question='ตรวจปริมาณงานซ่อมถนนคอนกรีตและราคากลาง';
  const ids=detectGovernmentWorkflows({query:question}).map(x=>x.id);
  assert.equal(ids[0],'gov.engineering');
  assert.ok(ids.includes('gov.procurement'));
  const view=buildWorkflowRuntimeView({query:question,caseId:'test-engineering'});
  assert.equal(view.primary.workflowId,'gov.engineering');
  assert.match(buildWorkflowPromptBlock(view),/Primary workflow: gov.engineering/);
  assert.equal(view.governance.autoApprovalAllowed,false);
  assert.equal(view.governance.failClosed,true);
});

test('technical priority preserves requested TOR, correspondence, PR and finance jobs', () => {
  for(const [query,expected] of [
    ['ตรวจ TOR จ้างซ่อมถนนและประมาณราคา','gov.procurement'],
    ['ร่างหนังสือชี้แจงผลตรวจปริมาณงานถนนและราคากลาง','gov.correspondence'],
    ['ร่างโพสต์ประชาสัมพันธ์ผลตรวจปริมาณงานถนน','gov.public-relations'],
    ['เบิกค่าเช่าซื้อบ้าน','gov.finance']
  ]) assert.equal(detectGovernmentWorkflows({query})[0].id,expected,query);
});

test('revenue subject never replaces an explicit correspondence or PR deliverable', () => {
  const sandbox=vm.createContext({window:{},location:{pathname:'/index.html'}});
  for(const file of ['shared-context','prompt-registry','transaction-router','router-regression-overrides',
    'hybrid-intent-classifier','hybrid-real-world-overrides','output-router','prompt-orchestrator'])
    vm.runInContext(readFileSync('assets/js/core/'+file+'.js','utf8'),sandbox);
  const core=sandbox.window.GovPromptCore;
  for(const [question,moduleId] of [
    ['ร่างหนังสือชี้แจงภาษีป้าย','GP001'],
    ['เขียนข่าวประชาสัมพันธ์ภาษีป้าย','GP012']
  ]) assert.equal(core.routeTransaction(core.createSharedContext({facts:question,desiredOutput:question})).moduleId,moduleId,question);
});
