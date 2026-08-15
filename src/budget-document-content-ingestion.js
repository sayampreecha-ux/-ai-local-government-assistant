export const BUDGET_DOCUMENT_CONTENT_INGESTION_VERSION = '1.0';

const SOURCE_BY_TARGET = Object.freeze({
  latestRevenueActuals: 'latestRevenueActualsSource',
  targetYearPlan: 'targetYearPlanSource'
});

const text = (value) => String(value ?? '').trim();
const validIsoDate = (value) => Boolean(text(value) && Number.isFinite(Date.parse(value)));
const evidenceIndex = (evidence = []) => new Map((Array.isArray(evidence) ? evidence : []).filter((item) => text(item?.key)).map((item) => [text(item.key), item]));

function validSourcePointer(pointer) {
  return Boolean(
    pointer &&
    pointer.official === true &&
    pointer.verified === true &&
    pointer.fresh !== false &&
    pointer.current !== false &&
    text(pointer?.value?.sourceUrl)
  );
}

function validateReadDocument(targetKey, readDocument, sourcePointer) {
  const errors = [];
  if (!readDocument || typeof readDocument !== 'object' || Array.isArray(readDocument)) return ['document:object-required'];
  if (!validSourcePointer(sourcePointer)) errors.push('source-pointer:verified-official-current-required');
  if (text(readDocument.sourceUrl) !== text(sourcePointer?.value?.sourceUrl)) errors.push('sourceUrl:must-match-source-pointer');
  if (!text(readDocument.contentHash)) errors.push('contentHash:required');
  if (!validIsoDate(readDocument.readAt)) errors.push('readAt:valid-iso-date-required');
  if (!text(readDocument.reader)) errors.push('reader:required');
  if (readDocument.contentReadAndVerified !== true) errors.push('contentReadAndVerified:true-required');
  if (readDocument.official !== true) errors.push('official:true-required');
  if (readDocument.current !== true || readDocument.fresh !== true) errors.push('current-and-fresh:true-required');

  const data = readDocument.structuredData;
  if (!data || typeof data !== 'object' || Array.isArray(data)) errors.push('structuredData:object-required');
  else if (targetKey === 'latestRevenueActuals') {
    const hasRows = Array.isArray(data.rows) && data.rows.length > 0;
    const hasTotal = Number.isFinite(Number(data.total));
    if (!hasRows && !hasTotal) errors.push('structuredData:revenue-rows-or-total-required');
    if (data.total != null && !Number.isFinite(Number(data.total))) errors.push('structuredData.total:number-required');
  } else if (targetKey === 'targetYearPlan') {
    if (!Number.isInteger(Number(data.targetYear))) errors.push('structuredData.targetYear:integer-required');
    if (!Array.isArray(data.projects) || data.projects.length === 0) errors.push('structuredData.projects:non-empty-array-required');
  }
  return errors;
}

function evidenceFromReadDocument(targetKey, readDocument, sourcePointer) {
  const sourceEvidenceKey = SOURCE_BY_TARGET[targetKey];
  return Object.freeze({
    key: targetKey,
    value: Object.freeze({ ...readDocument.structuredData }),
    official: true,
    verified: true,
    fresh: true,
    current: true,
    provenance: Object.freeze({
      sourceType: 'verified-document-content',
      sourceEvidenceKey,
      sourceUrl: text(readDocument.sourceUrl),
      documentTitle: text(sourcePointer?.value?.documentTitle),
      contentHash: text(readDocument.contentHash),
      readAt: text(readDocument.readAt),
      reader: text(readDocument.reader),
      contentReadAndVerified: true
    })
  });
}

export function ingestVerifiedBudgetDocumentContent({ evidence = [], readDocuments = {} } = {}) {
  const index = evidenceIndex(evidence);
  const accepted = [];
  const rejected = [];

  for (const targetKey of Object.keys(SOURCE_BY_TARGET)) {
    const sourceEvidenceKey = SOURCE_BY_TARGET[targetKey];
    const sourcePointer = index.get(sourceEvidenceKey);
    const readDocument = readDocuments?.[targetKey];
    const errors = validateReadDocument(targetKey, readDocument, sourcePointer);
    if (errors.length) {
      rejected.push(Object.freeze({ targetKey, sourceEvidenceKey, errors: Object.freeze(errors) }));
      continue;
    }
    accepted.push(evidenceFromReadDocument(targetKey, readDocument, sourcePointer));
  }

  const acceptedKeys = accepted.map((item) => item.key);
  const missingKeys = Object.keys(SOURCE_BY_TARGET).filter((key) => !acceptedKeys.includes(key));
  return Object.freeze({
    ingestionVersion: BUDGET_DOCUMENT_CONTENT_INGESTION_VERSION,
    status: missingKeys.length ? (accepted.length ? 'partial' : 'blocked-unverified-document-content') : 'ready',
    evidence: Object.freeze(accepted),
    acceptedKeys: Object.freeze(acceptedKeys),
    missingKeys: Object.freeze(missingKeys),
    rejected: Object.freeze(rejected),
    failClosed: missingKeys.length > 0,
    governance: Object.freeze({
      sourcePointerMustMatchReadDocument: true,
      contentHashRequired: true,
      structuredExtractionRequired: true,
      noNumericExtractionFromSearchSnippet: true
    })
  });
}

export { SOURCE_BY_TARGET as BUDGET_DOCUMENT_SOURCE_BY_TARGET };
