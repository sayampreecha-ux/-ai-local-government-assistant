import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { prepareBudgetBrowserFile } from '../../src/budget-browser-file-ingestion.js';
import { parseBudgetCsvFile, parseBudgetWorkbookRows, parseCsvText } from '../../src/budget-tabular-parser.js';
import { confirmParsedBudgetReview } from '../../src/budget-file-parser-review.js';

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

test('CSV parser handles quoted commas and produces rows without returning raw file content', () => {
  const table = parseCsvText('ประเภท,รายการ,จำนวนเงิน\nรายรับ,"ภาษี, ค่าธรรมเนียม","100,000"');
  assert.equal(table.rows[0].รายการ, 'ภาษี, ค่าธรรมเนียม');
  assert.equal(table.rows[0].จำนวนเงิน, '100,000');
});

test('budget totals CSV creates review and requires human confirmation', async () => {
  const file = csvFile('รายรับรายจ่าย-2570.csv', [
    'ประเภท,รายการ,จำนวนเงิน',
    'รายรับ,รายได้จัดเก็บเอง,"40,000"',
    'รายรับ,เงินอุดหนุน,"60,000"',
    'รายจ่าย,บุคลากร,"50,000"',
    'รายจ่าย,ดำเนินงาน,"50,000"'
  ].join('\n'));
  const intake = await prepareBudgetBrowserFile(file);
  const result = await parseBudgetCsvFile(file, intake);
  assert.equal(result.review.status, 'awaiting-human-confirmation');
  assert.equal(result.review.extracted.revenueTotal, 100000);
  assert.equal(result.review.extracted.expenseTotal, 100000);
  assert.equal(result.review.governance.parserOutputIsNotEvidence, true);
  assert.equal(JSON.stringify(result).includes('รายรับรายจ่าย-2570.csv'), false);
});

test('confirmed balanced CSV review can promote to governed evidence input', async () => {
  const file = csvFile('รายรับรายจ่าย.csv', 'ประเภท,รายการ,จำนวนเงิน\nรายรับ,A,100\nรายจ่าย,B,100');
  const intake = await prepareBudgetBrowserFile(file, { purpose: 'budgetTotals' });
  const parsed = await parseBudgetCsvFile(file, intake);
  const confirmed = confirmParsedBudgetReview(parsed.review, { confirmed: true, reviewer: 'budget-officer' });
  assert.equal(confirmed.status, 'confirmed');
  assert.equal(confirmed.failClosed, false);
  assert.ok(confirmed.evidenceInput.budgetTotals);
  assert.equal(confirmed.evidenceInput.budgetTotals.contentHash, intake.file.contentHash);
});

test('confirmed unbalanced CSV remains blocked by balance validator', async () => {
  const file = csvFile('รายรับรายจ่าย.csv', 'ประเภท,รายการ,จำนวนเงิน\nรายรับ,A,100\nรายจ่าย,B,90');
  const intake = await prepareBudgetBrowserFile(file, { purpose: 'budgetTotals' });
  const parsed = await parseBudgetCsvFile(file, intake);
  const confirmed = confirmParsedBudgetReview(parsed.review, { confirmed: true, reviewer: 'budget-officer' });
  assert.equal(confirmed.status, 'blocked-unbalanced-budget');
  assert.equal(confirmed.failClosed, true);
  assert.equal(confirmed.balance.difference, 10);
});

test('workbook row adapter extracts baseline and personnel data without claiming XLSX byte parsing', () => {
  const baseline = parseBudgetWorkbookRows({
    purpose: 'baselineBudget',
    rows: [
      { ปีงบประมาณ: '2569', รายการ: 'รวมงบ', จำนวนเงิน: '100,000' }
    ]
  });
  assert.equal(baseline.parsed.fiscalYear, 2569);
  assert.equal(baseline.parsed.total, 100000);

  const personnel = parseBudgetWorkbookRows({
    purpose: 'personnelObligations',
    rows: [
      { รายการ: 'เงินเดือน', จำนวนเงิน: '70,000' },
      { รายการ: 'ค่าตอบแทน', จำนวนเงิน: '30,000' }
    ]
  });
  assert.equal(personnel.parsed.total, 100000);
  assert.equal(personnel.parsed.items.length, 2);
});
