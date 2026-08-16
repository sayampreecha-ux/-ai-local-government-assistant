import test from 'node:test';
import assert from 'node:assert/strict';
import { DEEP_WORKFLOWS } from '../../src/government-workflow-engine.js';
import { detectGovernmentWorkflows } from '../../src/government-workflow-suite.js';
import { executeGovernmentWorkflowV2 } from '../../src/government-workflow-state-machine-v2.js';
import { validateDeliverableContractCoverageV3 } from '../../src/government-deliverable-contracts-v3.js';

const ev = (key, value = true, official = false, verified = false) => ({ key, value, official, verified });
const ids = (query) => detectGovernmentWorkflows({ query }).map((workflow) => workflow.id);

const addedWorkflows = [
  'gov.engineering',
  'gov.health',
  'gov.education',
  'gov.internal-audit',
  'gov.executive',
  'gov.public-relations',
  'gov.council'
];

test('deep workflow registry covers the seven GovPrompt domains that were previously shallow-only', () => {
  for (const workflowId of addedWorkflows) {
    assert.ok(Array.isArray(DEEP_WORKFLOWS[workflowId]), workflowId);
    assert.ok(DEEP_WORKFLOWS[workflowId].length >= 7, `${workflowId} must be a real multi-stage workflow`);
  }
});

test('natural-language detection reaches every added workflow without requiring menu selection', () => {
  assert.ok(ids('ตรวจรับงานถนนและความหนาแน่นดิน').includes('gov.engineering'));
  assert.ok(ids('รพ.สต. จะใช้เงินบำรุงซื้อเวชภัณฑ์').includes('gov.health'));
  assert.ok(ids('โรงเรียนจะจัดกิจกรรมให้นักเรียน').includes('gov.education'));
  assert.ok(ids('ทำแผนตรวจสอบภายในและติดตามข้อค้นพบ').includes('gov.internal-audit'));
  assert.ok(ids('ทำสรุปผู้บริหารเพื่อช่วยตัดสินใจ').includes('gov.executive'));
  assert.ok(ids('ทำโพสต์ประชาสัมพันธ์โครงการ').includes('gov.public-relations'));
  assert.ok(ids('องค์ประชุมสภาท้องถิ่นครบหรือไม่').includes('gov.council'));
});

test('specialist domain becomes primary when a generic keyword also appears', () => {
  assert.equal(ids('รพ.สต. จะใช้เงินบำรุงซื้อเวชภัณฑ์')[0], 'gov.health');
  assert.equal(ids('ทำโพสต์ประชาสัมพันธ์โครงการ')[0], 'gov.public-relations');
  assert.equal(ids('โรงเรียนจัดกิจกรรมให้นักเรียน')[0], 'gov.education');
  assert.equal(ids('ตรวจรับงานถนนโครงการก่อสร้าง')[0], 'gov.engineering');
});

test('explicit task action still outranks specialist context', () => {
  assert.equal(ids('จัดซื้อเวชภัณฑ์สำหรับ รพ.สต.')[0], 'gov.procurement');
  assert.equal(ids('เบิกค่าใช้จ่ายกิจกรรมโรงเรียนได้ไหม')[0], 'gov.finance');
  assert.equal(ids('ร่างหนังสือราชการเรื่องถนนชำรุด')[0], 'gov.correspondence');
});

test('Thai place name พะเยา does not trigger health workflow from the substring ยา', () => {
  const result = ids('ทำโครงการอบรม AI ของ อบจ.พะเยา');
  assert.ok(result.includes('gov.project'));
  assert.equal(result.includes('gov.health'), false);
});

test('engineering authority fails closed until the authority evidence is official and verified', () => {
  const missing = executeGovernmentWorkflowV2({ workflowId: 'gov.engineering' });
  assert.equal(missing.currentStage.id, 'scope-authority');
  assert.deepEqual(missing.missingEvidence, ['engineeringScope', 'missionAuthority']);

  const unverified = executeGovernmentWorkflowV2({
    workflowId: 'gov.engineering',
    evidence: [ev('engineeringScope', 'road repair'), ev('missionAuthority', 'authority text')]
  });
  assert.equal(unverified.status, 'blocked-official-source');
  assert.deepEqual(unverified.missingOfficialEvidence, ['missionAuthority']);
});

test('engineering standard-price stage exposes minimized finance handoff only after evidence and deliverable exist', () => {
  const completedStages = ['scope-authority', 'site-existing-condition', 'survey-design-basis', 'drawings-calculations'];
  const evidence = [ev('costEstimate', 1000000), ev('standardPriceEvidence', 'official standard', true, true)];
  const artifacts = [{ key: 'engineering-cost-estimate-sheet', status: 'ready' }];
  const result = executeGovernmentWorkflowV2({ workflowId: 'gov.engineering', completedStages, evidence, artifacts });
  assert.equal(result.status, 'ready');
  const handoff = result.handoffContracts.find((item) => item.targetWorkflowId === 'gov.finance');
  assert.equal(handoff.status, 'ready');
  assert.deepEqual(handoff.payload.evidenceKeys.sort(), ['costEstimate', 'standardPriceEvidence'].sort());
  assert.deepEqual(handoff.payload.artifactKeys, ['engineering-cost-estimate-sheet']);
  assert.equal(Object.hasOwn(handoff.payload, 'values'), false);
});

test('health privacy stage requires an explicit risk review before proceeding', () => {
  const result = executeGovernmentWorkflowV2({
    workflowId: 'gov.health',
    completedStages: ['authority-service-scope', 'population-need', 'funding-source', 'health-standard', 'medicine-supply-procurement'],
    evidence: [ev('dataCategory', 'health data'), ev('privacyBasis', 'documented basis')]
  });
  assert.equal(result.currentStage.id, 'privacy-consent');
  assert.equal(result.riskReviewRequired, true);
  assert.equal(result.status, 'blocked-risk-review');
});

test('public-relations publication path cannot bypass human approval', () => {
  const result = executeGovernmentWorkflowV2({
    workflowId: 'gov.public-relations',
    completedStages: ['objective-audience', 'facts-verification', 'privacy-rights', 'content-draft', 'channel-format'],
    evidence: [ev('approvalAuthority', 'authorized officer')]
  });
  assert.equal(result.currentStage.id, 'approval');
  assert.equal(result.status, 'awaiting-human-approval');
});

test('council procedure cannot proceed on an unverified meeting rule', () => {
  const result = executeGovernmentWorkflowV2({
    workflowId: 'gov.council',
    completedStages: ['matter-authority'],
    evidence: [ev('currentCouncilRule', 'meeting rule')]
  });
  assert.equal(result.currentStage.id, 'procedure-rule');
  assert.equal(result.status, 'blocked-official-source');
  assert.deepEqual(result.missingOfficialEvidence, ['currentCouncilRule']);
});

test('deliverable contract registry automatically covers every new workflow deliverable', () => {
  const coverage = validateDeliverableContractCoverageV3();
  assert.equal(coverage.valid, true);
  assert.equal(coverage.missing.length, 0);
  assert.equal(coverage.orphaned.length, 0);
});
