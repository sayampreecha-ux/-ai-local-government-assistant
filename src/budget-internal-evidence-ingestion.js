export const BUDGET_INTERNAL_EVIDENCE_INGESTION_VERSION = '1.0';

const DEFINITIONS = Object.freeze({
  baselineBudget: Object.freeze({ required: ['fiscalYear', 'total'] }),
  personnelObligations: Object.freeze({ required: ['total'] }),
  budgetTotals: Object.freeze({ required: [] })
});

const text = (value) => String(value ?? '').trim();
const finite = (value) => Number.isFinite(Number(value));
const validIsoDate = (value) => Boolean(text(value) && Number.isFinite(Date.parse(value)));

function validateCommon(key, entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return ['entry:object-required'];
  if (!['user-provided', 'uploaded-document', 'internal-system'].includes(text(entry.sourceType))) errors.push('sourceType:allowed-value-required');
  if (!text(entry.sourceRef)) errors.push('sourceRef:required');
  if (!validIsoDate(entry.observedAt)) errors.push('observedAt:valid-iso-date-required');
  if (!text(entry.status) || !['verified', 'estimated', 'pending-confirmation'].includes(text(entry.status))) errors.push('status:verified-estimated-or-pending-required');
  if (!entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data)) errors.push('data:object-required');
  for (const field of DEFINITIONS[key]?.required || []) {
    if (entry?.data?.[field] === undefined || entry?.data?.[field] === null || entry?.data?.[field] === '') errors.push(`data.${field}:required`);
  }
  if (key === 'baselineBudget') {
    if (entry?.data?.fiscalYear != null && !Number.isInteger(Number(entry.data.fiscalYear))) errors.push('data.fiscalYear:integer-required');
    if (entry?.data?.total != null && !finite(entry.data.total)) errors.push('data.total:number-required');
  }
  if (key === 'personnelObligations' && entry?.data?.total != null && !finite(entry.data.total)) errors.push('data.total:number-required');
  if (key === 'budgetTotals') {
    const data = entry?.data || {};
    const hasRevenue = finite(data.revenueTotal) || (Array.isArray(data.revenueItems) && data.revenueItems.length > 0);
    const hasExpense = finite(data.expenseTotal) || (Array.isArray(data.expenseItems) && data.expenseItems.length > 0);
    if (!hasRevenue) errors.push('data.revenue:total-or-items-required');
    if (!hasExpense) errors.push('data.expense:total-or-items-required');
  }
  if (entry?.sourceType === 'uploaded-document' && !text(entry.contentHash)) errors.push('contentHash:required-for-uploaded-document');
  return errors;
}

function toEvidence(key, entry) {
  return Object.freeze({
    key,
    value: Object.freeze({ ...entry.data, evidenceStatus: text(entry.status) }),
    official: false,
    verified: entry.status === 'verified',
    fresh: true,
    current: true,
    provenance: Object.freeze({
      sourceType: text(entry.sourceType),
      sourceRef: text(entry.sourceRef),
      observedAt: text(entry.observedAt),
      contentHash: text(entry.contentHash),
      ingestedBy: `budget-internal-evidence-ingestion/${BUDGET_INTERNAL_EVIDENCE_INGESTION_VERSION}`
    })
  });
}

export function ingestInternalBudgetEvidence({ inputs = {} } = {}) {
  const accepted = [];
  const rejected = [];
  for (const key of Object.keys(DEFINITIONS)) {
    const entry = inputs?.[key];
    if (!entry) continue;
    const errors = validateCommon(key, entry);
    if (errors.length) rejected.push(Object.freeze({ key, errors: Object.freeze(errors) }));
    else accepted.push(toEvidence(key, entry));
  }
  const acceptedKeys = accepted.map(item => item.key);
  const missingKeys = Object.keys(DEFINITIONS).filter(key => !acceptedKeys.includes(key));
  const pendingKeys = accepted.filter(item => item.value.evidenceStatus === 'pending-confirmation').map(item => item.key);
  return Object.freeze({
    ingestionVersion: BUDGET_INTERNAL_EVIDENCE_INGESTION_VERSION,
    status: rejected.length ? 'blocked-invalid-internal-evidence' : missingKeys.length ? 'partial' : pendingKeys.length ? 'blocked-pending-confirmation' : 'ready',
    evidence: Object.freeze(accepted),
    acceptedKeys: Object.freeze(acceptedKeys),
    missingKeys: Object.freeze(missingKeys),
    pendingKeys: Object.freeze(pendingKeys),
    rejected: Object.freeze(rejected),
    failClosed: rejected.length > 0 || missingKeys.length > 0 || pendingKeys.length > 0,
    governance: Object.freeze({
      noFabrication: true,
      sourceReferenceRequired: true,
      uploadedDocumentHashRequired: true,
      pendingConfirmationCannotFinalize: true
    })
  });
}

export { DEFINITIONS as BUDGET_INTERNAL_EVIDENCE_DEFINITIONS };
