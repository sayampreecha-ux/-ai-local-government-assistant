import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createCircularRegistry, normalizeRecord } = require('../../assets/js/core/circular-watch-registry.js');
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
