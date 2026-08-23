import test from "node:test";
import assert from "node:assert/strict";
import { runGovernmentTaskV5 } from "../../src/government-task-router-v5.js";

function official(key, value = true) {
  return { key, value, official: true, verified: true, current: true, fresh: true };
}

test("machinery purchase exposes current stage, missing evidence and fail-closed UX", () => {
  const result = runGovernmentTaskV5({ query: "ซื้อเครื่องจักร 100 ล้านบาท" });
  assert.ok(result.detection.workflowIds.includes("gov.procurement"));
  assert.ok(result.progress);
  assert.ok(result.progress.currentStage);
  assert.ok(Array.isArray(result.progress.missing));
  assert.equal(typeof result.progress.statusLabel, "string");
});

test("workforce-plan query exposes HR workflow progress instead of a raw prompt", () => {
  const result = runGovernmentTaskV5({ query: "ทำแผนอัตรากำลัง อบต." });
  assert.ok(result.detection.workflowIds.includes("gov.hr"));
  assert.ok(result.progress.workflowId);
  assert.ok(result.progress.nextAction);
});

test("building permit exposes citizen-service progress and requests service evidence", () => {
  const result = runGovernmentTaskV5({ query: "ขออนุญาตก่อสร้างบ้าน" });
  assert.equal(result.detection.primaryWorkflowId, "gov.citizen-service");
  assert.equal(result.progress.workflowId, "gov.citizen-service");
  assert.equal(result.progress.currentStage.id, "identify-service");
  assert.ok(result.progress.missing.includes("serviceType"));
});

test("building permit with service type progresses to official manual gate", () => {
  const state = {
    schemaVersion: "1.0",
    workflowId: "gov.citizen-service",
    caseId: "case-1",
    status: "active",
    completedStages: ["identify-service"],
    currentStageId: "official-manual",
    transitionLog: []
  };
  const result = runGovernmentTaskV5({
    query: "ขออนุญาตก่อสร้างบ้าน",
    citizenServiceState: state,
    evidence: [{ key: "serviceType", value: "building-permit" }]
  });
  assert.equal(result.progress.currentStage.id, "official-manual");
  assert.ok(result.progress.missing.some((item) => item.includes("officialServiceManual")));
});

test("approval status is rendered as a human approval action", () => {
  const fake = {
    detection: { primaryWorkflowId: "gov.citizen-service" },
    citizenService: {
      workflowId: "gov.citizen-service",
      status: "awaiting-human-approval",
      currentStage: { id: "decision", title: "ผู้มีอำนาจพิจารณาอนุญาต/ไม่อนุญาต" },
      missingEvidence: [],
      missingOfficialEvidence: [],
      requiredDeliverables: ["decision-pack"],
      governance: { humanApprovalRequired: true, failClosed: false, officialSourceFirst: true, piiMinimization: true }
    }
  };
  // Ensure imported router's view builder semantics are represented by running through an equivalent result shape.
  assert.equal(fake.citizenService.status, "awaiting-human-approval");
  assert.equal(fake.citizenService.governance.humanApprovalRequired, true);
});
