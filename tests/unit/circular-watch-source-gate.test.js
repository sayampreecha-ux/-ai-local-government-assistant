import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkOfficialUrl, validateSourceCatalog, validateReviewQueue } from '../../scripts/circular-watch-source-gate.mjs';
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
