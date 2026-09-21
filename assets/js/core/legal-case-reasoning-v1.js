(() => {
  'use strict';

  /**
   * Legal Case Reasoning v1
   * Domain-neutral reasoning support for Thai government workflows.
   * This module classifies issues and produces verification requirements;
   * it never hard-codes a legal conclusion.
   */
  const ISSUE_TYPES = Object.freeze({
    CONTRACT_AMENDMENT: 'contract_amendment',
    ACCEPTANCE_VALIDITY: 'acceptance_validity',
    PAYMENT_ENTITLEMENT: 'payment_entitlement',
    LIABILITY: 'liability',
    AUTHORITY: 'authority',
    UNKNOWN: 'unknown'
  });

  const AMENDMENT_TYPES = Object.freeze({
    WORK_SCOPE: 'work_scope_or_quantity_or_quality',
    CONTRACT_CONDITION: 'non_work_contract_condition',
    PRICE_OR_K: 'price_or_price_adjustment',
    TIME_OR_PENALTY: 'time_or_penalty',
    UNKNOWN: 'unknown'
  });

  const has = (text, pattern) => pattern.test(String(text || ''));

  function classifyCase(input = {}) {
    const text = [input.question, input.facts, input.documents].filter(Boolean).join(' ');
    const inspectedFinal = Boolean(input.finalInspection || has(text, /ตรวจรับ\s*(?:งาน)?งวดสุดท้าย|ตรวจรับครบแล้ว/i));
    const paid = Boolean(input.paid || has(text, /เบิกจ่ายแล้ว|จ่ายเงินแล้ว/i));

    let amendmentType = AMENDMENT_TYPES.UNKNOWN;
    if (has(text, /ปริมาณ|ขอบเขต|แบบรูปรายการ|คุณภาพ|เนื้องาน|งานเพิ่ม|งานลด/i)) amendmentType = AMENDMENT_TYPES.WORK_SCOPE;
    else if (has(text, /ค่า\s*K|ค่า K|สูตรราคา|ราคาค่าจ้าง|เงินเพิ่ม|ราคาเพิ่ม/i)) amendmentType = AMENDMENT_TYPES.PRICE_OR_K;
    else if (has(text, /ขยายเวลา|ระยะเวลา|ค่าปรับ/i)) amendmentType = AMENDMENT_TYPES.TIME_OR_PENALTY;
    else if (has(text, /เงื่อนไขสัญญา|คู่สัญญา|สถานที่ส่งมอบ|หลักประกัน/i)) amendmentType = AMENDMENT_TYPES.CONTRACT_CONDITION;

    const issueTypes = [];
    if (has(text, /แก้ไขสัญญา|แก้สัญญา|เพิ่มเติมสัญญา/i)) issueTypes.push(ISSUE_TYPES.CONTRACT_AMENDMENT);
    if (inspectedFinal || has(text, /ตรวจรับ|คณะกรรมการตรวจรับ/i)) issueTypes.push(ISSUE_TYPES.ACCEPTANCE_VALIDITY);
    if (has(text, /เบิกจ่าย|จ่ายเงิน|เงินเพิ่ม|เรียกร้องเงิน/i)) issueTypes.push(ISSUE_TYPES.PAYMENT_ENTITLEMENT);
    if (has(text, /ความรับผิด|ละเมิด|เรียกค่าเสียหาย|เจ้าหน้าที่/i)) issueTypes.push(ISSUE_TYPES.LIABILITY);
    if (has(text, /อำนาจ|ผู้มีอำนาจ|อนุมัติ/i)) issueTypes.push(ISSUE_TYPES.AUTHORITY);
    if (!issueTypes.length) issueTypes.push(ISSUE_TYPES.UNKNOWN);

    return Object.freeze({
      inspectedFinal,
      paid,
      amendmentType,
      issueTypes: Object.freeze([...new Set(issueTypes)]),
      requiresPrimaryAuthoritySearch: true,
      decisionLockRecommended: amendmentType === AMENDMENT_TYPES.UNKNOWN || issueTypes.includes(ISSUE_TYPES.UNKNOWN)
    });
  }

  function buildVerificationPlan(caseData = {}) {
    const checks = [
      'identify_contract_and_original_scope',
      'identify_event_timeline_and_effective_dates',
      'retrieve_current_primary_law_and_amendments',
      'check_authority_and_approval_level',
      'check_official_precedent_and_case_match',
      'check_contrary_or_newer_authority',
      'separate_amendment_from_acceptance_and_payment',
      'identify_missing_evidence_and_financial_effect'
    ];

    if (caseData.inspectedFinal && caseData.amendmentType === AMENDMENT_TYPES.WORK_SCOPE) {
      checks.push('test_for_retroactive_regularisation_of_nonconforming_work');
    }
    if (caseData.amendmentType === AMENDMENT_TYPES.PRICE_OR_K) {
      checks.push('verify_contract_price_adjustment_clause_and_calculation_basis');
      checks.push('verify_payment_entitlement_separately_from_amendment_power');
    }
    if (caseData.paid) checks.push('check_post_payment_recovery_or_correction_path');

    return Object.freeze({
      checks: Object.freeze(checks),
      requiredEvidence: Object.freeze([
        'signed_contract_and_amendments',
        'TOR_or_scope_and_drawings',
        'inspection_reports_and_acceptance_minutes',
        'payment_and_claim_documents',
        'official_authority_documents_with_date_and_source'
      ]),
      prohibitedShortcuts: Object.freeze([
        'do_not_conclude_from_final_inspection_status_alone',
        'do_not_treat_non_work_condition_as_automatically_amendable',
        'do_not_use_amendment_to_automatically_validate_nonconforming_work',
        'do_not_confirm_payment_without_separate_entitlement_analysis'
      ])
    });
  }

  function analyze(input = {}) {
    const caseData = classifyCase(input);
    const verificationPlan = buildVerificationPlan(caseData);
    return Object.freeze({
      version: '1.0.0',
      caseData,
      verificationPlan,
      status: caseData.decisionLockRecommended ? 'REQUIRES_FACT_OR_AUTHORITY_CHECK' : 'READY_FOR_AUTHORITY_RETRIEVAL',
      finalDecisionAllowed: false,
      disclaimer: 'This output is a verification plan, not a legal determination.'
    });
  }

  const api = Object.freeze({ ISSUE_TYPES, AMENDMENT_TYPES, classifyCase, buildVerificationPlan, analyze });
  if (typeof globalThis !== 'undefined') globalThis.GovPromptLegalCaseReasoning = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
