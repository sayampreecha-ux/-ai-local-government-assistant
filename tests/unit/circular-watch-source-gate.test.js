import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkOfficialUrl, validateSourceCatalog, validateReviewQueue, validateDocumentEvidence } from '../../scripts/circular-watch-source-gate.mjs';
const catalog = JSON.parse(readFileSync('knowledge/circulars/official-sources.json','utf8'));
test('official discovery catalog validates but is not an ingestion feed', () => {
  assert.equal(validateSourceCatalog(catalog).pass,true);
  assert.ok(catalog.sources.every(s=>s.mode==='MANUAL_REVIEW'));
});
test('reject lookalike hosts, HTTP, credentials, ports and third-party sources', () => {
  for (const url of ['http://www.dla.go.th/land/officialDoc.do','https://dla.go.th.evil.test/','https://bad@dla.go.th/','https://dla.go.th:8443/','https://example.com/']) assert.equal(checkOfficialUrl(url),false,url);
  assert.equal(checkOfficialUrl('https://www.dla.go.th/land/officialDoc.do'),true);
});
test('catalog fails closed for automatic ingestion and duplicate IDs', () => {
  assert.equal(validateSourceCatalog({...catalog,sources:[catalog.sources[0],catalog.sources[0]]}).pass,false);
  assert.equal(validateSourceCatalog({...catalog,sources:[{...catalog.sources[0],mode:'AUTO'}]}).pass,false);
});
const record = { issuingAgency:'กรมส่งเสริมการปกครองท้องถิ่น',documentNumber:'TEST-ONLY',sourceUrl:'https://www.dla.go.th/land/officialDoc.do',reviewStatus:'pending' };
const queue = entries => ({purpose:'LOCAL_REVIEW_ONLY',publishable:false,entries});
test('staged official URL never becomes publication approval', () => {
  const r=validateReviewQueue(queue([{change:'NEW',record}]));
  assert.equal(r.pass,true); assert.equal(r.publishable,false); assert.equal(r.decision,'DECISION_LOCK');
});
test('reject untrusted approvals, conflicts, duplicate records and forged source URLs', () => {
  assert.equal(validateReviewQueue(queue([{change:'NEW',record:{...record,reviewStatus:'approved'}}])).pass,false);
  assert.equal(validateReviewQueue(queue([{change:'CHANGED_REVIEW_REQUIRED',record}])).pass,false);
  assert.equal(validateReviewQueue(queue([{change:'NEW',record},{change:'NEW',record}])).pass,false);
  assert.equal(validateReviewQueue(queue([{change:'NEW',record:{...record,sourceUrl:'https://dla.go.th.attacker.test/'}}])).pass,false);
});

test('malformed catalog and review queues fail closed without throwing', () => {
  for (const sources of [null, 'invalid', {}, [null], [42]]) {
    const result = validateSourceCatalog({schemaVersion:'1.0',sources});
    assert.equal(result.pass,false);
  }
  for (const entries of [null, 'invalid', {}, [null], [42]]) {
    const result = validateReviewQueue({purpose:'LOCAL_REVIEW_ONLY',publishable:false,entries});
    assert.equal(result.pass,false);
    assert.equal(result.decision,'DECISION_LOCK');
    assert.equal(result.publishable,false);
  }
});

test('document-level evidence readiness fails closed for missing metadata and forged approval', () => {
  const missing = validateDocumentEvidence({id:'x',documentTitle:'Test',documentNumber:'T1',issuingAgency:'Agency',sourceUrl:'https://www.dla.go.th/land/officialDoc.do',reviewStatus:'pending'});
  assert.equal(missing.pass,false);
  assert.ok(missing.errors.includes('MISSING_DOCUMENTDATE'));
  assert.ok(missing.errors.includes('DOCUMENT_EVIDENCE_REQUIRED'));
  assert.equal(missing.decision,'DECISION_LOCK');
  const candidate = {id:'x',documentTitle:'Test',documentNumber:'T1',issuingAgency:'Agency',documentDate:'2026-01-01',sourceUrl:'https://www.dla.go.th/land/officialDoc.do',evidence:['Synthetic evidence'],excerptLocator:'page 1',lastVerifiedAt:'2026-01-01T00:00:00Z',reviewStatus:'pending',status:'current',documentSha256:'a'.repeat(64),authorityEvidence:'Synthetic authority',versionEvidence:'Synthetic version'};
  for (const [fields, error] of [
    [{ documentSha256: '' }, 'DOCUMENT_HASH_REQUIRED'],
    [{ authorityEvidence: ' ' }, 'AUTHORITY_REVIEW_REQUIRED'],
    [{ versionEvidence: '' }, 'VERSION_REVIEW_REQUIRED'],
    [{ status: 'unknown' }, 'VERSION_REVIEW_REQUIRED'],
    [{ lastVerifiedAt: '2026-01-01' }, 'VERIFICATION_TIMESTAMP_REQUIRED'],
    [{ lastVerifiedAt: '2026-02-30T00:00:00Z' }, 'VERIFICATION_TIMESTAMP_REQUIRED'],
    [{ excerptLocator: ' ' }, 'EVIDENCE_LOCATOR_REQUIRED'],
  ]) assert.ok(validateDocumentEvidence({...candidate, ...fields}).errors.includes(error), error);
  const result=validateDocumentEvidence(candidate);
  assert.equal(result.pass,true);
  assert.equal(result.publishable,false);
  assert.equal(result.decision,'DECISION_LOCK');
  assert.equal(validateDocumentEvidence({...candidate,reviewStatus:'approved'}).pass,false);
  assert.equal(validateDocumentEvidence({...candidate,status:'repealed'}).pass,false);
  assert.equal(validateDocumentEvidence({...candidate,documentDate:'2026-02-30'}).pass,false);
});
