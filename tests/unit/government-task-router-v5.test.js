import test from "node:test";
import assert from "node:assert/strict";
import { detectGovernmentTaskV5, runGovernmentTaskV5 } from "../../src/government-task-router-v5.js";

test("citizen service becomes primary workflow for permit request", () => {
  const result = detectGovernmentTaskV5({ query: "ขออนุญาตก่อสร้างบ้านต้องทำอย่างไร" });
  assert.equal(result.primaryWorkflowId, "gov.citizen-service");
  assert.ok(result.workflowIds.includes("gov.engineering"));
  assert.ok(result.workflowIds.includes("gov.legal"));
});

test("citizen service router preserves fail-closed governance", () => {
  const result = runGovernmentTaskV5({ query: "ขอใบอนุญาตสาธารณสุข" });
  assert.equal(result.primary.workflowId, "gov.citizen-service");
  assert.equal(result.governance.aiDecisionAllowed, false);
  assert.equal(result.governance.humanApprovalRequired, true);
});

test("non-citizen tasks delegate to existing government workflow suite", () => {
  const result = runGovernmentTaskV5({ query: "ซื้อเครื่องจักร" });
  assert.equal(result.citizenService, null);
  assert.ok(result.detection.workflowIds.includes("gov.procurement"));
});
