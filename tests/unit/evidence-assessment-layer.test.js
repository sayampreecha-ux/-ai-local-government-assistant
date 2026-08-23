import test from "node:test";
import assert from "node:assert/strict";
import {
  createEvidenceSnapshot,
  analyzeEvidenceGaps,
  buildAssessmentPack
} from "../../src/evidence-assessment-layer.js";
import { runGovernmentTaskV5 } from "../../src/government-task-router-v5.js";

test("evidence snapshot records baseline-to-audit dimensions", () => {
  const snapshot = createEvidenceSnapshot({
    caseId: "CASE-1",
    workflowIds: ["gov.project"],
    baseline: "ปัญหาเดิม",
    action: "ดำเนินโครงการ",
    output: "ผู้ผ่านอบรม 100 คน",
    outcome: "ทักษะเพิ่ม",
    kpi: "ผ่านเกณฑ์ >= 80%",
    owner: "กองยุทธศาสตร์",
    deadline: "2026-09-30",
    evidence: [{ key: "project-report", value: "รายงานผล", official: true, verified: true }],
    auditTrail: [{ event: "approved" }]
  });
  assert.equal(snapshot.caseId, "CASE-1");
  assert.equal(snapshot.evidence.length, 1);
  assert.equal(snapshot.governance.noFabrication, true);
});

test("gap analysis never invents missing assessment evidence", () => {
  const snapshot = createEvidenceSnapshot({ workflowIds: ["gov.procurement"] });
  const gaps = analyzeEvidenceGaps(snapshot);
  assert.equal(gaps.complete, false);
  assert.ok(gaps.gaps.some((gap) => gap.dimension === "baseline"));
  assert.ok(gaps.gaps.some((gap) => gap.dimension === "evidence"));
});

test("verified complete pack is ready for human assessment", () => {
  const pack = buildAssessmentPack({
    baseline: "ฐานเดิม",
    action: "กิจกรรม",
    output: "ผลผลิต",
    outcome: "ผลลัพธ์",
    kpi: "ตัวชี้วัด",
    owner: "เจ้าภาพ",
    deadline: "2026-09-30",
    evidence: [{ key: "official-result", value: "หลักฐาน", official: true, verified: true, fresh: true }],
    auditTrail: [{ event: "recorded" }]
  });
  assert.equal(pack.assessmentReadiness, "ready-for-human-assessment");
  assert.ok(pack.reusableFor.includes("LPA"));
  assert.ok(pack.reusableFor.includes("ITA"));
  assert.ok(pack.reusableFor.includes("award-evidence-pack"));
});

test("unverified official evidence blocks readiness", () => {
  const pack = buildAssessmentPack({
    baseline: "ฐานเดิม",
    action: "กิจกรรม",
    output: "ผลผลิต",
    outcome: "ผลลัพธ์",
    kpi: "ตัวชี้วัด",
    owner: "เจ้าภาพ",
    deadline: "2026-09-30",
    evidence: [{ key: "official-result", value: "หลักฐาน", official: true, verified: false }],
    auditTrail: [{ event: "recorded" }]
  });
  assert.equal(pack.assessmentReadiness, "needs-evidence-improvement");
  assert.ok(pack.gapAnalysis.gaps.some((gap) => gap.reason === "unverified-official-evidence"));
});

test("government task router attaches evidence assessment automatically", () => {
  const result = runGovernmentTaskV5({
    query: "ทำโครงการอบรม AI",
    baseline: "เจ้าหน้าที่ยังใช้ AI ไม่คล่อง",
    evidence: []
  });
  assert.ok(result.evidenceAssessment);
  assert.equal(result.evidenceAssessment.snapshot.baseline, "เจ้าหน้าที่ยังใช้ AI ไม่คล่อง");
  assert.ok(result.evidenceAssessment.gapAnalysis.gaps.length > 0);
});
