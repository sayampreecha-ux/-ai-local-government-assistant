import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createParsedBudgetReview,
  confirmParsedBudgetReview
} from '../../src/budget-file-parser-review.js';

const HASH = 'a'.repeat(64);

test('parser output waits for explicit human confirmation before evidence promotion', () => {
  const review = createParsedBudgetReview({
    fileRef: 'browser-upload:aaaaaaaaaaaaaaaa.xlsx',
    contentHash: HASH,
    purpose: 'baselineBudget',
    parsed: { fiscalYear: 2569, total: '100,000' },
    parser: 'test-parser'
  });
  assert.equal(review.status, 'awaiting-human-confirmation');
  assert.equal(review.humanConfirmed, false);
  assert.equal(review.extracted.total, 100000);
  const blocked = confirmParsedBudgetReview(review, { confirmed: false });
  assert.equal(blocked.status, 'blocked-human-confirmation-required');
  assert.equal(blocked.failClosed, true);
});

test('confirmed review becomes governed uploaded-document evidence input', () => {
  const review = createParsedBudgetReview({
    fileRef: 'browser-upload:aaaaaaaaaaaaaaaa.pdf',
    contentHash: HASH,
    purpose: 'personnelObligations',
    parsed: { total: 250000 }
  });
  const result = confirmParsedBudgetReview(review, { confirmed: true, reviewer: 'budget-officer' });
  assert.equal(result.status, 'confirmed');
  assert.equal(result.failClosed, false);
  assert.equal(result.evidenceInput.personnelObligations.sourceType, 'uploaded-document');
  assert.equal(result.evidenceInput.personnelObligations.contentHash, HASH);
  assert.equal(result.evidenceInput.personnelObligations.status, 'verified');
});

test('budget totals go through balance validator after human confirmation', () => {
  const review = createParsedBudgetReview({
    fileRef: 'browser-upload:aaaaaaaaaaaaaaaa.xlsx',
    contentHash: HASH,
    purpose: 'budgetTotals',
    parsed: {
      revenueItems: [{ key: 'R1', amount: 100, status: 'verified' }],
      expenseItems: [{ key: 'E1', amount: 90, status: 'verified' }]
    }
  });
  const result = confirmParsedBudgetReview(review, { confirmed: true, reviewer: 'budget-officer' });
  assert.equal(result.status, 'blocked-unbalanced-budget');
  assert.equal(result.failClosed, true);
  assert.equal(result.balance.difference, 10);
  assert.equal(result.evidenceInput, undefined);
});

test('human corrections are applied before balance validation', () => {
  const review = createParsedBudgetReview({
    fileRef: 'browser-upload:aaaaaaaaaaaaaaaa.xlsx',
    contentHash: HASH,
    purpose: 'budgetTotals',
    parsed: { revenueTotal: 100, expenseTotal: 90 }
  });
  const result = confirmParsedBudgetReview(review, {
    confirmed: true,
    reviewer: 'budget-officer',
    corrections: { expenseTotal: 100 }
  });
  assert.equal(result.status, 'confirmed');
  assert.equal(result.balance.valid, true);
  assert.equal(result.evidenceInput.budgetTotals.data.expenseTotal, 100);
});
