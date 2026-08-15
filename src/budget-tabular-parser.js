import { createParsedBudgetReview } from './budget-file-parser-review.js';

export const BUDGET_TABULAR_PARSER_VERSION = '1.1';

const text = value => String(value ?? '').trim();
const number = value => {
  const raw = text(value).replace(/,/g, '');
  const negative = /^\(.*\)$/.test(raw);
  const normalized = raw.replace(/[()]/g, '');
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
};

function normalizeHeader(value) {
  return text(value).toLowerCase().replace(/\s+/g, '');
}

function parseCsvLine(line) {
  const cells = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { current += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      cells.push(current);
      current = '';
    } else current += char;
  }
  cells.push(current);
  return cells;
}

export function parseCsvText(csvText = '') {
  const lines = String(csvText || '').replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim() !== '');
  if (!lines.length) return Object.freeze({ headers: Object.freeze([]), rows: Object.freeze([]) });
  const headers = parseCsvLine(lines[0]).map(cell => text(cell));
  const rows = lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    return Object.freeze(Object.fromEntries(headers.map((header, index) => [header, text(values[index] ?? '')])));
  });
  return Object.freeze({ headers: Object.freeze(headers), rows: Object.freeze(rows) });
}

function findHeader(headers, candidates) {
  const normalized = headers.map(header => [header, normalizeHeader(header)]);
  return normalized.find(([, header]) => candidates.some(candidate => header.includes(normalizeHeader(candidate))))?.[0] || null;
}

function sumItems(items) {
  if (!items.length || items.some(item => item.amount == null)) return null;
  return Math.round((items.reduce((sum, item) => sum + item.amount, 0) + Number.EPSILON) * 100) / 100;
}

export function extractBudgetFromRows({ purpose, headers = [], rows = [] } = {}) {
  const amountHeader = findHeader(headers, ['จำนวนเงิน', 'ยอดเงิน', 'งบประมาณ', 'amount', 'total']);
  const labelHeader = findHeader(headers, ['รายการ', 'ชื่อรายการ', 'หมวด', 'description', 'name']);
  const typeHeader = findHeader(headers, ['ประเภท', 'ฝั่ง', 'รายรับรายจ่าย', 'type']);
  const yearHeader = findHeader(headers, ['ปีงบประมาณ', 'fiscalyear', 'year', 'ปี']);
  const warnings = [];

  if (purpose === 'baselineBudget') {
    const totals = rows.map(row => amountHeader ? number(row[amountHeader]) : null).filter(value => value != null);
    const year = rows.map(row => yearHeader ? Number(row[yearHeader]) : NaN).find(value => Number.isInteger(value)) ?? null;
    const total = totals.length ? Math.round((totals.reduce((sum, value) => sum + value, 0) + Number.EPSILON) * 100) / 100 : null;
    if (!year) warnings.push('fiscalYear:not-found');
    if (total == null) warnings.push('total:not-found');
    return Object.freeze({ parsed: Object.freeze({ fiscalYear: year, total }), warnings: Object.freeze(warnings) });
  }

  if (purpose === 'personnelObligations') {
    const items = rows.map((row, index) => Object.freeze({
      key: `personnel-${index + 1}`,
      label: labelHeader ? text(row[labelHeader]) : `รายการ ${index + 1}`,
      amount: amountHeader ? number(row[amountHeader]) : null,
      status: 'pending-confirmation'
    })).filter(item => item.label || item.amount != null);
    const total = sumItems(items);
    if (!items.length) warnings.push('personnel:items-not-found');
    return Object.freeze({ parsed: Object.freeze({ total, items: Object.freeze(items) }), warnings: Object.freeze(warnings) });
  }

  if (purpose === 'budgetTotals') {
    const revenueItems = [];
    const expenseItems = [];
    rows.forEach((row, index) => {
      const type = typeHeader ? normalizeHeader(row[typeHeader]) : '';
      const item = Object.freeze({
        key: `row-${index + 1}`,
        label: labelHeader ? text(row[labelHeader]) : `รายการ ${index + 1}`,
        amount: amountHeader ? number(row[amountHeader]) : null,
        status: 'pending-confirmation'
      });
      if (/รายรับ|revenue|income/.test(type)) revenueItems.push(item);
      else if (/รายจ่าย|expense|expenditure/.test(type)) expenseItems.push(item);
    });
    if (!typeHeader) warnings.push('budgetTotals:type-column-not-found');
    if (!revenueItems.length) warnings.push('budgetTotals:revenue-not-found');
    if (!expenseItems.length) warnings.push('budgetTotals:expense-not-found');
    return Object.freeze({ parsed: Object.freeze({
      revenueTotal: sumItems(revenueItems),
      expenseTotal: sumItems(expenseItems),
      revenueItems: Object.freeze(revenueItems),
      expenseItems: Object.freeze(expenseItems)
    }), warnings: Object.freeze(warnings) });
  }

  return Object.freeze({ parsed: Object.freeze({}), warnings: Object.freeze(['purpose:unsupported']) });
}

export async function parseBudgetCsvFile(file, intake) {
  if (!file || typeof file.text !== 'function') return Object.freeze({ status: 'blocked-file-text-unavailable', failClosed: true });
  if (!intake || intake.status !== 'ready-for-parser') return Object.freeze({ status: 'blocked-intake-required', failClosed: true });
  if (intake.file.extension !== 'csv') return Object.freeze({ status: 'blocked-unsupported-parser', failClosed: true });
  const table = parseCsvText(await file.text());
  const extraction = extractBudgetFromRows({ purpose: intake.purpose, headers: table.headers, rows: table.rows });
  const review = createParsedBudgetReview({
    fileRef: intake.file.safeRef,
    contentHash: intake.file.contentHash,
    purpose: intake.purpose,
    parsed: extraction.parsed,
    parser: `budget-tabular-parser/${BUDGET_TABULAR_PARSER_VERSION}`
  });
  return Object.freeze({
    status: review.status,
    failClosed: true,
    parserVersion: BUDGET_TABULAR_PARSER_VERSION,
    review,
    warnings: Object.freeze([...extraction.warnings, ...review.warnings]),
    governance: Object.freeze({ rawFileContentReturned: false, parserOutputIsNotEvidence: true, humanConfirmationRequired: true })
  });
}

export function parseBudgetWorkbookRows({ purpose, rows = [] } = {}) {
  if (!Array.isArray(rows) || !rows.length) return Object.freeze({ parsed: Object.freeze({}), warnings: Object.freeze(['workbook:rows-required']) });
  const headers = Object.keys(rows[0] || {});
  return extractBudgetFromRows({ purpose, headers, rows });
}

export default Object.freeze({ parseCsvText, extractBudgetFromRows, parseBudgetCsvFile, parseBudgetWorkbookRows });
