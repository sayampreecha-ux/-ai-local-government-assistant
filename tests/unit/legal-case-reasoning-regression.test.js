import test from 'node:test';
import assert from 'node:assert/strict';
import '../../assets/js/core/legal-case-reasoning-v1.js';

const engine = globalThis.GovPromptLegalCaseReasoning;

const analyze = (question) => engine.analyze({ question });

test('does not hard-code a conclusion from final inspection alone', () => {
  const result = analyze('ตรวจรับงานงวดสุดท้ายแล้ว ขอแก้ไขสัญญา');
  assert.equal(result.finalDecisionAllowed, false);
  assert.equal(result.status, 'REQUIRES_FACT_OR_AUTHORITY_CHECK');
  assert.ok(result.verificationPlan.prohibitedShortcuts.includes('do_not_conclude_from_final_inspection_status_alone'));
});

test('flags retroactive regularisation risk for post-inspection work-scope changes', () => {
  const result = analyze('ตรวจรับงานงวดสุดท้ายแล้ว ขอแก้ไขปริมาณเนื้องานและแบบรูปรายการ');
  assert.ok(result.verificationPlan.checks.includes('test_for_retroactive_regularisation_of_nonconforming_work'));
});

test('keeps price adjustment and payment entitlement as separate checks', () => {
  const result = analyze('ตรวจรับแล้ว ขอแก้ไขค่า K และเบิกจ่ายเงินเพิ่ม');
  assert.ok(result.verificationPlan.checks.includes('verify_contract_price_adjustment_clause_and_calculation_basis'));
  assert.ok(result.verificationPlan.checks.includes('verify_payment_entitlement_separately_from_amendment_power'));
});

test('adds post-payment recovery review when payment has already occurred', () => {
  const result = analyze('เบิกจ่ายแล้ว ขอแก้ไขสัญญาและเรียกเงินคืน');
  assert.ok(result.verificationPlan.checks.includes('check_post_payment_recovery_or_correction_path'));
});

test('requires primary authority search and human verification', () => {
  const result = analyze('ขอคำวินิจฉัยเรื่องแก้ไขสัญญา');
  assert.equal(result.caseData.requiresPrimaryAuthoritySearch, true);
  assert.equal(result.finalDecisionAllowed, false);
  assert.match(result.disclaimer, /verification plan/i);
});
