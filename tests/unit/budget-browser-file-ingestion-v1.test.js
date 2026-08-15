import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import {
  classifyBudgetFilePurpose,
  prepareBudgetBrowserFile
} from '../../src/budget-browser-file-ingestion.js';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

function fakeFile(name, content = 'budget-data', type = 'application/pdf') {
  const bytes = new TextEncoder().encode(content);
  return {
    name,
    type,
    size: bytes.byteLength,
    arrayBuffer: async () => bytes.buffer
  };
}

test('classifies common Thai budget filenames without retaining raw filename in output', async () => {
  assert.equal(classifyBudgetFilePurpose('ข้อบัญญัติงบประมาณ-2569.pdf'), 'baselineBudget');
  assert.equal(classifyBudgetFilePurpose('ภาระเงินเดือนบุคลากร.xlsx'), 'personnelObligations');
  assert.equal(classifyBudgetFilePurpose('รายรับรายจ่าย-2570.xlsx'), 'budgetTotals');
  const result = await prepareBudgetBrowserFile(fakeFile('ข้อบัญญัติงบประมาณ-2569.pdf'));
  assert.equal(result.status, 'ready-for-parser');
  assert.equal(result.purpose, 'baselineBudget');
  assert.match(result.file.contentHash, /^[a-f0-9]{64}$/);
  assert.match(result.file.safeRef, /^browser-upload:[a-f0-9]{16}\.pdf$/);
  assert.equal(JSON.stringify(result).includes('ข้อบัญญัติงบประมาณ-2569.pdf'), false);
  assert.equal(result.governance.rawBytesReturned, false);
});

test('ambiguous file requires human purpose confirmation instead of guessing', async () => {
  const result = await prepareBudgetBrowserFile(fakeFile('เอกสาร1.pdf'));
  assert.equal(result.status, 'rejected');
  assert.ok(result.errors.includes('purpose:confirmation-required'));
});

test('explicit purpose allows ambiguous safe filename to proceed to parser', async () => {
  const result = await prepareBudgetBrowserFile(fakeFile('เอกสาร1.xlsx', '123', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'), { purpose: 'budgetTotals' });
  assert.equal(result.status, 'ready-for-parser');
  assert.equal(result.purpose, 'budgetTotals');
  assert.equal(result.file.extension, 'xlsx');
});

test('rejects unsupported and empty files fail closed', async () => {
  const unsupported = await prepareBudgetBrowserFile(fakeFile('งบเดิม.exe'));
  assert.equal(unsupported.status, 'rejected');
  assert.ok(unsupported.errors.includes('file:type-not-allowed'));
  const empty = { name: 'งบเดิม.pdf', type: 'application/pdf', size: 0, arrayBuffer: async () => new ArrayBuffer(0) };
  const result = await prepareBudgetBrowserFile(empty);
  assert.equal(result.status, 'rejected');
  assert.ok(result.errors.includes('file:empty'));
});
