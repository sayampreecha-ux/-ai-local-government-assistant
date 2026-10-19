import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

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
