import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../../src/context-manager.js";
import { TransactionRouter } from "../../src/transaction-router.js";
import { PromptRegistry } from "../../src/prompt-registry.js";
import { KnowledgeRegistry } from "../../src/knowledge-registry.js";
import { GovernanceLayer } from "../../src/governance-layer.js";
import { Observability } from "../../src/observability.js";
import { GP002Module } from "../../src/modules/gp002/gp002-module.js";

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
  return { ...core, gp002: new GP002Module(core) };
}

const input = (overrides = {}) => ({
  facts: "A local authority plans an administrative order.",
  question: "Does the authority have jurisdiction?",
  template: "legal-opinion",
  outputFormat: "json",
  principal: { id: "legal-1", role: "legal-officer" },
  ...overrides,
});

test("registers prompt, workflow policies, knowledge, and PDPA rule idempotently", () => {
  const current = runtime();
  new GP002Module(current);
  assert.equal(current.promptRegistry.getPrompt("GP002", "2.0.0").metadata.owner, "government-legal-team");
  assert.equal(current.knowledgeRegistry.search("", {}).filter(({ id }) => id.startsWith("gp002-")).length, 11);
});

test("runs deterministically across all Sprint 1 Core services", async () => {
  const current = runtime();
  const first = await current.gp002.execute(input());
  const second = await current.gp002.execute(input());
  assert.equal(first.status, "completed");
  assert.deepEqual(first.analysis, second.analysis);
  assert.equal(current.contextManager.getContext().activeModule, "GP002");
  assert.equal(current.contextManager.getContext().workflowState.step, "completed");
  assert.ok(current.observability.getAuditEvents().some(({ type }) => type === "gp002.completed"));
  assert.ok(current.observability.getMetrics().some(({ name }) => name === "gp002.completed.total"));
});

test("supports all output envelopes", async () => {
  const current = runtime();
  const markdown = await current.gp002.execute(input({ outputFormat: "markdown" }));
  const audit = await current.gp002.execute(input({ outputFormat: "audit-log" }));
  const api = await current.gp002.execute(input({ outputFormat: "api-response" }));
  assert.match(markdown.output, /^# Legal Opinion/);
  assert.equal(audit.output.event, "gp002.analysis");
  assert.equal(api.output.moduleId, "GP002");
});

test("gates PDPA data, masks findings, and emits audit evidence", async () => {
  const current = runtime();
  const result = await current.gp002.execute(input({ facts: "Citizen ID 1234567890123 requests advice." }));
  assert.equal(result.status, "approval_required");
  assert.deepEqual(result.pdpaFindings, [{ type: "national-id", length: 13 }]);
  assert.ok(current.observability.getAuditEvents().some(({ type }) => type === "gp002.approval_required"));
});
