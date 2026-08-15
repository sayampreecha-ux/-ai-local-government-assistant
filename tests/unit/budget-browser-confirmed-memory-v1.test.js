import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { prepareBudgetInternalInputsFromFiles } from '../../assets/js/core/budget-browser-input-runtime-v1.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

function csvFile(content) {
  const bytes = new TextEncoder().encode(content);
  return {
    name: 'รายรับรายจ่าย.csv', type: 'text/csv', size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer,
    text: async () => content
  };
}

test('explicit human confirmation persists governed input for the next budget execution in the same tab scope', async () => {
  delete globalThis.GovPromptBudgetConfirmedInputs;
  const file = csvFile('ประเภท,รายการ,จำนวนเงิน\nรายรับ,ภาษี,100\nรายจ่าย,บริการ,100');
  const first = await prepareBudgetInternalInputsFromFiles([file], {
    confirmReview: async () => ({ confirmed: true, reviewer: 'unit-reviewer' })
  });
  assert.equal(first.status, 'ready');
  assert.ok(first.inputs.budgetTotals);
  assert.equal(first.inputs.budgetTotals.status, 'verified');
  assert.equal(globalThis.GovPromptBudgetConfirmedInputs.budgetTotals.status, 'verified');

  const second = await prepareBudgetInternalInputsFromFiles([]);
  assert.equal(second.status, 'ready');
  assert.equal(second.inputs.budgetTotals.data.revenueTotal, 100);
  assert.equal(second.inputs.budgetTotals.data.expenseTotal, 100);
  delete globalThis.GovPromptBudgetConfirmedInputs;
});
