import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { prepareBudgetInternalInputsFromFiles } from '../../assets/js/core/budget-browser-input-runtime-v1.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

function csvFile(name, content) {
  const bytes = new TextEncoder().encode(content);
  return {
    name,
    type: 'text/csv',
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer,
    text: async () => content
  };
}

test('parsed CSV remains review-only and is not promoted to verified input automatically', async () => {
  const file = csvFile('รายรับรายจ่าย.csv', 'ประเภท,รายการ,จำนวนเงิน\nรายรับ,ภาษี,100\nรายจ่าย,บริการ,100');
  const result = await prepareBudgetInternalInputsFromFiles([file]);
  assert.equal(result.status, 'awaiting-human-confirmation');
  assert.deepEqual(Object.keys(result.inputs), []);
  assert.equal(result.pendingReviews.length, 1);
  assert.equal(result.pendingReviews[0].purpose, 'budgetTotals');
  assert.equal(result.pendingReviews[0].humanConfirmed, false);
  assert.equal(result.governance.parserOutputIsNotEvidence, true);
  assert.equal(result.governance.humanConfirmationRequiredBeforePromotion, true);
});

test('previously confirmed governed inputs may be carried without re-promoting parser output', async () => {
  const confirmed = {
    baselineBudget: {
      sourceType: 'uploaded-document', sourceRef: 'browser-upload:abc.pdf', observedAt: '2026-08-15T12:00:00Z',
      status: 'verified', contentHash: 'abc', data: { fiscalYear: 2569, total: 100 }
    }
  };
  const result = await prepareBudgetInternalInputsFromFiles([], { confirmedInputs: confirmed });
  assert.equal(result.status, 'ready');
  assert.equal(result.inputs.baselineBudget.data.total, 100);
  assert.equal(result.pendingReviews.length, 0);
});
