import { prepareBudgetBrowserFile } from '../../../src/budget-browser-file-ingestion.js';
import { parseBudgetBrowserFile } from '../../../src/budget-browser-file-parser.js';
import { createParsedBudgetReview, confirmParsedBudgetReview } from '../../../src/budget-file-parser-review.js';

export const BUDGET_BROWSER_INPUT_RUNTIME_VERSION = '1.2';

export async function prepareBudgetInternalInputsFromFiles(files = [], { targetYear = null, purposeByIndex = {}, confirmedInputs = {}, confirmReview = null } = {}) {
  const list = Array.isArray(files) ? files : Array.from(files || []);
  const inputs = { ...(confirmedInputs || {}) };
  const results = [];
  const reviews = [];
  for (let index = 0; index < list.length; index += 1) {
    const file = list[index];
    const explicitPurpose = purposeByIndex[index] || null;
    let prepared;
    try { prepared = await prepareBudgetBrowserFile(file, { purpose: explicitPurpose }); }
    catch { prepared = { status: 'rejected', errors: ['file-preparation:failed'] }; }
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
    if (typeof confirmReview === 'function') {
      try { decision = await confirmReview(review); } catch { decision = null; }
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
      humanConfirmationRequiredBeforePromotion: true
    })
  });
}

export default Object.freeze({ version: BUDGET_BROWSER_INPUT_RUNTIME_VERSION, prepareBudgetInternalInputsFromFiles });
