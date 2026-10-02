import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const sandbox = { window: {} };
vm.runInNewContext(readFileSync('assets/js/core/official-source-registry.js', 'utf8'), sandbox);
vm.runInNewContext(readFileSync('assets/js/core/evidence-first-v8.js', 'utf8'), sandbox);
const engine = sandbox.window.GovPromptCore.EVIDENCE_FIRST_V8;

const complete = {
  documents: [{
    id: 'rule-1',
    title: 'หลักเกณฑ์ตัวอย่าง',
    issuingAgency: 'กรมส่งเสริมการปกครองท้องถิ่น',
    documentDate: '2026-01-01',
    effectiveDate: '2026-01-02',
    url: 'https://www.dla.go.th/example',
    primary: true,
    contentVerified: true,
    status: 'current'
  }],
  factsComplete: true,
  authorityConfirmed: true,
  versionConfirmed: true,
  timeConfirmed: true,
  factMatchConfirmed: true,
  laterChangeChecked: true,
  conflictTransitionChecked: true,
  conflicts: []
};

test('primary source verification requires official source, metadata and verified content', () => {
  const ok = engine.verifyPrimarySource(complete.documents[0]);
  assert.equal(ok.verified, true);
  const bad = engine.verifyPrimarySource({ ...complete.documents[0], url: 'https://example.com/rule' });
  assert.equal(bad.verified, false);
});

test('legal version check detects not-yet-effective, repealed and superseded records', () => {
  assert.equal(engine.checkLegalVersion(complete.documents[0], complete.documents, '2026-09-23').currentCandidate, true);
  assert.equal(engine.checkLegalVersion({ ...complete.documents[0], effectiveDate: '2027-01-01' }, [], '2026-09-23').notYetEffective, true);
  assert.equal(engine.checkLegalVersion({ ...complete.documents[0], status: 'repealed' }, [], '2026-09-23').repealed, true);
  assert.equal(engine.checkLegalVersion({ ...complete.documents[0], status: 'superseded', supersededByDocumentId: 'rule-2' }, [...complete.documents, { ...complete.documents[0], id: 'rule-2', title: 'ฉบับใหม่' }], '2026-09-23').superseded, true);
});

test('later rule/transition check locks when found but unresolved', () => {
  const result = engine.checkLaterRuleTransition({ laterChangeChecked: true, laterRules: [{ id: 'later-1', resolved: false }] });
  assert.equal(result.status, 'FOUND_UNRESOLVED');
  assert.equal(result.unresolved, true);
});

test('official precedent requires verification and complete precedent metadata', () => {
  const incomplete = engine.checkOfficialPrecedent({ precedentChecked: true, precedents: [{ verified: false }] });
  assert.equal(incomplete.status, 'FOUND_UNVERIFIED');
  const verified = engine.checkOfficialPrecedent({
    precedentChecked: true,
    precedents: [{
      verified: true, officialSource: true, caseMatch: 'HIGH MATCH',
      issuingAuthority: 'ก.ท.จ.', documentNumber: 'นร 0000',
      documentDate: '2026-01-01', title: 'หนังสือหารือ',
      consultedFacts: 'ข้อเท็จจริงตรงกัน', adjudicatedIssue: 'ประเด็นอำนาจ',
      citedRules: 'กฎหมายที่เกี่ยวข้อง', reasoning: 'เหตุผล',
      conclusion: 'ข้อสรุป'
    }]
  });
  assert.equal(verified.status, 'VERIFIED');
  assert.equal(verified.caseMatch, 'HIGH MATCH');
});

test('retrieval remains searchable but not decidable until evidence gates pass', () => {
  const plan = engine.buildEvidenceRetrievalPlan('เทศบาลแต่งตั้งผู้ผ่านการสรรหา มาตรา 24', { domain: 'บุคคล' });
  assert.equal(plan.primaryFirst, true);
  assert.equal(plan.searchable, true);
  assert.equal(plan.decidable, false);
  assert.ok(plan.levels.length >= 4);
  assert.ok(plan.identifiers.some(value => /มาตรา/.test(value)));
});

test('case fingerprint is deterministic and changes with material case context', () => {
  const a = engine.caseFingerprint('แต่งตั้งได้หรือไม่', { organizationType: 'เทศบาล', domain: 'บุคคล' }, complete);
  const b = engine.caseFingerprint('แต่งตั้งได้หรือไม่', { organizationType: 'เทศบาล', domain: 'บุคคล' }, complete);
  const c = engine.caseFingerprint('แต่งตั้งได้หรือไม่', { organizationType: 'อบจ.', domain: 'บุคคล' }, complete);
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('full assurance unlocks only when all required evidence dimensions are satisfied', () => {
  const result = engine.buildAssuranceAssessment({
    question: 'ผู้ผ่านการสรรหาแต่งตั้งได้หรือไม่',
    context: { organizationType: 'เทศบาล', domain: 'บุคคล', facts: 'มีตำแหน่งว่าง' },
    evidence: complete,
    asOf: '2026-09-23'
  });
  assert.equal(result.decisionLock, 'OFF');
  assert.equal(result.decidable, true);
  assert.equal(result.blockers.length, 0);
});

test('assurance keeps decision locked when primary evidence or later-change review is missing', () => {
  const result = engine.buildAssuranceAssessment({
    question: 'ผู้ผ่านการสรรหาแต่งตั้งได้หรือไม่',
    context: { organizationType: 'เทศบาล', domain: 'บุคคล' },
    evidence: { ...complete, documents: [], laterChangeChecked: false },
    asOf: '2026-09-23'
  });
  assert.equal(result.decisionLock, 'ON');
  assert.equal(result.decidable, false);
  assert.ok(result.blockers.includes('PRIMARY_SOURCE_NOT_VERIFIED'));
  assert.ok(result.blockers.includes('LATER_RULE_TRANSITION_NOT_CHECKED'));
});
