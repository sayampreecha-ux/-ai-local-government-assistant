import test from "node:test";
import assert from "node:assert/strict";
import {
  ContextManager,
  TransactionRouter,
  PromptRegistry,
  KnowledgeRegistry,
  GovernanceLayer,
  Observability,
  GP001Module,
} from "../src/index.js";

function integratedRuntime() {
  const contextManager = new ContextManager();
  const dependencies = {
    contextManager,
    router: new TransactionRouter(contextManager),
    promptRegistry: new PromptRegistry(contextManager),
    knowledgeRegistry: new KnowledgeRegistry(contextManager),
    governance: new GovernanceLayer(contextManager),
    observability: new Observability(contextManager),
  };
  return { ...dependencies, gp001: new GP001Module(dependencies) };
}

const base = {
  subject: "Quarterly operations",
  recipients: ["Director"],
  instructions: "Report quarterly operational results",
  principal: { id: "officer-1", role: "officer" },
};

test("executes the complete GP001 workflow across all six Core services", async () => {
  const runtime = integratedRuntime();
  const result = await runtime.gp001.execute({ ...base, templateType: "report", localGovernment: true });
  assert.equal(result.status, "completed");
  assert.equal(result.moduleId, "GP001");
  assert.equal(result.promptVersion, "2.0.0");
  assert.equal(result.document.documentType, "report");
  assert.ok(result.document.legalReferences.length >= 2);

  const context = runtime.contextManager.getContext();
  assert.equal(context.activeModule, "GP001");
  assert.equal(context.workflowState.step, "completed");
  assert.equal(context.userSelections.gp001Template, "report");
  assert.ok(context.transactionHistory.some(({ type }) => type === "gp001.completed"));
  assert.ok(runtime.observability.getMetrics().some(({ name }) => name === "gp001.completed.total"));
});

test("renders each document type through the integrated workflow", async () => {
  const runtime = integratedRuntime();
  for (const templateType of [
    "internal-letter", "external-letter", "order", "announcement", "memorandum", "report",
  ]) {
    const result = await runtime.gp001.execute({ ...base, templateType });
    assert.equal(result.document.documentType, templateType);
  }
});

test("produces correlated audit and diagnostic evidence", async () => {
  const runtime = integratedRuntime();
  await runtime.gp001.execute({ ...base, templateType: "memorandum" });
  runtime.observability.registerHealthCheck("context", () => ({ status: "healthy" }));
  const diagnostics = await runtime.observability.diagnostics();
  assert.equal(diagnostics.health.status, "healthy");
  assert.ok(runtime.observability.getAuditEvents().some(({ type }) => type === "gp001.completed"));
  const audit = runtime.observability.getAuditEvents().at(-1);
  assert.ok(audit.traceId);
  assert.ok(audit.transactionId);
});
