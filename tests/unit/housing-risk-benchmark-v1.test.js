import test from 'node:test';
import assert from 'node:assert/strict';
import {
  HOUSING_RISK_PATTERNS_V1,
  HOUSING_AUDIT_SAFETY_RULES_V1,
} from '../fixtures/housing-risk-patterns-v1.mjs';

test('housing benchmark contains exactly seven distinct risk patterns', () => {
  assert.equal(HOUSING_RISK_PATTERNS_V1.length, 7);
  assert.deepEqual(
    HOUSING_RISK_PATTERNS_V1.map((pattern) => pattern.id),
    ['H01', 'H02', 'H03', 'H04', 'H05', 'H06', 'H07'],
  );
  assert.equal(new Set(HOUSING_RISK_PATTERNS_V1.map((pattern) => pattern.key)).size, 7);
});

test('every risk pattern requires evidence and starts unverified', () => {
  for (const pattern of HOUSING_RISK_PATTERNS_V1) {
    assert.ok(pattern.label);
    assert.ok(Array.isArray(pattern.evidence));
    assert.ok(pattern.evidence.length > 0);
    assert.equal(pattern.requiredStatus, 'UNVERIFIED');
  }
});

test('benchmark safety rules prevent unsupported legal conclusions', () => {
  assert.deepEqual(HOUSING_AUDIT_SAFETY_RULES_V1, {
    riskIsNotProof: true,
    completeDocumentsAreNotProofOfActualResidence: true,
    legalConclusionRequiresOfficialSources: true,
    unresolvedIssuesRequireDecisionLock: true,
  });
});
