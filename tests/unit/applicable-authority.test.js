import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { applicableEvidence } from '../../scripts/fixtures/applicable-authority.mjs';
const sandbox = { window: {} };
for (const file of ['shared-context', 'prompt-orchestrator']) vm.runInNewContext(readFileSync(`assets/js/core/${file}.js`, 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;
const cases = [
  ['A', 'เหตุปี 2560 คำพิพากษาปี 2568 มีกฎใหม่ปี 2565 กรณีปัจจุบันมีสิทธิไหม', 'TIME', /ห้ามถือปีคำพิพากษาเป็นปีข้อเท็จจริง/],
  ['B', 'หนังสือหารือเทศบาล แต่ผู้ขอเป็น อบจ. ใช้สิทธิได้ไหม', 'FACT_MATCH', /ต่างหน่วยงาน\/ฐานกฎหมายต้องอธิบาย/],
  ['C', 'กฎใหม่มีบทเฉพาะกาลรักษาสิทธิเดิม ตัดสิทธิได้ไหม', 'VERSION', /ห้ามใช้กฎใหม่ตัดสิทธิเดิมอัตโนมัติ/],
  ['D', 'คำพิพากษาตรงข้อเท็จจริง หลังเหตุในคดีมีหลักเกณฑ์ใหม่เพิ่มข้อยกเว้น', 'LATER_CHANGE', /หลังพบคดี\/หารือ ต้องค้น/],
  ['E', 'FAQ อธิบายสิทธิเบิกเงิน แต่ยังไม่พบต้นฉบับ', 'AUTHORITY', /ให้ UNVERIFIED และตามหาต้นฉบับต่อ/]
];
for (const [id, question, dimension, instruction] of cases) test(`Case ${id}: incomplete review cannot unlock a legal answer`, () => {
  const assessment = applicableEvidence();
  delete assessment.reviews[dimension];
  if (id === 'E') assessment.sources[0].primary = false;
  const result = core.buildApplicableAuthorityCheck(question, {}, { applicableAuthority: assessment });
  assert.equal(result.mode, 'FULL');
  assert.equal(result.qualityStatus, 'UNVERIFIED');
  assert.equal(result.decisionLock, 'ON');
  assert.ok(result.missingChecks.includes(dimension));
  const bundle = core.createGovernmentPrompt({ question });
  assert.match(bundle.prompt, instruction);
  assert.deepEqual([...result.searchFlow], ['Rule', 'Case', 'Later Rule', 'Conflict Check', 'Applicable Rule', 'Answer']);
});
test('general tasks skip; basic law uses Rule + Version; precedent discovery escalates', () => {
  assert.equal(core.buildApplicableAuthorityCheck('เขียนคำอวยพรวันเกิด').mode, 'NONE');
  assert.doesNotMatch(core.createGovernmentPrompt({ question: 'เขียนคำอวยพรวันเกิด' }).prompt, /Applicable Authority Check/);
  assert.equal(core.buildApplicableAuthorityCheck('อธิบายความหมายของระเบียบ').mode, 'RULE_VERSION');
  assert.equal(core.buildApplicableAuthorityCheck('สรุปเอกสาร', {}, { reliesOnPrecedent: true }).mode, 'FULL');
  assert.equal(core.buildCasePrecedentGate('สรุปเอกสาร', {}, 'LOW', { reliesOnPrecedent: true }).required, true);
});
test('status cannot be spoofed by bare VERIFIED; complete, conditional and conflict stay distinct', () => {
  const evaluate = data => core.buildApplicableAuthorityCheck('สิทธิเบิกเงิน', {}, { applicableAuthority: data });
  assert.equal(evaluate({ qualityStatus: 'VERIFIED' }).qualityStatus, 'UNVERIFIED');
  assert.equal(evaluate(applicableEvidence()).qualityStatus, 'VERIFIED');
  assert.equal(evaluate({ ...applicableEvidence(), conditions: ['ต้องยืนยันวันอนุมัติ'] }).qualityStatus, 'CONDITIONAL');
  assert.equal(evaluate({ ...applicableEvidence(), unresolvedConflict: true }).qualityStatus, 'CONFLICT');
  const unknownSource = applicableEvidence(); unknownSource.reviews.TIME.sourceIds = ['missing'];
  assert.equal(evaluate(unknownSource).decisionLock, 'ON');
});

test('real-world adversarial case: สป0023.6/ว738 dated 23 June 2569 must remain evidence-gated', () => {
  const question = 'หนังสือ สป0023.6/ว738 ลงวันที่ 23 มิถุนายน 2569 เรื่องมาตรการป้องกันและลดอุบัติเหตุทางถนนในช่วงฤดูฝน ปี พ.ศ. 2569 ใช้เป็นฐานตัดสินใจได้ทันทีหรือไม่';
  const result = core.buildApplicableAuthorityCheck(question);
  assert.equal(result.mode, 'FULL');
  assert.equal(result.decisionLock, 'ON');
  assert.equal(result.qualityStatus, 'UNVERIFIED');
  assert.ok(result.missingChecks.length > 0);
  assert.deepEqual([...result.searchFlow], ['Rule', 'Case', 'Later Rule', 'Conflict Check', 'Applicable Rule', 'Answer']);
});

test('precedent gate rejects bare VERIFIED/negative authority flags without source provenance', () => {
  const assessment = applicableEvidence();
  const evidence = {
    applicableAuthority: assessment,
    currentRule: 'VERIFIED',
    currentRuleChecks: ['law','rule','regulation','announcement','primaryDirective','amendments','repealOrReplacement','transitionalProvisions','effectiveDate','dateContextMatched'],
    officialPrecedent: 'SEARCHED_NOT_FOUND',
    searchLevelsCompleted: ['LEVEL_1_DIRECT_FACT_SEARCH','LEVEL_2_LEGAL_OFFICIAL_LANGUAGE_SEARCH','LEVEL_3_PRECEDENT_INDEX_RECOVERY'],
    legalVersion: 'VERIFIED',
    newerOrConflictingAuthority: 'CHECKED_NONE_FOUND',
    contraryEvidenceCheck: 'CHECKED_NONE_FOUND',
    ruleInterpretationConfidence: 'SUFFICIENT'
  };
  const result = core.buildCasePrecedentGate('หนังสือหารือกรณีนี้ใช้เป็นฐานตัดสินใจได้หรือไม่', {}, 'HIGH', evidence);
  assert.equal(result.decisionLock, 'ON');
  assert.ok(result.evidenceState.validationIssues.includes('LEGAL_VERSION_PROVENANCE_INCOMPLETE'));
  assert.ok(result.evidenceState.validationIssues.includes('AUTHORITY_CHECK_PROVENANCE_INCOMPLETE'));
  assert.ok(result.evidenceState.validationIssues.includes('CONTRARY_EVIDENCE_PROVENANCE_INCOMPLETE'));
});

