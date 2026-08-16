import test from 'node:test';
import assert from 'node:assert/strict';
import { DEEP_WORKFLOWS } from '../../src/government-workflow-engine.js';
import { detectGovernmentWorkflows } from '../../src/government-workflow-suite.js';
import { executeGovernmentWorkflowV2 } from '../../src/government-workflow-state-machine-v2.js';
import { buildGovernmentWorkOrderV4 } from '../../src/government-case-orchestrator-v4.js';

const WORKFLOW_CASES = Object.freeze([
  ['gov.correspondence', 'ร่างหนังสือราชการแจ้งหน่วยงาน'],
  ['gov.legal', 'วิเคราะห์ข้อกฎหมายและอำนาจหน้าที่'],
  ['gov.procurement', 'จัดซื้อครุภัณฑ์ด้วย e-bidding'],
  ['gov.project', 'ทำโครงการอบรมประชาชน'],
  ['gov.finance', 'ขอเบิกค่าใช้จ่ายเดินทางไปราชการ'],
  ['gov.hr', 'เลื่อนเงินเดือนพนักงานส่วนท้องถิ่น'],
  ['gov.engineering', 'ตรวจรับงานก่อสร้างถนน'],
  ['gov.health', 'รพ.สต. ใช้เงินบำรุงซื้อเวชภัณฑ์'],
  ['gov.education', 'โรงเรียนจัดกิจกรรมสำหรับนักเรียน'],
  ['gov.internal-audit', 'จัดทำแผนตรวจสอบภายใน'],
  ['gov.executive', 'จัดทำสรุปผู้บริหารเพื่อช่วยตัดสินใจ'],
  ['gov.public-relations', 'ทำโพสต์ประชาสัมพันธ์โครงการ'],
  ['gov.council', 'ตรวจองค์ประชุมสภาท้องถิ่น'],
  ['gov.budget-draft', 'จัดทำร่างงบประมาณประจำปี']
]);

test('V7 government workflows are deterministically routable and fail closed before evidence is supplied', () => {
  for (const [workflowId, query] of WORKFLOW_CASES) {
    const detected = detectGovernmentWorkflows({ query }).map((workflow) => workflow.id);
    assert.ok(detected.includes(workflowId), `${workflowId} was not detected for its supported task`);

    const first = buildGovernmentWorkOrderV4({ workflowId, input: { query, caseId: `TEST-${workflowId}` } });
    const second = buildGovernmentWorkOrderV4({ workflowId, input: { query, caseId: `TEST-${workflowId}` } });
    assert.deepEqual(first, second, `${workflowId} work order must be deterministic`);
    assert.equal(first.workflowId, workflowId);
    assert.equal(first.workflowStatus, 'blocked-missing-evidence');
    assert.equal(first.action, 'acquire-evidence');
    assert.equal(first.governance.failClosed, true);
    assert.equal(first.governance.autoApprovalAllowed, false);
    assert.equal(first.governance.rawEvidenceValuesReturned, false);
    assert.ok(first.currentStage);
    assert.ok(first.missingEvidence.length > 0, `${workflowId} must request evidence before it proceeds`);
    assert.ok(first.deliverableWorkOrders.length > 0, `${workflowId} must define a stage deliverable`);
  }
});

test('all major workflow definitions require evidence, deliverables, risk review, and human review without auto-approval', () => {
  for (const [workflowId] of WORKFLOW_CASES) {
    const stages = DEEP_WORKFLOWS[workflowId];
    assert.ok(Array.isArray(stages) && stages.length >= 7, `${workflowId} must be multi-stage`);
    assert.ok(stages.some((stage) => stage.requiredEvidence.length > 0), `${workflowId} must have required evidence`);
    assert.ok(stages.some((stage) => stage.deliverables.length > 0), `${workflowId} must have deliverables`);
    assert.ok(stages.some((stage) => stage.riskChecks.length > 0), `${workflowId} must have a risk gate`);
    assert.ok(stages.some((stage) => stage.humanApprovalRequired), `${workflowId} must require human review`);
  }
});

test('declared cross-workflow handoffs stay structured and do not carry raw values', () => {
  const workflowIds = new Set(Object.keys(DEEP_WORKFLOWS));
  const handoffs = Object.entries(DEEP_WORKFLOWS).flatMap(([sourceWorkflowId, stages]) =>
    stages.flatMap((stage) => (stage.handoffs || []).map((targetWorkflowId) => ({ sourceWorkflowId, stageId: stage.id, targetWorkflowId })))
  );

  assert.ok(handoffs.length > 0);
  for (const handoff of handoffs) {
    assert.ok(workflowIds.has(handoff.targetWorkflowId), `${handoff.sourceWorkflowId}:${handoff.stageId} targets an unknown workflow`);
    assert.equal(Object.hasOwn(handoff, 'value'), false);
    assert.equal(Object.hasOwn(handoff, 'rawInput'), false);
  }
});

test('newly declared risk stages block until a human records an evidence-backed risk review', () => {
  for (const workflowId of ['gov.finance', 'gov.legal', 'gov.project', 'gov.correspondence', 'gov.hr']) {
    const stages = DEEP_WORKFLOWS[workflowId];
    const riskIndex = stages.findIndex((stage) => stage.riskChecks.length > 0);
    const scopedStages = stages.slice(0, riskIndex + 1);
    const evidence = scopedStages.flatMap((stage) => stage.requiredEvidence.map((key) => ({
      key,
      value: 'synthetic-test-metadata',
      official: stage.officialEvidenceRequired,
      verified: stage.officialEvidenceRequired
    })));
    const result = executeGovernmentWorkflowV2({
      workflowId,
      completedStages: stages.slice(0, riskIndex).map((stage) => stage.id),
      evidence,
      input: { riskReviews: [] }
    });

    assert.equal(result.currentStage.id, stages[riskIndex].id);
    assert.equal(result.status, 'blocked-risk-review');
    assert.equal(result.riskReviewRequired, true);
    assert.equal(result.governance.failClosed, true);
  }
});
