import test from "node:test";
import assert from "node:assert/strict";
import { executeDeepGovernmentWorkflow, detectProcurementRisks, buildCrossWorkflowCase } from "../../src/government-workflow-engine.js";
import { runGovernmentWorkflow } from "../../src/government-workflow-suite.js";

const ev = (key, value = true, official = false, verified = false) => ({ key, value, official, verified });

test("machinery procurement starts by asking only for mission authority and need evidence", () => {
  const r = executeDeepGovernmentWorkflow({ workflowId: "gov.procurement", input: { query: "ซื้อรถขุด 8 ล้านบาท" } });
  assert.equal(r.currentStage.id, "need-and-authority");
  assert.deepEqual(r.missingEvidence, ["missionAuthority", "needJustification"]);
  assert.equal(r.governance.failClosed, true);
});

test("verified need/authority evidence advances first procurement stage to ready", () => {
  const r = executeDeepGovernmentWorkflow({
    workflowId: "gov.procurement",
    input: { query: "ซื้อรถขุด 8 ล้านบาท" },
    evidence: [ev("missionAuthority", "official authority", true, true), ev("needJustification", "workload evidence")]
  });
  assert.equal(r.status, "ready");
  assert.ok(r.deliverablesReady.includes("need-memo"));
});

test("completed first stage moves to plan and budget stage", () => {
  const r = executeDeepGovernmentWorkflow({ workflowId: "gov.procurement", completedStages: ["need-and-authority"] });
  assert.equal(r.currentStage.id, "plan-and-budget");
  assert.deepEqual(r.missingEvidence, ["planLinkage", "fundingSource", "budgetAvailability"]);
  assert.ok(r.handoffs.includes("gov.project"));
  assert.ok(r.handoffs.includes("gov.finance"));
});

test("specific brand/model language is flagged as vendor-lock risk", () => {
  const risks = detectProcurementRisks({ draftTor: "รถขุด ยี่ห้อ ABC รุ่น ZX500 เท่านั้น" });
  assert.ok(risks.some((r) => r.code === "vendor-lock" && r.severity === "high"));
});

test("TOR competition stage blocks high vendor-lock risk", () => {
  const r = executeDeepGovernmentWorkflow({
    workflowId: "gov.procurement",
    completedStages: ["need-and-authority", "plan-and-budget", "technical-requirements", "market-and-standard-price"],
    evidence: [ev("draftTor", "provided")],
    input: { draftTor: "กำหนดยี่ห้อ ABC รุ่น ZX500 เท่านั้น" }
  });
  assert.equal(r.currentStage.id, "tor-and-competition-check");
  assert.equal(r.status, "blocked-risk-review");
});

test("procurement method selection cannot proceed without current official rule", () => {
  const r = executeDeepGovernmentWorkflow({
    workflowId: "gov.procurement",
    completedStages: ["need-and-authority", "plan-and-budget", "technical-requirements", "market-and-standard-price", "tor-and-competition-check"],
    evidence: [ev("currentProcurementRule", "rule"), ev("methodDecisionFacts", "facts")]
  });
  assert.equal(r.currentStage.id, "method-selection");
  assert.equal(r.status, "blocked-official-source");
});

test("method selection still awaits human approval after official rule is verified", () => {
  const r = executeDeepGovernmentWorkflow({
    workflowId: "gov.procurement",
    completedStages: ["need-and-authority", "plan-and-budget", "technical-requirements", "market-and-standard-price", "tor-and-competition-check"],
    evidence: [ev("currentProcurementRule", "rule", true, true), ev("methodDecisionFacts", "facts")]
  });
  assert.equal(r.status, "awaiting-human-approval");
});

test("loan funded machinery composes procurement project finance and legal workflows", () => {
  const r = runGovernmentWorkflow({ query: "กู้เงินซื้อเครื่องจักรกล 100 ล้านบาท" });
  assert.ok(r.intent.includes("gov.procurement"));
  assert.ok(r.intent.includes("gov.project"));
  assert.ok(r.intent.includes("gov.finance"));
  assert.ok(r.intent.includes("gov.legal"));
  assert.equal(r.governance.failClosed, true);
});

test("legal analysis is blocked until authoritative source and freshness evidence are supplied", () => {
  const r = executeDeepGovernmentWorkflow({ workflowId: "gov.legal", completedStages: ["facts", "legal-questions"] });
  assert.equal(r.currentStage.id, "authoritative-sources");
  assert.ok(r.missingEvidence.includes("officialLegalSource"));
});

test("correspondence requests sender recipient and signing authority before drafting", () => {
  const r = executeDeepGovernmentWorkflow({ workflowId: "gov.correspondence", completedStages: ["document-type"] });
  assert.equal(r.currentStage.id, "sender-recipient");
  assert.deepEqual(r.missingEvidence, ["senderUnit", "recipient", "signingAuthority"]);
});

test("project workflow contains KPI budget and approval deliverables", () => {
  const all = buildCrossWorkflowCase({}, ["gov.project"], [], {});
  assert.equal(all.workflows[0].currentStage.id, "authority");
});

test("completed procurement workflow exposes full deliverable pack", () => {
  const stages = ["need-and-authority", "plan-and-budget", "technical-requirements", "market-and-standard-price", "tor-and-competition-check", "method-selection", "reference-price", "approval-and-publication", "bid-clarification", "evaluation", "contract", "delivery-and-inspection", "asset-registration-and-maintenance"];
  const r = executeDeepGovernmentWorkflow({ workflowId: "gov.procurement", completedStages: stages });
  assert.equal(r.status, "complete");
  assert.ok(r.deliverablesReady.includes("need-memo"));
  assert.ok(r.deliverablesReady.includes("contract-checklist"));
  assert.ok(r.deliverablesReady.includes("inspection-checklist"));
  assert.ok(r.deliverablesReady.includes("asset-maintenance-record"));
});
