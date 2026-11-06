import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const context = { window: {}, URL };
runInNewContext(readFileSync(new URL('../../assets/js/core/circular-watch-registry.js', import.meta.url), 'utf8'), context);
const { createCircularRegistry, normalizeRecord, officialUrl } = context.window.GovPromptCore.CircularWatch;
const sample = (overrides = {}) => ({
  id: 'c1', documentTitle: 'Example only — not an official circular',
  documentNumber: 'TEST/001', issuingAgency: 'Test Agency',
  sourceUrl: 'https://example.go.th/test.pdf', documentDate: '2026-10-01',
  effectiveDate: '2026-10-02', status: 'unknown', ...overrides
});
test('unreviewed records are locked and never assert live verification', () => {
  const result = createCircularRegistry([sample()]).assess('c1', '2026-11-02');
  assert.equal(result.decision, 'DECISION_LOCK');
  assert.equal(result.verifiedLatest, false);
  assert.equal(result.checkedLive, false);
});
test('approved records with evidence are only reviewed, not latest', () => {
  const r = createCircularRegistry([sample({status:'current',reviewStatus:'approved',lastVerifiedAt:'2026-10-31T12:00:00Z',evidence:['https://example.go.th/test.pdf']})]).assess('c1','2026-11-02');
  assert.equal(r.decision,'REVIEWED_RECORD');
  assert.equal(r.verifiedLatest,false);
  assert.equal(r.conclusionEligible,false);
});
test('future-effective records are locked', () => {
  const r = createCircularRegistry([sample({status:'current',reviewStatus:'approved',lastVerifiedAt:'2026-10-31T12:00:00Z',evidence:['source reviewed'],effectiveDate:'2027-01-01'})]).assess('c1','2026-11-02');
  assert.ok(r.issues.includes('NOT_YET_EFFECTIVE'));
});
test('duplicate agency and document number are rejected', () => {
  assert.throws(() => createCircularRegistry([sample(),sample({id:'c2'})]), /Duplicate/);
});
test('invalid calendar dates and non-HTTPS URLs are rejected', () => {
  assert.throws(() => normalizeRecord(sample({documentDate:'2026-02-30'})), /date/i);
  assert.throws(() => normalizeRecord(sample({sourceUrl:'http://example.go.th'})), /HTTPS/);
});
test('search supports Thai keywords and bounded pagination', () => {
  const reg = createCircularRegistry([sample({keywords:['การเงิน']}),sample({id:'c2',documentNumber:'TEST/002',category:'บุคคล'})]);
  assert.equal(reg.search('การเงิน').total,1);
  assert.equal(reg.search('',{limit:1}).items.length,1);
  assert.equal(reg.search('',{offset:1}).items[0].id,'c2');
});
test('repealed status is never conclusion eligible', () => {
  const r = createCircularRegistry([sample({status:'repealed',reviewStatus:'approved',lastVerifiedAt:'2026-10-31T12:00:00Z',evidence:['source reviewed']})]).assess('c1','2026-11-02');
  assert.equal(r.conclusionEligible,false);
  assert.ok(r.issues.includes('NOT_CURRENT'));
});

