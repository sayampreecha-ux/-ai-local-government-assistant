import test from "node:test";
import assert from "node:assert/strict";
import { checkBudget } from "../../src/modules/gp004/budget-engine.js";
import { analyzeEligibility } from "../../src/modules/gp004/eligibility-engine.js";
import { analyzeTravel } from "../../src/modules/gp004/travel-engine.js";
import { analyzeAllowances } from "../../src/modules/gp004/allowance-engine.js";
import { analyzeReimbursement } from "../../src/modules/gp004/reimbursement-engine.js";
import { analyzeFinance } from "../../src/modules/gp004/finance-engine.js";
import { buildFinanceAuditChecklist } from "../../src/modules/gp004/audit-engine.js";
import { analyzeFinanceCompliance } from "../../src/modules/gp004/compliance-engine.js";
import { formatGP004Output } from "../../src/modules/gp004/output-engine.js";
import { validateGP004Input } from "../../src/modules/gp004/validator.js";
import { GP004_KNOWLEDGE } from "../../src/modules/gp004/knowledge/index.js";
import { GP004_TEMPLATES } from "../../src/modules/gp004/templates/index.js";

const eligibleInput = {
  financeType: "reimbursement", employee: { status: "civil-servant" },
  approvals: ["supervisor"], documents: { budgetCertification: true }, receipts: [{ id: "r1" }],
};

test("checks budget availability and utilization", () => {
  const result = checkBudget({ budgetAllocated: 1000, budgetCommitted: 200, requestedAmount: 300 });
  assert.equal(result.sufficient, true);
  assert.equal(result.remainingAfterRequest, 500);
  assert.equal(result.utilizationAfterRequest, 0.5);
});

test("detects insufficient budget without negative remaining balance", () => {
  const result = checkBudget({ budgetAllocated: 100, budgetCommitted: 80, requestedAmount: 50 });
  assert.equal(result.sufficient, false);
  assert.equal(result.remainingAfterRequest, 20);
});

test("analyzes reimbursement eligibility", () => {
  assert.equal(analyzeEligibility(eligibleInput).eligible, true);
  assert.deepEqual(analyzeEligibility({ ...eligibleInput, approvals: [] }).reasons, ["supervisor-approval-missing"]);
});

test("calculates travel, lodging, and subsistence caps", () => {
  const result = analyzeTravel({ days: 2, distanceKm: 100, mode: "private-vehicle", lodgingRate: 1000, subsistenceRate: 300 });
  assert.deepEqual(result, { days: 2, distanceKm: 100, mode: "private-vehicle", transportCap: 400, lodgingCap: 2000, subsistenceCap: 600, totalCap: 3000 });
});

test("caps house rental, meals, medical, welfare, and maintenance allowances", () => {
  const result = analyzeAllowances({
    allowances: { houseRental: 6000, meal: 600, medical: 2000, welfare: 1000, maintenanceFund: 5000 },
    allowanceRates: { houseRental: 5000, meal: 500, medical: 1500, welfare: 800, maintenanceFund: 4000 },
  });
  assert.equal(result.allowed.houseRental, 5000);
  assert.equal(result.allowed.maintenanceFund, 4000);
});

test("allows only documented eligible reimbursement claims", () => {
  const result = analyzeReimbursement([
    { id: "c1", amount: 500, cap: 400, receiptId: "r1" },
    { id: "c2", amount: 200, receiptId: "missing" },
  ], [{ id: "r1" }], { eligible: true });
  assert.equal(result.requestedTotal, 700);
  assert.equal(result.allowedTotal, 400);
});

test("analyzes training cost and financial risk", () => {
  const result = analyzeFinance({
    financeType: "training", training: { participants: 10, totalCost: 10000 }, approvals: [], requestedAmount: 10000,
  }, { sufficient: true, availableBeforeRequest: 20000, utilizationAfterRequest: 0.5 }, { eligible: true }, { allowedTotal: 0 }, {});
  assert.equal(result.training.costPerParticipant, 1000);
  assert.equal(result.training.approved, false);
  assert.equal(result.risk.level, "low");
});

test("builds a nine-item financial audit checklist", () => {
  const result = buildFinanceAuditChecklist({
    input: eligibleInput, eligibility: { eligible: true }, budget: { sufficient: true },
    reimbursement: { claims: [{ documented: true }] }, finance: { training: { approved: true }, risk: { level: "low" } }, knowledgeCount: 7,
  });
  assert.equal(result.total, 9);
  assert.equal(result.readyForPayment, true);
});

test("combines finance and linked-module compliance", () => {
  const compliant = analyzeFinanceCompliance({
    eligibility: { reasons: [] }, budget: { sufficient: true }, audit: { readyForPayment: true },
    legalReview: { status: "completed" }, procurementReview: { status: "completed" },
  });
  assert.equal(compliant.compliant, true);
  assert.deepEqual(compliant.linkedReviews, { legal: "completed", procurement: "completed" });
});

test("validates finance input and supplies deterministic defaults", () => {
  const valid = validateGP004Input({
    purpose: "Travel reimbursement", financeType: "travel", requestedAmount: 100,
    budgetAllocated: 1000, budgetCommitted: 0, template: "travel-analysis", outputFormat: "json",
    principal: { id: "f1", role: "finance-officer" },
  });
  assert.deepEqual(valid.claims, []);
  assert.throws(() => validateGP004Input({}), /purpose/);
});

test("formats all finance output envelopes", () => {
  const result = {
    template: "finance-opinion", eligibility: { eligible: true },
    budget: { availableBeforeRequest: 100, requested: 50, sufficient: true }, finance: { payableAmount: 50 },
    travel: {}, allowances: {}, reimbursement: {}, risk: { level: "low", score: 0 },
    audit: { passed: 9, total: 9 }, compliance: { compliant: true, findings: [] },
  };
  assert.match(formatGP004Output(result, "markdown"), /^# Finance Opinion/);
  assert.equal(formatGP004Output(result, "json").template, "finance-opinion");
  assert.equal(formatGP004Output(result, "audit-log").event, "gp004.finance-analysis");
  assert.equal(formatGP004Output(result, "api-response").moduleId, "GP004");
});

test("registers six templates and seven finance knowledge sources", () => {
  assert.equal(GP004_TEMPLATES.length, 6);
  assert.equal(GP004_KNOWLEDGE.length, 7);
});
