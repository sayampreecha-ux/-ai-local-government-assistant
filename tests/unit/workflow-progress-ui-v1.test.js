import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkflowProgressPanelModel } from '../../assets/js/ui/workflow-progress-ui-v1.js';
import { buildWorkflowRuntimeView } from '../../assets/js/core/government-workflow-runtime-v5.js';

const cases = [
  ['ซื้อเครื่องจักร 100 ล้านบาท', 'gov.procurement'],
  ['ทำแผนอัตรากำลัง อบต.', 'gov.hr'],
  ['ขออนุญาตก่อสร้างบ้าน', 'gov.engineering']
];

for (const [query, expectedWorkflow] of cases) {
  test(`progress model is produced for ${query}`, () => {
    const view = buildWorkflowRuntimeView({ query });
    const model = buildWorkflowProgressPanelModel(view);
    assert.ok(model);
    assert.ok(view.workflowIds.includes(expectedWorkflow));
    assert.equal(typeof model.stageTitle, 'string');
    assert.ok(model.stageTitle.length > 0);
    assert.equal(Array.isArray(model.missing), true);
    assert.equal(Array.isArray(model.deliverables), true);
  });
}

test('panel keeps human approval and fail-closed status visible', () => {
  const model = buildWorkflowProgressPanelModel({
    governance: { failClosed: true },
    primary: {
      workflowId: 'gov.procurement',
      workflowStatus: 'awaiting-human-approval',
      actionLabel: 'เสนอผู้มีอำนาจตรวจและอนุมัติ',
      currentStage: { id: 'approval', title: 'อนุมัติ' },
      completedStages: ['need', 'budget'],
      missingEvidence: [],
      missingOfficialEvidence: [],
      deliverables: [{ artifactKey: 'approval-pack', status: 'required' }],
      approvalRequired: true,
      riskReviewRequired: false
    },
    workflows: []
  });
  assert.equal(model.approvalRequired, true);
  assert.equal(model.failClosed, true);
  assert.equal(model.statusLabel, 'รอผู้มีอำนาจอนุมัติ');
});

test('panel never needs raw evidence values', () => {
  const model = buildWorkflowProgressPanelModel({
    primary: {
      workflowId: 'gov.legal', workflowStatus: 'blocked-official-source', actionLabel: 'ตรวจแหล่งราชการ',
      currentStage: { id: 'source', title: 'แหล่งกฎหมายต้นฉบับ' }, completedStages: [],
      missingEvidence: ['officialLegalSource'], missingOfficialEvidence: ['officialLegalSource'], deliverables: []
    }, workflows: []
  });
  assert.deepEqual(model.missingOfficial, ['officialLegalSource']);
  assert.equal(Object.prototype.hasOwnProperty.call(model, 'evidenceValues'), false);
});
