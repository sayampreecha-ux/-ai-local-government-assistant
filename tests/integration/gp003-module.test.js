import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../../src/context-manager.js";
import { TransactionRouter } from "../../src/transaction-router.js";
import { PromptRegistry } from "../../src/prompt-registry.js";
import { KnowledgeRegistry } from "../../src/knowledge-registry.js";
import { GovernanceLayer } from "../../src/governance-layer.js";
import { Observability } from "../../src/observability.js";
import { GP003Module } from "../../src/modules/gp003/gp003-module.js";

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
  return { ...core, gp003: new GP003Module(core) };
}

const input = (overrides = {}) => ({
  objective: "Acquire municipal service equipment",
  estimatedBudget: 1000000,
  specifications: [
    { requirement: "Capacity shall be at least 100 units", measurement: "units" },
    { requirement: "Warranty shall be at least 24 months", measurement: "months" },
  ],
  vendors: [
    { id: "vendor-a", qualifications: ["license", "experience"] },
    { id: "vendor-b", qualifications: ["license", "experience"] },
    { id: "vendor-c", qualifications: ["license"] },
  ],
  qualificationCriteria: ["license", "experience"],
  marketPrices: [950000, 1000000, 1050000],
  contractTerms: ["termination", "penalty"],
  documents: { budgetApproved: true, procurementPlan: true },
  submissionDays: 15,
  template: "procurement-opinion",
  outputFormat: "json",
  principal: { id: "procurement-1", role: "procurement-officer" },
  ...overrides,
});

test("registers GP003 prompt, workflow, templates, policies, and knowledge idempotently", () => {
  const current = runtime();
  new GP003Module(current);
  assert.equal(current.promptRegistry.getPrompt("GP003", "2.0.0").metadata.owner, "government-procurement-team");
  assert.equal(current.knowledgeRegistry.search("", {}).filter(({ id }) => id.startsWith("gp003-")).length, 7);
});

test("executes deterministically through all Sprint 1 Core services", async () => {
  const current = runtime();
  const first = await current.gp003.execute(input());
  const second = await current.gp003.execute(input());
  assert.equal(first.status, "completed");
  assert.deepEqual(first.analysis, second.analysis);
  const context = current.contextManager.getContext();
  assert.equal(context.activeModule, "GP003");
  assert.equal(context.procurementAndBudgetContext.recommendedMethod, "e-bidding");
  assert.ok(current.observability.getAuditEvents().some(({ type }) => type === "gp003.completed"));
});

test("detects specification lock and raises procurement risk", async () => {
  const current = runtime();
  const result = await current.gp003.execute(input({
    specifications: [{ requirement: "Brand only exact model X100", brand: "X", equivalentAllowed: false }],
    vendors: [{ id: "vendor-a", qualifications: ["license", "experience"] }],
    submissionDays: 3,
  }));
  assert.equal(result.analysis.tor.specificationLockDetected, true);
  assert.equal(result.analysis.competition.level, "restricted");
  assert.equal(result.analysis.procurement.recommendedMethod, "revise-tor-before-selection");
  assert.equal(result.analysis.risk.level, "high");
});

test("supports report, audit, and API output formats", async () => {
  const current = runtime();
  const markdown = await current.gp003.execute(input({ outputFormat: "markdown" }));
  const audit = await current.gp003.execute(input({ outputFormat: "audit-log" }));
  const api = await current.gp003.execute(input({ outputFormat: "api-response" }));
  assert.match(markdown.output, /^# Procurement Opinion/);
  assert.equal(audit.output.event, "gp003.procurement-analysis");
  assert.equal(api.output.ok, true);
});
