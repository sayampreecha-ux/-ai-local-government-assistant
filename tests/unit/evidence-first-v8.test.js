import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const sandbox = { window: {} };
vm.runInNewContext(readFileSync('assets/js/core/evidence-first-v8.js', 'utf8'), sandbox);
const engine = sandbox.window.GovPromptCore.EVIDENCE_FIRST_V8;

const completeEvidence = {
  documents: [{ title: 'ระเบียบต้นฉบับ', issuingAgency: 'หน่วยงานเจ้าของเรื่อง', documentDate: '2026-01-01', url: 'https://example.go.th/rule', primary: true }],
  factsComplete: true,
  authorityConfirmed: true,
  versionConfirmed: true,
  timeConfirmed: true,
  factMatchConfirmed: true,
  laterChangeChecked: true,
  conflictTransitionChecked: true,
  conflicts: []
};

test('locks decision when primary evidence is missing', () => {
  const result = engine.checkApplicableAuthority({ question: 'เบิกได้ไหม', evidence: {} });
  assert.equal(result.decisionLock, 'ON');
  assert.equal(result.qualityStatus, 'UNVERIFIED');
  assert.ok(result.missingChecks.includes('AUTHORITY'));
});

test('locks decision when a required authority dimension is incomplete', () => {
  const result = engine.checkApplicableAuthority({ question: 'แต่งตั้งได้หรือไม่', evidence: { ...completeEvidence, versionConfirmed: false } });
  assert.equal(result.decisionLock, 'ON');
  assert.ok(result.missingChecks.includes('VERSION'));
});

test('keeps unresolved conflicts locked', () => {
  const result = engine.checkApplicableAuthority({ question: 'ทำได้ไหม', evidence: { ...completeEvidence, conflicts: [{ id: 'c1', resolved: false }] } });
  assert.equal(result.decisionLock, 'ON');
  assert.equal(result.qualityStatus, 'CONFLICT');
});

test('unlocks only after evidence and all authority checks pass', () => {
  const result = engine.checkApplicableAuthority({ question: 'มีสิทธิไหม', evidence: completeEvidence });
  assert.equal(result.decisionLock, 'OFF');
  assert.equal(result.qualityStatus, 'VERIFIED');
  assert.equal(result.missingChecks.length, 0);
});

test('does not activate legal lock for a clearly non-decision request', () => {
  const result = engine.checkApplicableAuthority({ question: 'ช่วยเขียนคำอวยพรวันเกิด', evidence: {} });
  assert.equal(result.mode, 'NONE');
  assert.equal(result.decisionLock, 'OFF');
});
