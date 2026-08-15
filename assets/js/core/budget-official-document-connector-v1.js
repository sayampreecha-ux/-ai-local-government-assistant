import { parseOfficialBudgetDocument } from '../../../src/budget-official-document-parser.js';

export const BUDGET_OFFICIAL_DOCUMENT_CONNECTOR_VERSION = '1.1';
export const DEFAULT_BUDGET_DOCUMENT_ENDPOINT = 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-document';

const safe = (value, max = 1800) => String(value ?? '').trim().slice(0, max);

export async function readOfficialBudgetDocument(sourceUrl, targetKey, { targetYear = null, endpoint = DEFAULT_BUDGET_DOCUMENT_ENDPOINT } = {}) {
  const url = safe(sourceUrl);
  if (!url) return Object.freeze({ status: 'blocked-source-url-missing', readDocument: null, errors: Object.freeze(['sourceUrl:required']) });
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST', credentials: 'omit', cache: 'no-store',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url })
    });
  } catch {
    return Object.freeze({ status: 'blocked-document-reader-network', readDocument: null, errors: Object.freeze(['document-reader:network-error']) });
  }
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok || payload?.ok !== true || !safe(payload?.rawContent, 1_000_000)) {
    return Object.freeze({ status: 'blocked-document-reader', readDocument: null, errors: Object.freeze([safe(payload?.error || `http-${response.status}`,160)]) });
  }
  const parsed = parseOfficialBudgetDocument(targetKey,payload.rawContent,{targetYear});
  if (!parsed.valid) return Object.freeze({ status:'blocked-document-parse', readDocument:null, errors:parsed.errors });
  return Object.freeze({
    status:'ready',
    readDocument:Object.freeze({
      sourceUrl:url, resolvedUrl:safe(payload.resolvedUrl), contentHash:safe(payload.contentHash,128), readAt:safe(payload.extractedAt,80),
      reader:`govprompt-budget-reader/${BUDGET_OFFICIAL_DOCUMENT_CONNECTOR_VERSION}:${safe(payload.provider,80)}`,
      contentReadAndVerified:true, official:true, current:true, fresh:true, structuredData:parsed.data,
      extraction:Object.freeze({ provider:safe(payload.provider,80), requestId:safe(payload.requestId,160), contentLength:Number(payload.contentLength||0), truncated:Boolean(payload.truncated), extractionProviderIsNotSourceAuthority:true })
    }),
    errors:Object.freeze([])
  });
}

export function createBudgetOfficialDocumentConnector(options = {}) {
  return Object.freeze({ read:(sourceUrl,targetKey,context={})=>readOfficialBudgetDocument(sourceUrl,targetKey,{...options,...context}) });
}

export default Object.freeze({ version:BUDGET_OFFICIAL_DOCUMENT_CONNECTOR_VERSION, endpoint:DEFAULT_BUDGET_DOCUMENT_ENDPOINT, readOfficialBudgetDocument, createBudgetOfficialDocumentConnector });
