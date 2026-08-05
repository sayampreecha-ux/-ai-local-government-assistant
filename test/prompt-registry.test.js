import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager, MODULES } from "../src/context-manager.js";
import {
  DEFAULT_PROMPTS,
  PromptRegistry,
  validatePromptDefinition,
} from "../src/prompt-registry.js";

function definition(version = "1.0.0") {
  return {
    moduleId: "GP001",
    version,
    template: "Draft {{subject}} for {{audience}}",
    metadata: {
      category: "policy",
      owner: "policy-team",
      description: "Draft a policy document",
      requiredInputs: ["subject", "audience"],
      outputSchema: { type: "object", required: ["draft"] },
      permissions: ["policy:write"],
    },
  };
}

test("provides a central default definition for every GP module", () => {
  const registry = new PromptRegistry(new ContextManager());
  assert.equal(registry.listPrompts().length, 12);
  assert.deepEqual(DEFAULT_PROMPTS.map(({ moduleId }) => moduleId), MODULES);
});

test("registers and retrieves immutable runtime definitions", () => {
  const registry = new PromptRegistry(new ContextManager(), []);
  const registered = registry.registerPrompt(definition());
  registered.metadata.owner = "changed";
  assert.equal(registry.getPrompt("GP001", "1.0.0").metadata.owner, "policy-team");
});

test("resolves latest prompt using semantic version order", () => {
  const registry = new PromptRegistry(new ContextManager(), []);
  registry.registerPrompt(definition("1.9.0"));
  registry.registerPrompt(definition("1.10.0"));
  assert.equal(registry.getPrompt("GP001").version, "1.10.0");
});

test("detects duplicate module and version registrations", () => {
  const registry = new PromptRegistry(new ContextManager(), []);
  registry.registerPrompt(definition());
  assert.throws(() => registry.registerPrompt(definition()), /Duplicate prompt/);
});

test("validates metadata and required input placeholders", () => {
  const invalid = definition();
  invalid.metadata.requiredInputs.push("missing");
  assert.throws(() => validatePromptDefinition(invalid), /missing from template/);
  assert.throws(
    () => validatePromptDefinition({ ...definition(), version: "v1" }),
    /semantic versioning/,
  );
});

test("validates inputs and renders a versioned prompt", () => {
  const registry = new PromptRegistry(new ContextManager(), [definition()]);
  assert.throws(() => registry.resolvePrompt("GP001", { subject: "AI" }), /audience/);
  const resolved = registry.resolvePrompt("GP001", {
    subject: "AI policy",
    audience: "agencies",
  });
  assert.equal(resolved.renderedPrompt, "Draft AI policy for agencies");
  assert.equal(resolved.definition.version, "1.0.0");
});

test("records runtime registration and resolution in ContextManager", () => {
  const contextManager = new ContextManager();
  const registry = new PromptRegistry(contextManager, []);
  registry.registerPrompt(definition());
  registry.resolvePrompt("GP001", { subject: "AI", audience: "public" });
  assert.deepEqual(
    contextManager.getContext().transactionHistory.map(({ type }) => type),
    ["prompt.registered", "prompt.resolved"],
  );
});

test("preserves legacy register() and get() APIs", () => {
  const registry = new PromptRegistry(new ContextManager(), []);
  registry.register(definition());
  assert.equal(registry.get("GP001").version, "1.0.0");
});
