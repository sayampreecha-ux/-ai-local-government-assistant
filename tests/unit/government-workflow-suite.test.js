import test from "node:test";
import assert from "node:assert/strict";
import { detectGovernmentWorkflows, runGovernmentWorkflow } from "../../src/government-workflow-suite.js";

test("machine procurement invokes procurement + project + finance", () => {
  const ids = detectGovernmentWorkflows({ query: "อบจ.จะซื้อเครื่องจักร 300 ล้านบาท" }).map((x) => x.id);
  assert.ok(ids.includes("gov.procurement"));
  assert.ok(ids.includes("gov.project"));
  assert.ok(ids.includes("gov.finance"));
});

test("loan-funded machinery also invokes legal workflow and fails closed without verified official evidence", () => {
  const r = runGovernmentWorkflow({ query: "กู้เงิน 100 ล้านบาทซื้อเครื่องจักรกล" });
  assert.ok(r.intent.includes("gov.procurement"));
  assert.ok(r.intent.includes("gov.finance"));
  assert.ok(r.intent.includes("gov.legal"));
  assert.equal(r.governance.failClosed, true);
  assert.equal(r.status, "needs-official-evidence");
});

test("verified official evidence opens high-risk workflow but retains human approval", () => {
  const r = runGovernmentWorkflow({
    query: "จัดซื้อรถขุด e-bidding",
    evidence: [{ official: true, verified: true, source: "government-original" }]
  });
  assert.equal(r.status, "workflow-ready");
  assert.equal(r.governance.failClosed, false);
  assert.equal(r.governance.humanApprovalRequired, true);
});

test("draft official letter routes correspondence workflow", () => {
  const r = runGovernmentWorkflow({ query: "ช่วยร่างหนังสือราชการตอบหน่วยงาน" });
  assert.deepEqual(r.intent, ["gov.correspondence"]);
});

test("government project composes project workflow", () => {
  const r = runGovernmentWorkflow({ query: "ทำโครงการอบรม AI งบ 300000 บาท" });
  assert.ok(r.intent.includes("gov.project"));
});

test("HR task routes HR workflow", () => {
  const r = runGovernmentWorkflow({ query: "เลื่อนเงินเดือนข้าราชการท้องถิ่น" });
  assert.ok(r.intent.includes("gov.hr"));
});
