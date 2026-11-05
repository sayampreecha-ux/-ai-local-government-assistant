// Fail-closed, offline review evidence preflight. Never authenticates a reviewer or publishes.
const sha256 = /^[a-f0-9]{64}$/i;
const isoTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) && Number.isFinite(Date.parse(value));
export function assessReviewEvidence(record, review) {
  const issues = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) issues.push('INVALID_RECORD');
  if (!record?.sourceUrl || typeof record.sourceUrl !== 'string') issues.push('SOURCE_REQUIRED');
  if (!sha256.test(record?.documentSha256 ?? '')) issues.push('DOCUMENT_HASH_REQUIRED');
  if (!Array.isArray(record?.evidence) || !record.evidence.length || record.evidence.some(x => typeof x !== 'string' || !x.trim())) issues.push('EVIDENCE_REQUIRED');
  if (typeof record?.excerptLocator !== 'string' || !record.excerptLocator.trim()) issues.push('EVIDENCE_LOCATOR_REQUIRED');
  if (!isoTime(record?.lastVerifiedAt)) issues.push('VERIFICATION_TIMESTAMP_REQUIRED');
  if (!review || typeof review !== 'object' || Array.isArray(review)) issues.push('REVIEW_RECORD_REQUIRED');
  if (typeof review?.reviewerLogin !== 'string' || !/^[a-z\d](?:[a-z\d-]{0,37})$/i.test(review.reviewerLogin)) issues.push('REVIEWER_ID_REQUIRED');
  if (typeof review?.reviewUrl !== 'string' || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+(?:#pullrequestreview-\d+)?$/.test(review.reviewUrl)) issues.push('REVIEW_LINK_REQUIRED');
  if (!isoTime(review?.reviewedAt)) issues.push('REVIEW_TIMESTAMP_REQUIRED');
  if (review?.documentSha256 !== record?.documentSha256 || !sha256.test(review?.documentSha256 ?? '')) issues.push('REVIEW_HASH_MISMATCH');
  if (review?.decision !== 'APPROVED') issues.push('APPROVAL_NOT_RECORDED');
  // JSON cannot authenticate GitHub identity, permissions, PDF content or freshness.
  // Independent trusted verification is required before publication.
  return Object.freeze({ pass: issues.length === 0, decision: 'DECISION_LOCK', publishable: false, authenticated: false, issues: Object.freeze(issues) });
}
