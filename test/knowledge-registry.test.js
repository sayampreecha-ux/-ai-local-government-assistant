import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../src/context-manager.js";
import {
  KnowledgeRegistry,
  KNOWLEDGE_TYPES,
  validateKnowledgeDefinition,
} from "../src/knowledge-registry.js";

function law(version = "2024", overrides = {}) {
  return {
    id: "law-procurement",
    type: "law",
    title: "Public Procurement Act",
    reference: "https://knowledge.example/law",
    metadata: {
      source: "Royal Gazette",
      authority: "Parliament",
      version,
      effectiveDate: version === "2025" ? "2025-01-01" : "2024-01-01",
      category: "procurement",
      tags: ["procurement", "budget"],
      language: "th",
      confidence: 0.98,
    },
    ...overrides,
  };
}

test("supports every required government knowledge type", () => {
  assert.deepEqual(KNOWLEDGE_TYPES, [
    "law", "regulation", "circular", "manual", "template", "faq", "dataset",
  ]);
});

test("registers knowledge and returns immutable snapshots", () => {
  const registry = new KnowledgeRegistry(new ContextManager());
  const registered = registry.registerKnowledge(law());
  registered.metadata.tags.push("changed");
  assert.deepEqual(registry.getKnowledge("law-procurement").metadata.tags, [
    "procurement", "budget",
  ]);
});

test("maintains append-only version history and resolves latest effective version", () => {
  const registry = new KnowledgeRegistry(new ContextManager());
  registry.registerKnowledge(law("2024"));
  registry.registerKnowledge(law("2025"));
  assert.equal(registry.getVersionHistory("law-procurement").length, 2);
  assert.equal(registry.getKnowledge("law-procurement").metadata.version, "2025");
  assert.equal(registry.getKnowledge("law-procurement", "2024").metadata.version, "2024");
});

test("detects duplicate identity and duplicate source versions", () => {
  const registry = new KnowledgeRegistry(new ContextManager());
  registry.registerKnowledge(law());
  assert.throws(() => registry.registerKnowledge(law()), /Duplicate knowledge version/);
  const duplicateSource = law("2024", { id: "another-id" });
  assert.throws(() => registry.registerKnowledge(duplicateSource), /Duplicate knowledge source/);
});

test("validates required metadata, dates, and confidence", () => {
  const invalidDate = law();
  invalidDate.metadata.effectiveDate = "today";
  assert.throws(() => validateKnowledgeDefinition(invalidDate), /YYYY-MM-DD/);
  const invalidConfidence = law();
  invalidConfidence.metadata.confidence = 2;
  assert.throws(() => validateKnowledgeDefinition(invalidConfidence), /between 0 and 1/);
});

test("searches text and ranks by confidence", () => {
  const lowerConfidence = law("2023", {
    id: "manual-procurement",
    type: "manual",
    title: "Procurement Manual",
    metadata: { ...law().metadata, source: "Manual Office", version: "2023", confidence: 0.7 },
  });
  const registry = new KnowledgeRegistry(new ContextManager(), [lowerConfidence, law()]);
  const results = registry.search("procurement");
  assert.deepEqual(results.map(({ id }) => id), ["law-procurement", "manual-procurement"]);
});

test("supports category, tag, language, type, authority and confidence filters", () => {
  const registry = new KnowledgeRegistry(new ContextManager(), [law()]);
  const results = registry.search("", {
    category: "procurement",
    tags: ["budget"],
    language: "th",
    type: "law",
    authority: "Parliament",
    minConfidence: 0.9,
  });
  assert.equal(results.length, 1);
});

test("records registrations and searches in ContextManager", () => {
  const contextManager = new ContextManager();
  const registry = new KnowledgeRegistry(contextManager);
  registry.registerKnowledge(law());
  registry.search("procurement");
  assert.deepEqual(
    contextManager.getContext().transactionHistory.map(({ type }) => type),
    ["knowledge.registered", "knowledge.searched"],
  );
});

test("preserves legacy register() and get() aliases", () => {
  const registry = new KnowledgeRegistry(new ContextManager());
  registry.register(law());
  assert.equal(registry.get("law-procurement").metadata.version, "2024");
});
