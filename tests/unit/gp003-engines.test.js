import test from "node:test";
import assert from "node:assert/strict";
import { reviewTOR } from "../../src/modules/gp003/tor-engine.js";
import { analyzeCompetition } from "../../src/modules/gp003/competition-engine.js";
import { analyzeVendors } from "../../src/modules/gp003/vendor-engine.js";
import { analyzePricing } from "../../src/modules/gp003/pricing-engine.js";
import { recommendProcurementMethod } from "../../src/modules/gp003/procurement-engine.js";
import { assessProcurementRisk } from "../../src/modules/gp003/risk-engine.js";
import { buildComplianceChecklist } from "../../src/modules/gp003/compliance-engine.js";
import { formatGP003Output } from "../../src/modules/gp003/output-engine.js";
import { validateGP003Input } from "../../src/modules/gp003/validator.js";
import { GP003_KNOWLEDGE } from "../../src/modules/gp003/knowledge/index.js";
import { GP003_TEMPLATES } from "../../src/modules/gp003/templates/index.js";

const cleanTOR = reviewTOR([{ requirement: "Capacity shall be at least 100 units", measurement: "units" }]);

test("reviews TOR clarity, measurability, and completeness", () => {
  assert.equal(cleanTOR.completenessScore, 1);
  assert.equal(cleanTOR.specificationLockDetected, false);
});

test("detects restrictive and brand-locked specifications", () => {
  const result = reviewTOR([{ requirement: "Brand only exact model X100", brand: "X", equivalentAllowed: false }]);
  assert.equal(result.specificationLockDetected, true);
  assert.deepEqual(result.findings[0].lockReasons, ["brand-without-equivalent", "restrictive-language"]);
});

test("scores competition fairness deterministically", () => {
  const result = analyzeCompetition({ tor: { specificationLockDetected: true }, vendors: [{ id: "one" }], submissionDays: 3 });
  assert.equal(result.fairnessScore, 10);
  assert.equal(result.level, "restricted");
});

test("assesses vendor qualification against explicit criteria", () => {
  const result = analyzeVendors([
    { id: "a", qualifications: ["license", "experience"] },
    { id: "b", qualifications: ["license"] },
  ], ["license", "experience"]);
  assert.equal(result.qualifiedCount, 1);
  assert.deepEqual(result.assessments[1].missing, ["experience"]);
});

test("analyzes price range, variance, reasonableness, and outliers", () => {
  const result = analyzePricing(105, [100, 105, 110]);
  assert.equal(result.average, 105);
  assert.equal(result.status, "reasonable");
  assert.deepEqual(result.outliers, []);
});

test("recommends procurement method and e-GP workflow", () => {
  const result = recommendProcurementMethod({ estimatedBudget: 1000000, competition: { level: "fair" } });
  assert.equal(result.recommendedMethod, "e-bidding");
  assert.deepEqual(result.egpWorkflow.slice(0, 3), ["procurement-plan", "tor-and-reference-price", "approval"]);
});

test("blocks method recommendation when competition is restricted", () => {
  const result = recommendProcurementMethod({ estimatedBudget: 100000, competition: { level: "restricted" } });
  assert.equal(result.recommendedMethod, "revise-tor-before-selection");
});

test("classifies cumulative procurement and contract risk", () => {
  const risk = assessProcurementRisk({
    tor: { specificationLockDetected: true }, competition: { level: "restricted" },
    vendors: { assessments: [{ vendorId: "a" }], qualifiedCount: 0 },
    pricing: { status: "above-market" }, procurement: { recommendedMethod: "revise-tor-before-selection" },
    contractTerms: [],
  });
  assert.equal(risk.level, "high");
  assert.equal(risk.score, 1);
});

test("builds a nine-item procurement audit checklist", () => {
  const compliance = buildComplianceChecklist({
    input: { documents: { budgetApproved: true, procurementPlan: true } },
    tor: cleanTOR, competition: { level: "fair" }, vendors: { assessments: [], qualifiedCount: 0 },
    pricing: { sampleSize: 3 }, procurement: { recommendedMethod: "e-bidding" }, knowledgeCount: 7,
  });
  assert.equal(compliance.total, 9);
  assert.equal(compliance.compliant, true);
});

test("validates module inputs", () => {
  const valid = validateGP003Input({
    objective: "Acquire equipment", estimatedBudget: 1000,
    specifications: [{ requirement: "Capacity 100 units" }],
    template: "tor-review", outputFormat: "json",
    principal: { id: "p-1", role: "procurement-officer" },
  });
  assert.equal(valid.submissionDays, 15);
  assert.throws(() => validateGP003Input({}), /objective/);
});

test("formats all procurement output envelopes", () => {
  const result = {
    template: "tor-review", tor: cleanTOR, competition: { level: "fair", fairnessScore: 100 },
    vendors: { qualifiedCount: 0 }, pricing: { status: "reasonable" },
    procurement: { recommendedMethod: "e-bidding", rationale: "Budget" },
    risk: { level: "low", score: 0.1 }, compliance: { passed: 9, total: 9 },
  };
  assert.match(formatGP003Output(result, "markdown"), /^# TOR Review/);
  assert.equal(formatGP003Output(result, "json").template, "tor-review");
  assert.equal(formatGP003Output(result, "audit-log").event, "gp003.procurement-analysis");
  assert.equal(formatGP003Output(result, "api-response").moduleId, "GP003");
});

test("registers six templates and seven controlled knowledge sources", () => {
  assert.equal(GP003_TEMPLATES.length, 6);
  assert.equal(GP003_KNOWLEDGE.length, 7);
});
