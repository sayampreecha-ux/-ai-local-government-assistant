import test from "node:test";
import assert from "node:assert/strict";
import {
  detectCitizenServiceIntent,
  createCitizenServiceState,
  runCitizenServiceWorkflow,
  transitionCitizenServiceWorkflow
} from "../../src/citizen-service-workflow.js";

test("detects building permit citizen service intent", () => {
  const result = detectCitizenServiceIntent({ query: "ขออนุญาตก่อสร้างบ้านต้องทำอย่างไร" });
  assert.equal(result.matched, true);
  assert.equal(result.workflowId, "gov.citizen-service");
  assert.equal(result.serviceProfile, "building-permit");
  assert.ok(result.handoffs.includes("gov.engineering"));
});

test("detects public health licensing intent", () => {
  const result = detectCitizenServiceIntent({ query: "จะขอใบอนุญาตสถานที่จำหน่ายอาหาร" });
  assert.equal(result.matched, true);
  assert.equal(result.serviceProfile, "public-health-license");
  assert.ok(result.handoffs.includes("gov.health"));
});

test("fails closed when official manual evidence is not verified", () => {
  const state = createCitizenServiceState("case-1");
  const first = transitionCitizenServiceWorkflow({
    query: "ขออนุญาตก่อสร้างบ้าน",
    state,
    evidence: [{ key: "serviceType", value: "building-permit" }]
  });
  assert.equal(first.currentStage.id, "official-manual");
  const blocked = runCitizenServiceWorkflow({ query: "ขออนุญาตก่อสร้างบ้าน", state: first.state, evidence: [] });
  assert.equal(blocked.status, "blocked-missing-evidence");
});

test("blocks extra document requests not found in supplied manual list", () => {
  const state = {
    schemaVersion: "1.0",
    workflowId: "gov.citizen-service",
    caseId: "case-2",
    status: "active",
    completedStages: ["identify-service", "official-manual", "authority-scope", "minimum-applicant-data"],
    currentStageId: "requirements",
    transitionLog: []
  };
  const result = runCitizenServiceWorkflow({
    query: "ขอใบอนุญาต",
    state,
    evidence: [{ key: "requiredDocuments", value: ["สำเนาบัตรประชาชน"] }],
    manualDocuments: ["สำเนาบัตรประชาชน"],
    requestedDocuments: ["สำเนาบัตรประชาชน", "สำเนาทะเบียนบ้าน"]
  });
  assert.equal(result.status, "blocked-risk-review");
  assert.equal(result.riskFindings[0].code, "extra-document-request");
});

test("AI cannot authorize a citizen service decision", () => {
  const state = {
    schemaVersion: "1.0",
    workflowId: "gov.citizen-service",
    caseId: "case-3",
    status: "active",
    completedStages: [
      "identify-service", "official-manual", "authority-scope", "minimum-applicant-data", "requirements",
      "fees-and-time", "intake", "completeness", "deficiency-handling", "substantive-review"
    ],
    currentStageId: "decision",
    transitionLog: []
  };
  const result = runCitizenServiceWorkflow({
    query: "ขออนุญาตก่อสร้าง",
    state,
    evidence: [{ key: "decisionAuthority", value: "authorized-officer" }],
    aiDecision: true
  });
  assert.equal(result.status, "blocked-risk-review");
  assert.equal(result.governance.aiDecisionAllowed, false);
});

test("human approval is mandatory at the decision stage", () => {
  const state = {
    schemaVersion: "1.0",
    workflowId: "gov.citizen-service",
    caseId: "case-4",
    status: "active",
    completedStages: [
      "identify-service", "official-manual", "authority-scope", "minimum-applicant-data", "requirements",
      "fees-and-time", "intake", "completeness", "deficiency-handling", "substantive-review"
    ],
    currentStageId: "decision",
    transitionLog: []
  };
  const result = runCitizenServiceWorkflow({
    query: "ขออนุญาตก่อสร้าง",
    state,
    evidence: [{ key: "decisionAuthority", value: "authorized-officer" }]
  });
  assert.equal(result.status, "awaiting-human-approval");
});
