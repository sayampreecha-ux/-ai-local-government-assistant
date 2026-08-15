import { validateBudgetBalance } from './budget-balance-validator.js';

export const BUDGET_FILE_PARSER_REVIEW_VERSION = '1.0';

const text = value => String(value ?? '').trim();
const finite = value => Number.isFinite(Number(String(value ?? '').replace(/,/g, '')));
const number = value => finite(value) ? Number(String(value).replace(/,/g, '')) : null;

function normalizeItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items.map((item, index) => Object.freeze({
    key: text(item?.key || item?.id || `item-${index + 1}`),
    label: text(item?.label || item?.name),
    amount: number(item?.amount ?? item?.value),
    status: text(item?.status || 'pending-confirmation') || 'pending-confirmation'
  }));
}

export function normalizeParsedBudgetData({ purpose, parsed = {} } = {}) {
  const normalized = { purpose: text(purpose), fields: {}, warnings: [] };
  if (purpose === 'baselineBudget') {
    normalized.fields.fiscalYear = Number.isInteger(Number(parsed.fiscalYear)) ? Number(parsed.fiscalYear) : null;
    normalized.fields.total = number(parsed.total);
    if (!normalized.fields.fiscalYear) normalized.warnings.push('fiscalYear:missing-or-invalid');
    if (normalized.fields.total == null) normalized.warnings.push('total:missing-or-invalid');
  } else if (purpose === 'personnelObligations') {
    normalized.fields.total = number(parsed.total);
    normalized.fields.items = normalizeItems(parsed.items);
    if (normalized.fields.total == null && !normalized.fields.items.length) normalized.warnings.push('personnel:total-or-items-required');
  } else if (purpose === 'budgetTotals') {
    normalized.fields.revenueTotal = number(parsed.revenueTotal);
    normalized.fields.expenseTotal = number(parsed.expenseTotal);
    normalized.fields.revenueItems = normalizeItems(parsed.revenueItems);
    normalized.fields.expenseItems = normalizeItems(parsed.expenseItems);
    if (normalized.fields.revenueTotal == null && !normalized.fields.revenueItems.length) normalized.warnings.push('revenue:total-or-items-required');
    if (normalized.fields.expenseTotal == null && !normalized.fields.expenseItems.length) normalized.warnings.push('expense:total-or-items-required');
  } else {
    normalized.warnings.push('purpose:unsupported');
  }
  return Object.freeze({ purpose: normalized.purpose, fields: Object.freeze(normalized.fields), warnings: Object.freeze(normalized.warnings) });
}

export function createParsedBudgetReview({ fileRef, contentHash, purpose, parsed = {}, parser = 'unknown-parser', parsedAt = new Date().toISOString() } = {}) {
  const normalized = normalizeParsedBudgetData({ purpose, parsed });
  const reviewId = `${text(contentHash).slice(0, 16)}:${text(purpose)}`;
  return Object.freeze({
    reviewVersion: BUDGET_FILE_PARSER_REVIEW_VERSION,
    reviewId,
    status: normalized.warnings.length ? 'needs-review' : 'awaiting-human-confirmation',
    fileRef: text(fileRef),
    contentHash: text(contentHash),
    purpose: text(purpose),
    parsedAt,
    parser: text(parser),
    extracted: normalized.fields,
    warnings: normalized.warnings,
    humanConfirmed: false,
    governance: Object.freeze({
      parserOutputIsNotEvidence: true,
      humanConfirmationRequired: true,
      sourceHashBound: true,
      noAutomaticPromotion: true
    })
  });
}

export function confirmParsedBudgetReview(review, { confirmed = false, reviewer = '', confirmedAt = new Date().toISOString(), corrections = {} } = {}) {
  if (!review || typeof review !== 'object') return Object.freeze({ status: 'blocked-invalid-review', failClosed: true });
  if (!confirmed || !text(reviewer)) return Object.freeze({ status: 'blocked-human-confirmation-required', failClosed: true, review });
  const merged = Object.freeze({ ...review.extracted, ...corrections });
  const sourceEntry = Object.freeze({
    sourceType: 'uploaded-document',
    sourceRef: review.fileRef,
    contentHash: review.contentHash,
    observedAt: confirmedAt,
    status: 'verified',
    data: merged
  });
  const balance = review.purpose === 'budgetTotals' ? validateBudgetBalance(merged) : null;
  if (balance?.failClosed) {
    return Object.freeze({ status: balance.status, failClosed: true, sourceEntry, balance, review: Object.freeze({ ...review, humanConfirmed: true, reviewer: text(reviewer), confirmedAt }) });
  }
  return Object.freeze({
    status: 'confirmed',
    failClosed: false,
    evidenceInput: Object.freeze({ [review.purpose]: sourceEntry }),
    balance,
    review: Object.freeze({ ...review, humanConfirmed: true, reviewer: text(reviewer), confirmedAt })
  });
}

export default Object.freeze({ createParsedBudgetReview, confirmParsedBudgetReview, normalizeParsedBudgetData });
