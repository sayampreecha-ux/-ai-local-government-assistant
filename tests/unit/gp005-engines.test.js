import test from "node:test";
import assert from "node:assert/strict";
import { analyzeBudget } from "../../src/modules/gp005/budget-engine.js";
import { analyzeAppropriation } from "../../src/modules/gp005/appropriation-engine.js";
import { analyzeTransfer } from "../../src/modules/gp005/transfer-engine.js";
import { analyzeReserve } from "../../src/modules/gp005/reserve-engine.js";
import { analyzeCommitment } from "../../src/modules/gp005/commitment-engine.js";
import { analyzeDevelopmentPlan } from "../../src/modules/gp005/development-plan-engine.js";
import { buildBudgetTimeline } from "../../src/modules/gp005/timeline-engine.js";
import { analyzeBudgetMetrics } from "../../src/modules/gp005/analytics-engine.js";
import { assessFiscalRisk } from "../../src/modules/gp005/risk-engine.js";
import { analyzeBudgetCompliance } from "../../src/modules/gp005/compliance-engine.js";
import { formatGP005Output } from "../../src/modules/gp005/output-engine.js";
import { GP005_KNOWLEDGE } from "../../src/modules/gp005/knowledge/index.js";
import { GP005_TEMPLATES } from "../../src/modules/gp005/templates/index.js";

const input = { allocated: 1000, spent: 200, committed: 100, requestedAmount: 300, classification: "investment", ordinance: { approved: true, appropriatedAmount: 1000, fiscalYear: 2026 }, amendment: {}, transfer: {}, reservation: {}, reserveFund: {}, multiYear: {}, developmentPlan: {}, centralBudget: {}, documents: { budgetCertification: true } };

test("analyzes budget availability, sufficiency, shortfall, and classification", () => {
  const result = analyzeBudget(input);
  assert.equal(result.available, 700); assert.equal(result.sufficient, true); assert.equal(result.classificationValid, true);
});
test("validates annual ordinance, amendment, and central budget", () => {
  const result = analyzeAppropriation(input, analyzeBudget(input));
  assert.equal(result.ordinanceValid, true); assert.equal(result.amendmentRequired, false);
});
test("analyzes authorized and unauthorized budget transfers", () => {
  const result = analyzeTransfer({ ...input, transfer: { amount: 100, sourceAvailable: 200, approved: true, fromClassification: "operating", toClassification: "investment" } });
  assert.equal(result.requested, true); assert.equal(result.authorized, true); assert.equal(result.sameClassification, false);
});
test("analyzes reservation and reserve fund sufficiency", () => {
  const result = analyzeReserve({ ...input, reservation: { amount: 100, approved: true }, reserveFund: { balance: 500, requestedAmount: 200, approved: true } });
  assert.equal(result.reservation.supported, true); assert.equal(result.reserveFund.sufficient, true);
});
test("analyzes multi-year commitment and future budget risk", () => {
  const result = analyzeCommitment({ ...input, multiYear: { years: 3, totalAmount: 900, approved: true, futureBudgetEvidence: false } });
  assert.equal(result.annualCommitment, 300); assert.equal(result.futureBudgetRisk, true);
});
test("checks local development and strategic plan consistency", () => {
  const result = analyzeDevelopmentPlan({ ...input, developmentPlan: { projectId: "p1", localProjectIds: ["p1"], strategicProjectIds: ["p1"] } });
  assert.equal(result.consistent, true);
});
test("sorts ordinance, reservation, and commitment timeline", () => {
  const result = buildBudgetTimeline({ ...input, ordinance: { approvedDate: "2026-01-01", effectiveDate: "2026-02-01" }, reservation: { deadline: "2026-09-30" }, multiYear: {} });
  assert.deepEqual(result.map(({ event }) => event), ["ordinance-approved", "budget-effective", "reservation-deadline"]);
});
test("calculates utilization, execution, request, and commitment analytics", () => {
  const result = analyzeBudgetMetrics(input, analyzeBudget(input), analyzeCommitment(input));
  assert.equal(result.utilization, 0.3); assert.equal(result.executionRate, 0.2); assert.equal(result.requestShare, 0.3);
});
test("classifies cumulative fiscal risk", () => {
  const risk = assessFiscalRisk({ budget: { sufficient: false, classificationValid: false }, appropriation: { ordinanceValid: false }, transfer: { requested: true, authorized: false }, reserve: { reserveFund: { sufficient: false } }, commitment: { futureBudgetRisk: true }, developmentPlan: { consistent: false }, analytics: { utilization: 1 }, crossModule: {} });
  assert.equal(risk.level, "high"); assert.equal(risk.score, 1);
});
test("builds thirteen budget compliance controls", () => {
  const result = analyzeBudgetCompliance({ input, budget: { sufficient: true, classificationValid: true }, appropriation: { ordinanceValid: true, amendmentAuthorized: true }, transfer: { authorized: true }, reserve: { reservation: { amount: 0 }, reserveFund: { requested: 0 } }, commitment: { approved: true }, developmentPlan: { consistent: true }, risk: { level: "low" }, knowledgeCount: 12, crossModule: {} });
  assert.equal(result.total, 13); assert.equal(result.compliant, true);
});
test("formats Markdown, JSON, audit, executive, and API outputs", () => {
  const result = { template: "budget-opinion", budget: { available: 700, requested: 300, sufficient: true }, appropriation: { ordinanceValid: true, amendmentRequired: false }, transfer: { authorized: true }, reserve: { reserveFund: { sufficient: true } }, commitment: { years: 1, annualCommitment: 300 }, developmentPlan: { consistent: true }, timeline: [], analytics: {}, risk: { level: "low", score: 0 }, compliance: { passed: 13, total: 13 } };
  assert.match(formatGP005Output(result, "markdown"), /^# Budget Opinion/); assert.equal(formatGP005Output(result, "json").template, "budget-opinion"); assert.equal(formatGP005Output(result, "audit-log").event, "gp005.budget-analysis"); assert.match(formatGP005Output(result, "executive-report"), /Fiscal Risk/); assert.equal(formatGP005Output(result, "api-response").moduleId, "GP005");
});
test("registers eight templates and twelve controlled knowledge sources", () => {
  assert.equal(GP005_TEMPLATES.length, 8); assert.equal(GP005_KNOWLEDGE.length, 12);
});
