import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../../src/context-manager.js";
import { TransactionRouter } from "../../src/transaction-router.js";
import { PromptRegistry } from "../../src/prompt-registry.js";
import { KnowledgeRegistry } from "../../src/knowledge-registry.js";
import { GovernanceLayer } from "../../src/governance-layer.js";
import { Observability } from "../../src/observability.js";
import { GP002Module } from "../../src/modules/gp002/gp002-module.js";
import { GP003Module } from "../../src/modules/gp003/gp003-module.js";
import { GP004Module } from "../../src/modules/gp004/gp004-module.js";
import { GP005Module } from "../../src/modules/gp005/gp005-module.js";

function runtime() {
  const contextManager = new ContextManager();
  const core = { contextManager, router: new TransactionRouter(contextManager), promptRegistry: new PromptRegistry(contextManager), knowledgeRegistry: new KnowledgeRegistry(contextManager), governance: new GovernanceLayer(contextManager), observability: new Observability(contextManager) };
  const lawCopilot = new GP002Module(core); const procurementCopilot = new GP003Module(core);
  const financeCopilot = new GP004Module({ ...core, lawCopilot, procurementCopilot });
  return { ...core, lawCopilot, procurementCopilot, financeCopilot, gp005: new GP005Module({ ...core, lawCopilot, procurementCopilot, financeCopilot }) };
}
const base = (overrides = {}) => ({
  purpose: "Municipal development equipment", classification: "investment", allocated: 1000000, spent: 200000, committed: 100000, requestedAmount: 300000,
  ordinance: { approved: true, appropriatedAmount: 1000000, fiscalYear: 2026, approvedDate: "2025-09-01", effectiveDate: "2026-01-01" },
  developmentPlan: { projectId: "p1", localProjectIds: ["p1"], strategicProjectIds: ["p1"], indicator: "service-capacity" },
  documents: { budgetCertification: true }, template: "budget-opinion", outputFormat: "json",
  principal: { id: "budget-1", role: "budget-officer" }, ...overrides,
});
test("registers prompt, workflow, templates, policies, and twelve knowledge sources idempotently", () => {
  const current = runtime(); new GP005Module(current);
  assert.equal(current.promptRegistry.getPrompt("GP005", "2.0.0").metadata.owner, "government-budget-team");
  assert.equal(current.knowledgeRegistry.search("", {}).filter(({ id }) => id.startsWith("gp005-")).length, 12);
});
test("executes deterministic GP005 workflow through Sprint 1 Core", async () => {
  const current = runtime(); const first = await current.gp005.execute(base()); const second = await current.gp005.execute(base());
  assert.equal(first.status, "completed"); assert.deepEqual(first.analysis, second.analysis);
  assert.equal(current.contextManager.getContext().activeModule, "GP005"); assert.equal(current.contextManager.getContext().procurementAndBudgetContext.sufficient, true);
  assert.ok(current.observability.getAuditEvents().some(({ type }) => type === "gp005.completed"));
});
test("integrates completed GP002, GP003, and GP004 reviews", async () => {
  const current = runtime(); const result = await current.gp005.execute(base({
    legalReviewInput: { facts: "Budget ordinance authorizes the project.", question: "Is authority established?", template: "executive-summary", outputFormat: "json", principal: { id: "l1", role: "legal-officer" } },
    procurementReviewInput: { objective: "Acquire equipment", estimatedBudget: 300000, specifications: [{ requirement: "Capacity at least 100 units", measurement: "units" }], template: "executive-summary", outputFormat: "json", principal: { id: "p1", role: "procurement-officer" } },
    financeReviewInput: { purpose: "Validate payment eligibility", financeType: "reimbursement", requestedAmount: 100, budgetAllocated: 1000, budgetCommitted: 0, employee: { status: "officer" }, approvals: ["supervisor"], documents: { budgetCertification: true }, claims: [{ id: "c1", amount: 100, receiptId: "r1" }], receipts: [{ id: "r1" }], template: "finance-opinion", outputFormat: "json", principal: { id: "f1", role: "finance-officer" } },
  }));
  assert.deepEqual(Object.fromEntries(Object.entries(result.analysis.crossModule).map(([key, value]) => [key, value.status])), { legal: "completed", procurement: "completed", finance: "completed" });
  assert.equal(current.contextManager.getContext().activeModule, "GP005");
});
test("supports all five output formats", async () => {
  const current = runtime();
  const markdown = await current.gp005.execute(base({ outputFormat: "markdown" })); const audit = await current.gp005.execute(base({ outputFormat: "audit-log" }));
  const executive = await current.gp005.execute(base({ outputFormat: "executive-report" })); const api = await current.gp005.execute(base({ outputFormat: "api-response" }));
  assert.match(markdown.output, /^# Budget Opinion/); assert.equal(audit.output.event, "gp005.budget-analysis"); assert.match(executive.output, /Fiscal Risk/); assert.equal(api.output.ok, true);
});
