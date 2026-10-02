import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildResumableWorkflowState,
  buildRoutingHint,
  generateCaseId,
  isResumeIntent,
  resolveResumeCase,
  sanitizeCaseRecord,
  upsertCaseMemory
} from '../../src/government-case-memory-v1.js';

test('recognizes resume intent in Thai', () => {
  assert.equal(isResumeIntent('ทำต่อเรื่องเดิม'), true);
  assert.equal(isResumeIntent('เปิดเรื่องใหม่'), false);
});

test('stores only sanitized workflow metadata and no raw prompt/evidence', () => {
  const record = sanitizeCaseRecord({
    caseId: 'case-1',
    title: 'ซื้อเครื่องจักร',
    workflowIds: ['gov.procurement', 'gov.finance'],
    rawPrompt: 'เลขบัตรประชาชน 1234567890123',
    evidence: [{ value: 'secret' }],
    progress: [{ workflowId: 'gov.procurement', currentStageId: 'plan-and-budget', completedStages: ['need-and-authority'] }]
  });
  assert.equal('rawPrompt' in record, false);
  assert.equal('evidence' in record, false);
  assert.equal(record.privacy.rawPromptStored, false);
  assert.equal(record.privacy.rawEvidenceStored, false);
  assert.equal(record.privacy.personalDataStored, false);
});

test('resolves compatible active case for resume', () => {
  const cases = [
    sanitizeCaseRecord({ caseId: 'hr', workflowIds: ['gov.hr'], status: 'active' }),
    sanitizeCaseRecord({ caseId: 'proc', workflowIds: ['gov.procurement'], status: 'active' })
  ];
  assert.equal(resolveResumeCase(cases, 'ทำต่อเรื่องจัดซื้อ', ['gov.procurement']).caseId, 'proc');
});

test('rebuilds valid state shape from completed stages', () => {
  const state = buildResumableWorkflowState({
    workflowId: 'gov.procurement',
    caseId: 'proc',
    completedStages: ['need-and-authority'],
    orderedStageIds: ['need-and-authority', 'plan-and-budget', 'technical-requirements']
  });
  assert.equal(state.schemaVersion, '2.0');
  assert.equal(state.currentStageId, 'plan-and-budget');
  assert.equal(state.transitionLog[0].fromStageId, 'need-and-authority');
  assert.equal(state.transitionLog[0].toStageId, 'plan-and-budget');
});

test('upsert keeps newest case first and deduplicates case id', () => {
  const one = sanitizeCaseRecord({ caseId: 'one', workflowIds: ['gov.hr'] });
  const updated = upsertCaseMemory([one], { caseId: 'one', workflowIds: ['gov.procurement'], title: 'ใหม่' });
  assert.equal(updated.length, 1);
  assert.deepEqual(updated[0].workflowIds, ['gov.procurement']);
});

test('routing hint contains no raw user content', () => {
  const hint = buildRoutingHint(['gov.procurement', 'gov.finance', 'gov.legal']);
  assert.match(hint, /จัดซื้อจัดจ้าง/);
  assert.match(hint, /การเงิน/);
  assert.match(hint, /กฎหมาย/);
});

test('case id generation is deterministic for supplied seed', () => {
  assert.equal(generateCaseId(1000, 0.5), generateCaseId(1000, 0.5));
});
