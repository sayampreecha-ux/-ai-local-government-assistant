const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = fs.readFileSync('assets/js/core/engineering-k-routing-overrides-v1.js', 'utf8');
const base = { primaryModule: 'GP001', modules: ['GP001'], confidence: 0.42, ambiguous: true, fallback: true };
const core = { routeRequest: () => base, PROMPT_REGISTRY: [{ moduleId: 'GP007' }] };
vm.runInNewContext(source, { window: { GovPromptCore: core } });
const routed = core.routeRequest('ตรวจสอบค่า K งานหินคลุก');
assert.equal(routed.primaryModule, 'GP007');
assert.equal(routed.confidence, 0.42);
assert.equal(routed.ambiguous, true);
assert.equal(routed.fallback, true);
assert.equal(routed.evidenceStatus, 'UNVERIFIED');
assert.equal(routed.evidenceVerified, false);
const ordinary = core.routeRequest('ร่างหนังสือราชการ');
assert.equal(ordinary.primaryModule, 'GP001');
assert.equal(ordinary.evidenceStatus, undefined);
console.log('Engineering K routing guardrail tests passed');

// Transaction routing must preserve the base assessment as well.
const txBase = { context: { facts: 'ตรวจค่า K งานหินคลุก' }, confidence: 0.35, ambiguous: true, fallback: true, modules: ['GP001'] };
const txCore = { routeRequest: () => base, routeTransaction: () => txBase, PROMPT_REGISTRY: [{ moduleId: 'GP007' }] };
vm.runInNewContext(source, { window: { GovPromptCore: txCore } });
const transaction = txCore.routeTransaction({ facts: 'ตรวจค่า K งานหินคลุก' });
assert.equal(transaction.primaryModule, 'GP007');
assert.equal(transaction.confidence, 0.35);
assert.equal(transaction.ambiguous, true);
assert.equal(transaction.fallback, true);
assert.equal(transaction.evidenceStatus, 'UNVERIFIED');
assert.equal(transaction.evidenceVerified, false);

// Negative cases: K keyword must not affect unrelated requests.
for (const input of ['จัดทำ TOR งานก่อสร้าง', 'ตรวจราคากลาง Factor F', 'ร่างหนังสือราชการ', 'คำนวณ ปร.4 ปร.5']) {
  const result = core.routeRequest(input);
  assert.equal(result.primaryModule, 'GP001');
  assert.equal(result.evidenceStatus, undefined);
}
