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
  for (const s of input?.sources || []) {
    if (!s.id || seen.has(s.id)) errors.push('DUPLICATE_OR_MISSING_SOURCE_ID');
    seen.add(s.id);
    if (!checkOfficialUrl(s.url)) errors.push('UNAPPROVED_SOURCE_URL');
    if (s.mode !== 'MANUAL_REVIEW') errors.push('UNSUPPORTED_AUTOMATIC_INGESTION');
  }
  return { pass: errors.length === 0, errors };
}
export function validateReviewQueue(queue) {
  const errors = [];
  if (queue?.purpose !== 'LOCAL_REVIEW_ONLY' || queue.publishable !== false || !Array.isArray(queue.entries)) errors.push('INVALID_REVIEW_QUEUE');
  const identities = new Set();
  for (const e of queue?.entries || []) {
    const r = e.record || {};
    const identity = [r.issuingAgency, r.documentNumber].map(x => String(x || '').trim().toLowerCase()).join('|');
    if (!r.issuingAgency || !r.documentNumber || identities.has(identity)) errors.push('DUPLICATE_OR_MISSING_IDENTITY');
    identities.add(identity);
    if (!checkOfficialUrl(r.sourceUrl)) errors.push('OFFICIAL_SOURCE_NOT_VERIFIED');
    if (r.reviewStatus === 'approved') errors.push('UNTRUSTED_APPROVAL_IN_IMPORT');
    if (e.change === 'CHANGED_REVIEW_REQUIRED') errors.push('VERSION_CONFLICT_REQUIRES_REVIEW');
    if (!['NEW','UNCHANGED','CHANGED_REVIEW_REQUIRED'].includes(e.change)) errors.push('INVALID_CHANGE');
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
