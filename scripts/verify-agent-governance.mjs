import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const sandbox = { window: {} };
vm.runInNewContext(await readFile('assets/js/core/agent-governance-policy.js', 'utf8'), sandbox);
const core = sandbox.window.GovPromptCore;

assert.equal(core.classifyAutonomy('ค้นและสรุประเบียบนี้').level, 'L1');
assert.equal(core.classifyAutonomy('วิเคราะห์ความเสี่ยงและเสนอทางเลือก').level, 'L2');
assert.equal(core.classifyAutonomy('ร่างหนังสือแจ้งหน่วยงาน').level, 'L3');
assert.equal(core.classifyAutonomy('ส่งจริงและบันทึกเข้าระบบ').level, 'L4');

const blocked = core.evaluateAgentGovernance('อนุมัติและสั่งจ่ายเงิน');
assert.equal(blocked.allowed, false);
assert.equal(blocked.effectiveLevel, 'L3');
assert.equal(blocked.requiresHumanApproval, true);
assert.equal(blocked.technicalPermissionIsLegalAuthority, false);
assert.ok(blocked.blockers.length >= 5);

const bounded = core.evaluateAgentGovernance('บันทึกเข้าระบบตามรายการที่อนุมัติแล้ว', {
  humanApproved: true,
  boundedAction: true,
  reversible: true,
  auditReady: true,
  legalAuthorityVerified: true
});
assert.equal(bounded.allowed, true);
assert.equal(bounded.effectiveLevel, 'L4');

assert.ok(core.PROHIBITED_AUTONOMOUS_ACTIONS.length >= 7);
console.log('GovPrompt Agent Governance verification passed: L1-L4, Human Approval, legal-authority boundary, rollback and audit gates.');
