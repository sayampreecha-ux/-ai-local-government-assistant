import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
