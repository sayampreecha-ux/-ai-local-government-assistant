#!/usr/bin/env node
// Offline, fail-closed official-source and review-queue validation. No network, no publishing.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const allowed = new Set(['dla.go.th','www.dla.go.th','moi.go.th','cmsmoi.moi.go.th','ratchakitcha.soc.go.th']);
export function checkOfficialUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.port && allowed.has(u.hostname.toLowerCase());
  } catch { return false; }
}
export function validateSourceCatalog(input) {
  const errors = [];
  if (input?.schemaVersion !== '1.0' || !Array.isArray(input.sources) || !input.sources.length) errors.push('INVALID_CATALOG');
  const seen = new Set();
  for (const s of (Array.isArray(input?.sources) ? input.sources : [])) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) { errors.push('INVALID_SOURCE_ENTRY'); continue; }
    if (!s.id || seen.has(s.id)) errors.push('DUPLICATE_OR_MISSING_SOURCE_ID');
    seen.add(s.id);
    if (!checkOfficialUrl(s.url)) errors.push('UNAPPROVED_SOURCE_URL');
    if (s.mode !== 'MANUAL_REVIEW') errors.push('UNSUPPORTED_AUTOMATIC_INGESTION');
  }
  return { pass: errors.length === 0, errors };
}
// Document-level readiness is advisory only: metadata cannot authenticate a PDF or confer approval.
export function validateDocumentEvidence(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) return { pass: false, decision: 'DECISION_LOCK', errors: ['INVALID_DOCUMENT'] };
  const required = ['id', 'documentTitle', 'documentNumber', 'issuingAgency', 'documentDate', 'sourceUrl'];
  for (const field of required) if (typeof record[field] !== 'string' || !record[field].trim()) errors.push('MISSING_' + field.toUpperCase());
  if (!checkOfficialUrl(record.sourceUrl)) errors.push('UNAPPROVED_DOCUMENT_URL');
  const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  if (record.documentDate && !validDate(record.documentDate)) errors.push('INVALID_DOCUMENT_DATE');
  if (record.effectiveDate && !validDate(record.effectiveDate)) errors.push('INVALID_EFFECTIVE_DATE');
  if (!Array.isArray(record.evidence) || !record.evidence.length || record.evidence.some(x => typeof x !== 'string' || !x.trim())) errors.push('DOCUMENT_EVIDENCE_REQUIRED');
  if (typeof record.excerptLocator !== 'string' || !record.excerptLocator.trim()) errors.push('EVIDENCE_LOCATOR_REQUIRED');
  if (typeof record.documentSha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(record.documentSha256)) errors.push('DOCUMENT_HASH_REQUIRED');
  if (typeof record.lastVerifiedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(record.lastVerifiedAt) || !validDate(record.lastVerifiedAt.slice(0, 10)) || !Number.isFinite(Date.parse(record.lastVerifiedAt))) errors.push('VERIFICATION_TIMESTAMP_REQUIRED');
  if (typeof record.authorityEvidence !== 'string' || !record.authorityEvidence.trim()) errors.push('AUTHORITY_REVIEW_REQUIRED');
  if (typeof record.versionEvidence !== 'string' || !record.versionEvidence.trim() || !['current', 'amended', 'repealed', 'superseded'].includes(record.status)) errors.push('VERSION_REVIEW_REQUIRED');
  if (record.reviewStatus === 'approved') errors.push('APPROVAL_CANNOT_BE_IMPORTED');
  if (['repealed', 'superseded', 'amended'].includes(record.status)) {
    const links = [record.supersedesDocumentId, record.supersededByDocumentId, ...(Array.isArray(record.amendedBy) ? record.amendedBy : []), ...(Array.isArray(record.repealedBy) ? record.repealedBy : [])];
    if (!links.some(x => typeof x === 'string' && x.trim())) errors.push('VERSION_RELATION_EVIDENCE_REQUIRED');
  }
  // Even a fully populated candidate remains unverified until an authorized reviewer checks the original.
  return { pass: errors.length === 0, decision: 'DECISION_LOCK', publishable: false, errors };
}
export function validateReviewQueue(queue) {
  const errors = [];
  if (queue?.purpose !== 'LOCAL_REVIEW_ONLY' || queue.publishable !== false || !Array.isArray(queue.entries)) errors.push('INVALID_REVIEW_QUEUE');
  const identities = new Set();
  for (const e of (Array.isArray(queue?.entries) ? queue.entries : [])) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) { errors.push('INVALID_REVIEW_ENTRY'); continue; }
    const r = e.record && typeof e.record === 'object' && !Array.isArray(e.record) ? e.record : {};
    const identity = [r.issuingAgency, r.documentNumber].map(x => String(x || '').trim().toLowerCase()).join('|');
    if (!r.issuingAgency || !r.documentNumber || identities.has(identity)) errors.push('DUPLICATE_OR_MISSING_IDENTITY');
    identities.add(identity);
    if (!checkOfficialUrl(r.sourceUrl)) errors.push('OFFICIAL_SOURCE_NOT_VERIFIED');
    if (r.reviewStatus === 'approved') errors.push('UNTRUSTED_APPROVAL_IN_IMPORT');
    if (e.change === 'CHANGED_REVIEW_REQUIRED') errors.push('VERSION_CONFLICT_REQUIRES_REVIEW');
    if (e.change === 'BASELINE_NOT_VERIFIED') errors.push('BASELINE_NOT_VERIFIED');
    if (!['NEW','UNCHANGED','CHANGED_REVIEW_REQUIRED','BASELINE_NOT_VERIFIED'].includes(e.change)) errors.push('INVALID_CHANGE');
  }
  return { pass: errors.length === 0, decision: 'DECISION_LOCK', publishable: false, errors };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const catalog = JSON.parse(readFileSync(process.argv[2] || 'knowledge/circulars/official-sources.json','utf8'));
    const result = validateSourceCatalog(catalog);
    console.log(JSON.stringify(result));
    if (!result.pass) process.exitCode = 1;
  } catch (e) { console.error(e.message); process.exitCode = 1; }
}
