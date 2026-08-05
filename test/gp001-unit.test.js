import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";
import { PromptRegistry } from "../src/prompt-registry.js";
import { KnowledgeRegistry } from "../src/knowledge-registry.js";
import { GovernanceLayer } from "../src/governance-layer.js";
import { Observability } from "../src/observability.js";
import { GP001Module, GP001_TEMPLATE_TYPES } from "../src/modules/gp001/index.js";

function runtime(options = {}) {
  const contextManager = new ContextManager();
  const dependencies = {
    contextManager,
    router: new TransactionRouter(contextManager),
    promptRegistry: new PromptRegistry(contextManager),
    knowledgeRegistry: new KnowledgeRegistry(contextManager),
    governance: new GovernanceLayer(contextManager),
    observability: new Observability(contextManager),
  };
  return { ...dependencies, gp001: new GP001Module(dependencies, options) };
}

function input(overrides = {}) {
  return {
    templateType: "internal-letter",
    subject: "Budget meeting",
    recipients: ["Finance Division"],
    instructions: "Invite the division to a budget meeting",
    principal: { id: "officer-1", role: "officer" },
    ...overrides,
  };
}

test("registers GP001 prompt v2 with metadata and permissions", () => {
  const { promptRegistry } = runtime();
  const prompt = promptRegistry.getPrompt("GP001", "2.0.0");
  assert.equal(prompt.metadata.category, "official-government-correspondence");
  assert.deepEqual(prompt.metadata.permissions, ["gp001:execute"]);
});

test("registers four authoritative GP001 knowledge sources", () => {
  const { knowledgeRegistry } = runtime();
  const ids = knowledgeRegistry.search("", { language: "th" }).map(({ id }) => id);
  assert.equal(ids.filter((id) => id.startsWith("gp001-")).length, 4);
});

test("supports all six official document templates", () => {
  assert.deepEqual(GP001_TEMPLATE_TYPES, [
    "internal-letter", "external-letter", "order", "announcement", "memorandum", "report",
  ]);
});

test("validates required workflow input", async () => {
  const { gp001 } = runtime();
  await assert.rejects(() => gp001.execute(input({ recipients: [] })), /recipients/);
});

test("detects and masks PDPA identifiers", () => {
  const { gp001 } = runtime();
  const findings = gp001.detectPDPA(input({ instructions: "Contact person@example.org or 0812345678" }));
  assert.deepEqual(findings.map(({ type }) => type), ["email", "phone"]);
  assert.ok(findings.every(({ maskedValue }) => maskedValue.includes("***")));
});

test("requires approval when PDPA data is detected", async () => {
  const { gp001 } = runtime();
  const result = await gp001.execute(input({ instructions: "Citizen ID 1234567890123" }));
  assert.equal(result.status, "approval_required");
  assert.equal(result.pdpaFindings[0].type, "national-id");
});

test("rejects unauthorized roles", async () => {
  const { gp001 } = runtime();
  await assert.rejects(
    () => gp001.execute(input({ principal: { id: "guest-1", role: "guest" } })),
    /Knowledge authorization failed/,
  );
});

test("validates executor output against the prompt schema", async () => {
  const { gp001 } = runtime({ executor: () => ({ invalid: true }) });
  await assert.rejects(() => gp001.execute(input()), /output missing/);
});
