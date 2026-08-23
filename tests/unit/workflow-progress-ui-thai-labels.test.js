import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WORKFLOW_PROGRESS_UI_VERSION,
  humanizeWorkflowKey
} from '../../assets/js/ui/workflow-progress-ui-v1.js';

test('workflow progress UI exposes Thai labels for HR missing evidence', () => {
  assert.equal(WORKFLOW_PROGRESS_UI_VERSION, '1.2');
  assert.equal(humanizeWorkflowKey('hrIntent'), 'วัตถุประสงค์และประเภทงานบุคคลที่ต้องการ');
  assert.equal(humanizeWorkflowKey('facts'), 'ข้อเท็จจริงและข้อมูลพื้นฐานที่เกี่ยวข้อง');
  assert.equal(humanizeWorkflowKey('missionAuthority'), 'ภารกิจและอำนาจหน้าที่ของหน่วยงาน');
  assert.equal(humanizeWorkflowKey('needJustification'), 'เหตุผลและความจำเป็นของภารกิจ/ตำแหน่ง');
});

test('workflow progress UI translates real kebab-case artifact keys', () => {
  assert.equal(humanizeWorkflowKey('hr-fact-summary', 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้'), 'สรุปข้อเท็จจริงสำหรับงานบุคคล');
  assert.equal(humanizeWorkflowKey('need-memo', 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้'), 'บันทึกเหตุผลและความจำเป็น');
  assert.equal(humanizeWorkflowKey('decision-pack', 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้'), 'ชุดเอกสารเสนอผู้มีอำนาจพิจารณา');
});

test('unknown internal codes are never exposed to ordinary users', () => {
  const missing = humanizeWorkflowKey('someUnknownInternalKey');
  const artifact = humanizeWorkflowKey('unknown-artifact-code', 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้');
  assert.equal(missing, 'ข้อมูล/หลักฐานเพิ่มเติมตามขั้นตอนนี้');
  assert.equal(artifact, 'เอกสาร/ชิ้นงานประกอบขั้นตอนนี้');
  assert.doesNotMatch(missing, /someUnknownInternalKey/);
  assert.doesNotMatch(artifact, /unknown-artifact-code/);
});
