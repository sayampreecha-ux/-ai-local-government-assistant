import { prepareBudgetBrowserFile } from '../../../src/budget-browser-file-ingestion.js';
import { parseBudgetBrowserFile } from '../../../src/budget-browser-file-parser.js';
import { createParsedBudgetReview, confirmParsedBudgetReview } from '../../../src/budget-file-parser-review.js';

export const BUDGET_BROWSER_INPUT_RUNTIME_VERSION = '1.6';

function browserConfirmedInputs() {
  const value = typeof globalThis !== 'undefined' ? globalThis.GovPromptBudgetConfirmedInputs : null;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function persistConfirmedInputs(inputs) {
  if (typeof globalThis === 'undefined') return;
  globalThis.GovPromptBudgetConfirmedInputs = Object.freeze({ ...(inputs || {}) });
}

async function choosePurposeWhenNeeded(prepared) {
  if (prepared?.status === 'ready-for-parser') return null;
  if (!Array.isArray(prepared?.errors) || !prepared.errors.includes('purpose:confirmation-required') || typeof document === 'undefined') return null;
  try {
    const picker = await import('./budget-purpose-picker-ui-v1.js?v=1.0.0');
    return await picker.chooseBudgetPurpose();
  } catch { return null; }
}

async function defaultConfirmReview(review) {
  if (typeof document !== 'undefined') {
    try {
      const ui = await import('./budget-browser-review-ui-v1.js?v=1.1.0');
      return await ui.requestBudgetReviewDecision(review);
    } catch {}
  }
  if (typeof globalThis.confirm !== 'function') return null;
  const extracted = review?.extracted || {};
  const summary = [
    `ประเภทข้อมูล: ${review?.purpose || '-'}`,
    Number.isFinite(Number(extracted.total)) ? `ยอดรวม: ${Number(extracted.total).toLocaleString('th-TH')} บาท` : '',
    Number.isFinite(Number(extracted.revenueTotal)) ? `รายรับรวม: ${Number(extracted.revenueTotal).toLocaleString('th-TH')} บาท` : '',
    Number.isFinite(Number(extracted.expenseTotal)) ? `รายจ่ายรวม: ${Number(extracted.expenseTotal).toLocaleString('th-TH')} บาท` : '',
    '',
    'ยืนยันว่าค่าที่ระบบอ่านจากไฟล์ถูกต้องและให้นำไปใช้เป็นหลักฐานภายในสำหรับ Working Draft หรือไม่?'
  ].filter(value => value !== '').join('\n');
  return Object.freeze({ confirmed: globalThis.confirm(summary), reviewer: 'browser-user-confirmed' });
}

export async function prepareBudgetInternalInputsFromFiles(files = [], { targetYear = null, purposeByIndex = {}, confirmedInputs = null, confirmReview = null } = {}) {
  const list = Array.isArray(files) ? files : Array.from(files || []);
  const carried = confirmedInputs && typeof confirmedInputs === 'object' ? confirmedInputs : browserConfirmedInputs();
  const inputs = { ...carried };
  const results = [];
  const reviews = [];
  const reviewHandler = typeof confirmReview === 'function' ? confirmReview : defaultConfirmReview;
  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    let explicitPurpose = purposeByIndex[index] || null;
    let prepared;
    try { prepared = await prepareBudgetBrowserFile(file, { purpose: explicitPurpose }); }
    catch { prepared = { status: 'rejected', errors: ['file-preparation:failed'] }; }
    if (prepared.status !== 'ready-for-parser') {
      const selectedPurpose = await choosePurposeWhenNeeded(prepared);
      if (selectedPurpose) {
        explicitPurpose = selectedPurpose;
        try { prepared = await prepareBudgetBrowserFile(file, { purpose: explicitPurpose }); }
        catch { prepared = { status: 'rejected', errors: ['file-preparation:failed'] }; }
      }
    }
    if (prepared.status !== 'ready-for-parser') {
      results.push(Object.freeze({ index, status: prepared.status, purpose: explicitPurpose, errors: Object.freeze(prepared.errors || []) }));
      continue;
    }
    const parsed = await parseBudgetBrowserFile(file, prepared, { targetYear });
    if (parsed.status !== 'ready') {
      results.push(Object.freeze({ index, status: parsed.status, purpose: prepared.purpose, errors: Object.freeze(parsed.errors || []) }));
      continue;
    }
    const review = createParsedBudgetReview({
      fileRef: prepared.file.safeRef,
      contentHash: prepared.file.contentHash,
      purpose: prepared.purpose,
      parsed: parsed.data,
      parser: parsed.governance?.parserVersion || 'budget-browser-file-parser',
      parsedAt: prepared.file.observedAt
    });
    reviews.push(review);
    let decision = null;
    if (typeof reviewHandler === 'function') {
      try { decision = await reviewHandler(review); } catch { decision = null; }
    }
    if (decision?.confirmed === true) {
      const confirmation = confirmParsedBudgetReview(review, {
        confirmed: true,
        reviewer: String(decision.reviewer || 'browser-user'),
        confirmedAt: decision.confirmedAt || new Date().toISOString(),
        corrections: decision.corrections && typeof decision.corrections === 'object' ? decision.corrections : {}
      });
      if (confirmation.status === 'confirmed' && confirmation.evidenceInput?.[prepared.purpose]) {
        inputs[prepared.purpose] = confirmation.evidenceInput[prepared.purpose];
        persistConfirmedInputs(inputs);
        results.push(Object.freeze({ index, status: 'confirmed', purpose: prepared.purpose, review: confirmation.review, errors: Object.freeze([]) }));
        continue;
      }
      results.push(Object.freeze({ index, status: confirmation.status, purpose: prepared.purpose, review: confirmation.review || review, errors: Object.freeze([]) }));
      continue;
    }
    results.push(Object.freeze({ index, status: review.status, purpose: prepared.purpose, review, errors: Object.freeze(parsed.errors || []) }));
  }
  const pendingReviews = results.filter(result => result.review && !result.review.humanConfirmed);
  return Object.freeze({
    runtimeVersion: BUDGET_BROWSER_INPUT_RUNTIME_VERSION,
    status: pendingReviews.length ? 'awaiting-human-confirmation' : (Object.keys(inputs).length ? 'ready' : (list.length ? 'blocked-no-structured-input' : 'empty')),
    inputs: Object.freeze(inputs),
    results: Object.freeze(results),
    reviews: Object.freeze(reviews),
    pendingReviews: Object.freeze(pendingReviews.map(result => result.review)),
    governance: Object.freeze({
      filesRemainInBrowser: true,
      rawFilenameNotRetainedInEvidence: true,
      localHashBeforeParse: true,
      deterministicStructuredParseRequired: true,
      unsupportedFilesFailClosed: true,
      parserOutputIsNotEvidence: true,
      humanConfirmationRequiredBeforePromotion: true,
      editableReviewModalPreferred: typeof document !== 'undefined',
      ambiguousFilePurposeRequiresHumanSelection: true,
      confirmedInputsMemoryScope: 'current-browser-tab'
    })
  });
}

export { defaultConfirmReview, browserConfirmedInputs, choosePurposeWhenNeeded };
export default Object.freeze({ version: BUDGET_BROWSER_INPUT_RUNTIME_VERSION, prepareBudgetInternalInputsFromFiles });