import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DELIVERABLE_CONTRACT_SCHEMA_VERSION,
  getDeliverableContractV3,
  executeGovernmentWorkflowV3,
  buildCrossWorkflowCaseV3
} from '../../src/government-deliverable-contracts-v3.js';

const AT = '2026-08-15T06:30:00.000Z';
const ev = (key, value = true) => ({ key, value });

function artifactFor(workflowId, stageId, artifactKey, evidenceKeys = []) {
  const contract = getDeliverableContractV3(workflowId, stageId, artifactKey);
  assert.ok(contract);
  return {
    key: artifactKey,
    contractId: contract.id,
    contractVersion: DELIVERABLE_CONTRACT_SCHEMA_VERSION,
    workflowId,
    stageId,
    status: 'final',
    evidenceKeys,
    unresolvedItems: [],
    provenance: { generatedBy: 'scope-test', generatedAt: AT, sourceEvidenceKeys: evidenceKeys },
    validation: { validated: true, validator: 'scope-test', validatedAt: AT, errors: [] },
    content: { summary: 'valid fact summary' }
  };
}

test('V3 ignores same-key artifact owned by another workflow instead of reporting a false duplicate', () => {
  const evidence = [ev('facts', 'facts')];
  const legal = artifactFor('gov.legal', 'facts', 'fact-summary', ['facts']);
  const correspondence = artifactFor('gov.correspondence', 'facts', 'fact-summary', ['facts']);

  const result = executeGovernmentWorkflowV3({
    workflowId: 'gov.legal',
    evidence,
    artifacts: [legal, correspondence]
  });

  assert.equal(result.status, 'ready');
  assert.deepEqual(result.deliverablesReady, ['fact-summary']);
  assert.deepEqual(result.deliverableValidation.invalidArtifacts, []);
});

test('cross-workflow V3 case validates each same-key artifact only in its owning workflow context', () => {
  const evidence = [ev('facts', 'facts')];
  const legal = artifactFor('gov.legal', 'facts', 'fact-summary', ['facts']);
  const correspondence = artifactFor('gov.correspondence', 'facts', 'fact-summary', ['facts']);

  const result = buildCrossWorkflowCaseV3(
    {},
    ['gov.legal', 'gov.correspondence'],
    evidence,
    {},
    [legal, correspondence]
  );

  assert.equal(result.workflows.find((workflow) => workflow.workflowId === 'gov.legal').status, 'ready');
  assert.equal(result.workflows.find((workflow) => workflow.workflowId === 'gov.correspondence').status, 'ready');
});
