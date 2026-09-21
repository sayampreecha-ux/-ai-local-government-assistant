import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyCase, analyze } from '../../assets/js/core/legal-case-reasoning-v1.js';

test('classifies final inspection plus work-scope amendment as high-risk review', () => {
  const result = classifyCase({ question: 'ตรวจรับงวดสุดท้ายแล้ว ขอแก้ไขปริมาณเนื้องาน' });
  assert.equal(result.inspectedFinal, true);
  assert.equal(result.amendmentType, 'work_scope_or_quantity_or_quality');
  assert.equal(result.requiresPrimaryAuthoritySearch, true);
});

test('keeps payment entitlement separate from amendment power', () => {
  const result = analyze({ question: 'ตรวจรับแล้ว ขอแก้ไขค่า K และเบิกเงินเพิ่ม' });
  assert.equal(result.finalDecisionAllowed, false);
  assert.ok(result.verificationPlan.checks.includes('verify_payment_entitlement_separately_from_amendment_power'));
});
