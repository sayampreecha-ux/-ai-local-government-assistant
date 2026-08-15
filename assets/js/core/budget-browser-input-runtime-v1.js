import { prepareBudgetBrowserFile } from '../../../src/budget-browser-file-ingestion.js';
import { parseBudgetBrowserFile } from '../../../src/budget-browser-file-parser.js';

export const BUDGET_BROWSER_INPUT_RUNTIME_VERSION = '1.0';

export async function prepareBudgetInternalInputsFromFiles(files = [], { targetYear = null, purposeByIndex = {} } = {}) {
  const list = Array.isArray(files) ? files : Array.from(files || []);
  const inputs = {};
  const results = [];
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
    results.push(Object.freeze({ index, status: parsed.status, purpose: prepared.purpose, errors: Object.freeze(parsed.errors || []) }));
    if (parsed.status !== 'ready') continue;
    inputs[prepared.purpose] = Object.freeze({
      sourceType: 'uploaded-document',
      sourceRef: prepared.file.safeRef,
      observedAt: prepared.file.observedAt,
      status: 'verified',
      contentHash: prepared.file.contentHash,
      data: parsed.data
    });
  }
  return Object.freeze({
    runtimeVersion: BUDGET_BROWSER_INPUT_RUNTIME_VERSION,
    status: Object.keys(inputs).length ? (results.some(result => result.status !== 'ready') ? 'partial' : 'ready') : (list.length ? 'blocked-no-structured-input' : 'empty'),
    inputs: Object.freeze(inputs),
    results: Object.freeze(results),
    governance: Object.freeze({
      filesRemainInBrowser: true,
      rawFilenameNotRetainedInEvidence: true,
      localHashBeforeParse: true,
      deterministicStructuredParseRequired: true,
      unsupportedFilesFailClosed: true
    })
  });
}

export default Object.freeze({ version: BUDGET_BROWSER_INPUT_RUNTIME_VERSION, prepareBudgetInternalInputsFromFiles });
