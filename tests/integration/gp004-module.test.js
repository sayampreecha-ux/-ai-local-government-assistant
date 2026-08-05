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

function runtime() {
  const contextManager = new ContextManager();
  const core = {
    contextManager,
    router: new TransactionRouter(contextManager),
    promptRegistry: new PromptRegistry(contextManager),
    knowledgeRegistry: new KnowledgeRegistry(contextManager),
    governance: new GovernanceLayer(contextManager),
    observability: new Observability(contextManager),
  };
  const lawCopilot = new GP002Module(core);
  const procurementCopilot = new GP003Module(core);
  return { ...core, lawCopilot, procurementCopilot, gp004: new GP004Module({ ...core, lawCopilot, procurementCopilot }) };
}

const input = (overrides = {}) => ({
  purpose: "Reimburse approved official travel",
  financeType: "reimbursement",
  requestedAmount: 900,
  budgetAllocated: 10000,
  budgetCommitted: 1000,
  employee: { status: "local-government-officer" },
  approvals: ["supervisor"],
  documents: { budgetCertification: true },
  claims: [{ id: "claim-1", amount: 900, cap: 900, receiptId: "receipt-1" }],
  receipts: [{ id: "receipt-1" }],
  travel: { days: 1, distanceKm: 100, mode: "private-vehicle", lodgingRate: 0, subsistenceRate: 300 },
  contractTerms: ["termination", "penalty"],
  template: "reimbursement-analysis",
  outputFormat: "json",
  principal: { id: "finance-1", role: "finance-officer" },
  ...overrides,
});

test("registers GP004 prompt, workflow, templates, policies, and knowledge idempotently", () => {
  const current = runtime();
  new GP004Module(current);
  assert.equal(current.promptRegistry.getPrompt("GP004", "2.0.0").metadata.owner, "government-finance-team");
  assert.equal(current.knowledgeRegistry.search("", {}).filter(({ id }) => id.startsWith("gp004-")).length, 7);
});

test("executes deterministic finance workflow across Sprint 1 Core", async () => {
  const current = runtime();
  const first = await current.gp004.execute(input());
  const second = await current.gp004.execute(input());
  assert.equal(first.status, "completed");
  assert.deepEqual(first.analysis, second.analysis);
  assert.equal(first.analysis.reimbursement.allowedTotal, 900);
  const context = current.contextManager.getContext();
  assert.equal(context.activeModule, "GP004");
  assert.equal(context.procurementAndBudgetContext.budgetAvailable, 8100);
  assert.ok(current.observability.getAuditEvents().some(({ type }) => type === "gp004.completed"));
});

test("integrates completed GP002 legal and GP003 procurement reviews", async () => {
  const current = runtime();
  const result = await current.gp004.execute(input({
    legalReviewInput: {
      facts: "The payment concerns an administrative procurement contract.",
      question: "Is the payment authority established?", template: "executive-summary", outputFormat: "json",
      principal: { id: "legal-1", role: "legal-officer" },
    },
    procurementReviewInput: {
      objective: "Acquire travel service", estimatedBudget: 100000,
      specifications: [{ requirement: "Service capacity at least 10 trips", measurement: "trips" }],
      template: "executive-summary", outputFormat: "json",
      principal: { id: "proc-1", role: "procurement-officer" },
    },
  }));
  assert.equal(result.analysis.finance.crossModule.legal.status, "completed");
  assert.equal(result.analysis.finance.crossModule.procurement.status, "completed");
  assert.deepEqual(result.analysis.compliance.linkedReviews, { legal: "completed", procurement: "completed" });
  assert.equal(current.contextManager.getContext().activeModule, "GP004");
});

test("supports Markdown, audit-log, and API response output", async () => {
  const current = runtime();
  const markdown = await current.gp004.execute(input({ outputFormat: "markdown" }));
  const audit = await current.gp004.execute(input({ outputFormat: "audit-log" }));
  const api = await current.gp004.execute(input({ outputFormat: "api-response" }));
  assert.match(markdown.output, /^# Reimbursement Analysis/);
  assert.equal(audit.output.event, "gp004.finance-analysis");
  assert.equal(api.output.ok, true);
});
