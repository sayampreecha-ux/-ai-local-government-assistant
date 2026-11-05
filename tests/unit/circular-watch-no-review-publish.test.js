import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assessReviewEvidence } from '../../scripts/circular-watch-review-gate.mjs';
import { validateDocumentEvidence } from '../../scripts/circular-watch-source-gate.mjs';

test('published registry remains empty until independently authenticated review exists', () => {
  const index = JSON.parse(readFileSync('knowledge/circulars/index.json', 'utf8'));
  assert.equal(index.schemaVersion, '1.0');
  assert.deepEqual(index.records, []);
  assert.deepEqual(index.shards, []);
});
test('unreviewed candidate cannot be published by imported approval fields', () => {
  const candidate = {id:'TEST-ONLY',documentTitle:'Synthetic only',documentNumber:'TEST-ONLY',
    issuingAgency:'Synthetic agency',documentDate:'2026-01-01',sourceUrl:'https://www.dla.go.th/example.pdf',
    evidence:['synthetic test'],excerptLocator:'page 1',lastVerifiedAt:'2026-01-01T00:00:00Z',
    reviewStatus:'approved',documentSha256:'a'.repeat(64)};
  assert.equal(validateDocumentEvidence(candidate).pass, false);
  const gate = assessReviewEvidence(candidate, {reviewerLogin:'reviewer',decision:'APPROVED',
    reviewUrl:'https://github.com/owner/repo/pull/366#pullrequestreview-123',
    reviewedAt:'2026-01-02T00:00:00Z',documentSha256:candidate.documentSha256});
  assert.equal(gate.publishable,false);
  assert.equal(gate.authenticated,false);
  assert.equal(gate.decision,'DECISION_LOCK');
});