test('year and status filters work without fetching all records', () => {
  const reg = createCircularRegistry([
    sample({status:'current'}), sample({id:'c2',documentNumber:'TEST/002',documentDate:'2025-10-01'})
  ]);
  assert.equal(reg.search('',{year:'2026'}).total,1);
  assert.equal(reg.search('',{status:'current'}).total,1);
});
test('supersession relationships trigger review rather than declaring current', () => {
  const reg = createCircularRegistry([
    sample({status:'current',reviewStatus:'approved',lastVerifiedAt:'2026-10-31T12:00:00Z',evidence:['reviewed']}),
    sample({id:'c2',documentNumber:'TEST/002',supersedesDocumentId:'c1'})
  ]);
  assert.ok(reg.assess('c1','2026-11-02').issues.includes('RELATED_VERSION_REQUIRES_REVIEW'));
});
const { stageReviewQueue, isPublishedRecord } = context.window.GovPromptCore.CircularWatch;
const ready = overrides => sample({sourceUrl:'https://www.dla.go.th/original.pdf',documentSha256:'a'.repeat(64),evidence:['Original page 1 inspected'],excerptLocator:'page 1',lastVerifiedAt:'2026-11-01T00:00:00Z',authorityEvidence:'Issuer and signature checked',versionEvidence:'Related editions checked; no latest assertion',status:'current',...overrides});
test('hash and authority/version evidence survive normalization; complete candidates stage but never verify', () => {
  const q = stageReviewQueue([ready()]);
  assert.equal(q.entries[0].record.documentSha256,'a'.repeat(64));
  assert.equal(q.entries[0].lifecycle,'STAGED');
  assert.equal(q.entries[0].decision,'DECISION_LOCK');
  assert.equal(q.lifecycleCounts.VERIFIED,0);
  assert.equal(q.lifecycleCounts.PUBLISHED,0);
  assert.equal(q.publishable,false);
  assert.equal(isPublishedRecord(q.entries[0].record),false);
});
test('incomplete discovery remains distinct from staged original evidence', () => {
  const q = stageReviewQueue([sample()]);
  assert.equal(q.entries[0].lifecycle,'DISCOVERED');
  assert.ok(q.entries[0].issues.includes('ORIGINAL_DOCUMENT_HASH_REQUIRED'));
});
test('import refuses forged approval and publication even with alternate case or whitespace', () => {
  for (const fields of [{reviewStatus:'approved'},{reviewStatus:' APPROVED '},{publicationStatus:'VERIFIED'},{publicationStatus:'PUBLISHED'},{publicationStatus:' PUBLISHED '}]) assert.throws(()=>stageReviewQueue([ready(fields)]),/cannot be imported/);
});
test('changed hashes and amendments/repeals require review; unchanged reload is idempotent', () => {
  const old=ready();
  assert.equal(stageReviewQueue([old],[old]).entries[0].change,'UNCHANGED');
  for (const fields of [{documentSha256:'b'.repeat(64)},{status:'amended',amendedBy:['new']},{status:'repealed',repealedBy:['new']},{status:'superseded',supersededByDocumentId:'new'}]) {
    const item=stageReviewQueue([ready(fields)],[old]).entries[0];
    assert.equal(item.change,'CHANGED_REVIEW_REQUIRED');
    assert.equal(item.decision,'DECISION_LOCK');
  }
  assert.ok(stageReviewQueue([ready({status:'repealed'})]).entries[0].issues.includes('VERSION_RELATION_EVIDENCE_REQUIRED'));
});
test('public records require publication, human approval, original evidence and approved host', () => {
  assert.equal(isPublishedRecord(normalizeRecord(ready({publicationStatus:'PUBLISHED',reviewStatus:'approved'}))),true);
  for (const fields of [{reviewStatus:'pending'},{publicationStatus:'VERIFIED'},{documentSha256:''},{sourceUrl:'https://dla.go.th.attacker.example/file.pdf'},{authorityEvidence:''}]) assert.equal(isPublishedRecord(normalizeRecord(ready({publicationStatus:'PUBLISHED',reviewStatus:'approved',...fields}))),false);
});
test('Thai year search resolves to Gregorian dates', () => assert.equal(createCircularRegistry([sample()]).search('',{year:'2569'}).total,1));
test('offline queue never labels an unknown public baseline NEW',()=>{
  const q=stageReviewQueue([ready()],null);
  assert.equal(q.entries[0].change,'BASELINE_NOT_VERIFIED');
  assert.equal(q.entries[0].lifecycle,'DISCOVERED');
  assert.ok(q.entries[0].issues.includes('BASELINE_NOT_VERIFIED'));
});
test('document-number spacing and Thai digits cannot evade duplicate or changed-version detection',()=>{
  assert.throws(()=>createCircularRegistry([sample(),sample({id:'c2',documentNumber:'TEST / ๐๐๑'})]),/Duplicate/);
  const q=stageReviewQueue([ready({documentNumber:' TEST / ๐๐๑ ',documentSha256:'b'.repeat(64)})],[ready()]);
  assert.equal(q.entries[0].change,'CHANGED_REVIEW_REQUIRED');
});

test('official URL policy accepts the exact Ministry anti-corruption centre host', () => {
  assert.equal(officialUrl('https://anticor1.moi.go.th/test.pdf'), true);
  assert.equal(officialUrl('https://anticor1.moi.go.th.example.com/test.pdf'), false);
});
