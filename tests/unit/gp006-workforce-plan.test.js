import test from "node:test";
import assert from "node:assert/strict";
import { analyzeThreeYearWorkforcePlan } from "../../src/modules/gp006/workforce-engine.js";
import { runHRWorkflow } from "../../src/modules/gp006/workflow.js";

test("routes Thai workforce-plan intent without requiring a menu", () => {
  const result = runHRWorkflow({ query: "ทำแผนอัตรากำลัง อบต.ดงสุวรรณ รอบ 2570-2572" });
  assert.equal(result.intent, "hr.three-year-workforce-plan");
  assert.equal(result.workforcePlan.status, "needs-evidence");
  assert.equal(result.humanApprovalRequired, true);
});

test("does not fabricate missing establishment/headcount", () => {
  const result = analyzeThreeYearWorkforcePlan({
    workforcePlan: { organization: { type: "อบต.", name: "ตัวอย่าง" }, period: { start: 2570, end: 2572 } }
  });
  assert.equal(result.status, "needs-evidence");
  assert.ok(result.unresolved.includes("positions/current-establishment"));
});

test("computes workload gap only from supplied evidence", () => {
  const result = analyzeThreeYearWorkforcePlan({
    workforcePlan: {
      organization: { type: "เทศบาล", name: "ตัวอย่าง" },
      period: { start: 2570, end: 2572 },
      positions: [{ unit: "กองช่าง", position: "นายช่าง", authorized: 2, filled: 1, evidence: "uploaded-plan" }],
      workloads: [{ unit: "กองช่าง", activity: "ควบคุมงาน", annualVolume: 100, hoursPerCase: 8, productiveHoursPerFTE: 1600, currentFTE: 1 }],
      sources: [{ official: true, verified: true }]
    }
  });
  assert.equal(result.status, "analysis-ready");
  assert.equal(result.positionAnalysis[0].vacancy, 1);
  assert.equal(result.workloadAnalysis[0].requiredFTE, 0.5);
  assert.equal(result.governance.humanApprovalRequired, true);
});

test("requires official-source verification before recommendation", () => {
  const result = analyzeThreeYearWorkforcePlan({
    workforcePlan: {
      organization: { type: "อบจ.", name: "ตัวอย่าง" },
      period: { start: 2570, end: 2572 },
      positions: [{ position: "นักทรัพยากรบุคคล", authorized: 1, filled: 1 }],
      sources: []
    }
  });
  assert.equal(result.status, "needs-evidence");
  assert.ok(result.unresolved.includes("latest-official-rule/source-verification"));
});
