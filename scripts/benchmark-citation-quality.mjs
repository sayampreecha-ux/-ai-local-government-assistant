import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {}, URL, Date, console, globalThis: {} };
for (const file of [
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;

const docs = [
  { id:'cgd-1', title:'หนังสือเวียนกรมบัญชีกลาง', agency:'กรมบัญชีกลาง', reference:'กค 0000/1', documentDate:'2026-08-01', effectiveDate:'2026-08-01', sourceURL:'https://www.cgd.go.th/doc/1', version:'1.0' },
  { id:'dla-1', title:'หนังสือสั่งการ สถ.', agency:'กรมส่งเสริมการปกครองท้องถิ่น', reference:'มท 0808/1', documentDate:'2026-08-02', effectiveDate:'2026-08-02', sourceURL:'https://www.dla.go.th/doc/1', version:'1.0' },
  { id:'law-1', title:'กฎหมายท้องถิ่น', agency:'สำนักงานคณะกรรมการกฤษฎีกา', reference:'ฉบับ 1', documentDate:'2025-01-01', effectiveDate:'2025-01-01', sourceURL:'https://www.krisdika.go.th/doc/1', version:'1.0' },
  { id:'law-2', title:'กฎหมายท้องถิ่น', agency:'สำนักงานคณะกรรมการกฤษฎีกา', reference:'ฉบับ 2', documentDate:'2026-01-01', effectiveDate:'2026-01-01', sourceURL:'https://www.krisdika.go.th/doc/2', version:'2.0' }
];

for (const doc of docs) {
  const verified = core.verifySource(doc);
  assert.equal(verified.verified, true, `${doc.id}: official source should verify`);
  const citation = core.createCitation(doc);
  assert.equal(citation.sourceVerified, true, `${doc.id}: citation should be verified`);
  assert.equal(Boolean(citation.title), true, `${doc.id}: title missing`);
  assert.equal(Boolean(citation.agency), true, `${doc.id}: agency missing`);
  assert.equal(Boolean(citation.reference), true, `${doc.id}: reference missing`);
  assert.equal(Boolean(citation.sourceURL), true, `${doc.id}: URL missing`);
}

assert.equal(core.verifySource({ ...docs[0], sourceURL:'http://www.cgd.go.th/doc/1' }).verified, false);
assert.equal(core.verifySource({ ...docs[0], sourceURL:'https://example.com/doc/1' }).verified, false);
assert.throws(() => core.createCitation({ ...docs[0], sourceURL:'https://example.com/doc/1' }), /Unverified/);

const selected = core.selectNewestEffectiveVersions([docs[2], docs[3]], '2026-08-08');
assert.equal(selected.length, 1);
assert.equal(selected[0].id, 'law-2');
assert.throws(() => core.rejectObsoleteVersion(docs[2], [docs[2], docs[3]], '2026-08-08'), /Obsolete/);

const plan = { originalQuery:'หนังสือเวียนกรมบัญชีกลางล่าสุด', queryTerms:['หนังสือเวียนกรมบัญชีกลาง','ล่าสุด'] };
const ranked = core.rankOfficialSearchResults([
  { title:'หนังสือเวียนกรมบัญชีกลางล่าสุด', url:'https://www.cgd.go.th/current', snippet:'หนังสือเวียนกรมบัญชีกลางฉบับล่าสุด', documentNumber:'กค 0000/9', documentDate:'2026-08-08' },
  { title:'บทความสรุป', url:'https://example.com/summary', snippet:'สรุปหนังสือเวียนกรมบัญชีกลาง' },
  { title:'ข่าวเก่า', url:'https://www.cgd.go.th/old', snippet:'ข่าวประชาสัมพันธ์ทั่วไป' }
], plan);
assert.equal(ranked[0].official, true);
assert.equal(ranked[0].sourceId, 'cgd');
assert.equal(ranked[0].queryRelevance > ranked[1].queryRelevance, true);

const evidenceFresh = core.createOfficialSearchEvidence(ranked, { verifiedCurrent:true, best:ranked[0] }, { verificationRequired:true });
assert.equal(evidenceFresh.primaryResults.length >= 1, true);
assert.equal(evidenceFresh.citations.length >= 1, true);
assert.equal(evidenceFresh.verifiedCurrent, true);
assert.equal(evidenceFresh.conclusionEligible, true);
assert.equal(['high','medium'].includes(evidenceFresh.citations[0].confidenceLevel), true);

const evidenceUnverified = core.createOfficialSearchEvidence(ranked, { verifiedCurrent:false, best:null }, { verificationRequired:true });
assert.equal(evidenceUnverified.conclusionEligible, false);
assert.equal(Boolean(evidenceUnverified.warning), true);

const weak = core.rankOfficialSearchResults([
  { title:'หน้าหลักกรมบัญชีกลาง', url:'https://www.cgd.go.th/home', snippet:'ข้อมูลทั่วไป' }
], { originalQuery:'ระเบียบค่าเดินทางล่าสุด', queryTerms:['ระเบียบ','ค่าเดินทาง','ล่าสุด'] });
const weakEvidence = core.createOfficialSearchEvidence(weak, { verifiedCurrent:false, best:null }, { verificationRequired:true });
assert.equal(weakEvidence.conclusionEligible, false);

console.log('Citation quality benchmark passed: official-source verification, version freshness, evidence strength, confidence, and no-false-certainty gates.');
