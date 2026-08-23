import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCaseListView,
  prioritizeCase,
  readRememberedCases,
  prioritizeRememberedCase
} from '../../assets/js/ui/case-list-ui-v1.js';
import { CASE_MEMORY_STORAGE_KEY } from '../../src/government-case-memory-v1.js';

function caseItem(id, updatedAt, workflowId = 'gov.procurement') {
  return {
    caseId: id,
    title: `เคส ${id}`,
    workflowIds: [workflowId],
    status: 'active',
    updatedAt,
    progress: [{
      workflowId,
      currentStageId: 'need-and-authority',
      currentStageTitle: 'ตรวจความจำเป็นและอำนาจ',
      completedStages: [],
      workflowStatus: 'blocked-missing-evidence',
      nextAction: 'รวบรวมหลักฐานที่ยังขาด',
      approvalRequired: false,
      failClosed: true
    }],
    rawPrompt: 'ข้อมูลที่ต้องไม่แสดง',
    rawEvidence: [{ value: 'ข้อมูลที่ต้องไม่แสดง' }]
  };
}

function memoryStorage(initial = []) {
  const map = new Map([[CASE_MEMORY_STORAGE_KEY, JSON.stringify(initial)]]);
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value))
  };
}

test('case list sorts latest first and exposes sanitized workflow metadata only', () => {
  const view = buildCaseListView([
    caseItem('case-old', '2026-08-22T08:00:00.000Z'),
    caseItem('case-new', '2026-08-23T08:00:00.000Z')
  ]);
  assert.equal(view[0].caseId, 'case-new');
  assert.equal(view[0].currentStageTitle, 'ตรวจความจำเป็นและอำนาจ');
  assert.equal('rawPrompt' in view[0], false);
  assert.equal('rawEvidence' in view[0], false);
  assert.equal(view[0].privacy.rawPromptStored, false);
  assert.equal(view[0].privacy.rawEvidenceStored, false);
});

test('selected case is prioritized so generic resume resolves the clicked case first', () => {
  const next = prioritizeCase([
    caseItem('case-a', '2026-08-23T08:00:00.000Z'),
    caseItem('case-b', '2026-08-23T07:00:00.000Z')
  ], 'case-b');
  assert.equal(next[0].caseId, 'case-b');
});

test('browser storage prioritization persists only sanitized case records', () => {
  const storage = memoryStorage([
    caseItem('case-a', '2026-08-23T08:00:00.000Z'),
    caseItem('case-b', '2026-08-23T07:00:00.000Z')
  ]);
  assert.equal(prioritizeRememberedCase('case-b', storage), true);
  const stored = readRememberedCases(storage);
  assert.equal(stored[0].caseId, 'case-b');
  const raw = storage.getItem(CASE_MEMORY_STORAGE_KEY);
  assert.equal(raw.includes('ข้อมูลที่ต้องไม่แสดง'), false);
  assert.equal(raw.includes('rawPrompt'), false);
  assert.equal(raw.includes('rawEvidence'), false);
});
