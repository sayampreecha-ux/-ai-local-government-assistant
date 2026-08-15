import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

test('editable budget review UI requires explicit confirmation before promotion', async () => {
  const source = await readFile('assets/js/core/budget-browser-review-ui-v1.js', 'utf8');
  assert.match(source, /renderBudgetReviewPanel/);
  assert.match(source, /requestBudgetReviewDecision/);
  assert.match(source, /ยืนยันข้อมูลนี้/);
  assert.match(source, /ยังไม่ยืนยัน/);
  assert.match(source, /confirmParsedBudgetReview/);
  assert.match(source, /corrections/);
  assert.match(source, /revenueItems/);
  assert.match(source, /expenseItems/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
});

test('browser input runtime prefers editable review modal and keeps fallback confirmation', async () => {
  const source = await readFile('assets/js/core/budget-browser-input-runtime-v1.js', 'utf8');
  assert.match(source, /budget-browser-review-ui-v1\.js\?v=1\.1\.0/);
  assert.match(source, /requestBudgetReviewDecision/);
  assert.match(source, /editableReviewModalPreferred/);
  assert.match(source, /globalThis\.confirm/);
  assert.match(source, /confirmedInputsMemoryScope: 'current-browser-tab'/);
});

test('review UI and browser input runtime are syntactically valid', () => {
  for (const file of [
    'assets/js/core/budget-browser-review-ui-v1.js',
    'assets/js/core/budget-browser-input-runtime-v1.js'
  ]) {
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }), file);
  }
});
