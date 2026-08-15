import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

test('budget purpose picker presents all supported human choices and never guesses', async () => {
  const source = await readFile('assets/js/core/budget-purpose-picker-ui-v1.js', 'utf8');
  assert.match(source, /baselineBudget/);
  assert.match(source, /personnelObligations/);
  assert.match(source, /budgetTotals/);
  assert.match(source, /ระบบไม่แน่ใจว่าไฟล์นี้ใช้สำหรับส่วนใด/);
  assert.match(source, /resolve\(value\)/);
  assert.match(source, /resolve\(null\)/);
});

test('browser input runtime invokes purpose picker only for purpose confirmation blocker', async () => {
  const source = await readFile('assets/js/core/budget-browser-input-runtime-v1.js', 'utf8');
  assert.match(source, /purpose:confirmation-required/);
  assert.match(source, /budget-purpose-picker-ui-v1\.js/);
  assert.match(source, /choosePurposeWhenNeeded/);
  assert.match(source, /ambiguousFilePurposeRequiresHumanSelection: true/);
  assert.doesNotMatch(source, /purpose:\s*'baselineBudget'\s*\|\|/);
});

test('mobile CSS makes review dialog and editable tables usable on narrow screens', async () => {
  const css = await readFile('assets/css/home-v3.css', 'utf8');
  assert.match(css, /\.budget-review-table/);
  assert.match(css, /overflow-x:auto/);
  assert.match(css, /\.budget-review-actions/);
  assert.match(css, /grid-template-columns:1fr/);
  assert.match(css, /\.app-dialog\{width:calc\(100% - 12px\)/);
  assert.match(css, /\.budget-purpose-picker/);
});

test('budget file review flow remains fail-closed from parse through human confirmation', async () => {
  const runtime = await readFile('assets/js/core/budget-browser-input-runtime-v1.js', 'utf8');
  const review = await readFile('src/budget-file-parser-review.js', 'utf8');
  const home = await readFile('assets/js/home-v3.js', 'utf8');
  assert.match(runtime, /parserOutputIsNotEvidence: true/);
  assert.match(runtime, /humanConfirmationRequiredBeforePromotion: true/);
  assert.match(review, /blocked-human-confirmation-required/);
  assert.match(review, /validateBudgetBalance/);
  assert.match(home, /prepareBudgetInternalInputsFromFiles/);
});

test('new mobile/picker modules are syntactically valid', () => {
  for (const file of [
    'assets/js/core/budget-purpose-picker-ui-v1.js',
    'assets/js/core/budget-browser-review-ui-v1.js',
    'assets/js/core/budget-browser-input-runtime-v1.js'
  ]) {
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' }), file);
  }
});
