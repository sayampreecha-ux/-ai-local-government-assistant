import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function loadModule() {
  const source = fs.readFileSync(new URL('../../assets/js/core/service-contract-routing-overrides.js', import.meta.url), 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: 'service-contract-routing-overrides.js' });
  return context.window.GovPromptCore.serviceContract;
}

test('detects service-contract intent', () => {
  const module = loadModule();
  assert.equal(module.isServiceContractIntent('ขอจัดทำ TOR จ้างเหมาบริการ'), true);
  assert.equal(module.isServiceContractIntent('ขอจัดซื้อคอมพิวเตอร์'), false);
});

test('locks decision when authority or evidence is incomplete', () => {
  const module = loadModule();
  const result = module.createServiceContractReview({
    question: 'ตรวจรับจ้างเหมาบริการ',
    evidence: [],
    authorityVerified: false
  });
  assert.equal(result.matched, true);
  assert.equal(result.decisionLock, true);
  assert.equal(result.status, 'evidence-incomplete');
});
