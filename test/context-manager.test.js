import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../src/context-manager.js";

test("starts with the complete shared context schema", () => {
  const context = new ContextManager().getContext();
  assert.deepEqual(context, {
    activeModule: null,
    workflowState: {},
    userSelections: {},
    uploadedDocumentReferences: [],
    legalReferences: [],
    procurementAndBudgetContext: {},
    transactionHistory: [],
  });
});

test("updates context without exposing mutable internal state", () => {
  const manager = new ContextManager();
  const updated = manager.updateContext({ userSelections: { method: "e-bidding" } });
  updated.userSelections.method = "mutated";
  assert.equal(manager.getContext().userSelections.method, "e-bidding");
});

test("preserves shared state while switching modules and records the transition", () => {
  const manager = new ContextManager({ legalReferences: [{ id: "law-1" }] });
  manager.switchModule("GP001", { step: "draft" });
  const context = manager.switchModule("GP012");
  assert.equal(context.activeModule, "GP012");
  assert.deepEqual(context.workflowState, { step: "draft" });
  assert.deepEqual(context.legalReferences, [{ id: "law-1" }]);
  assert.deepEqual(
    context.transactionHistory.map(({ from, to }) => ({ from, to })),
    [
      { from: null, to: "GP001" },
      { from: "GP001", to: "GP012" },
    ],
  );
});

test("clearContext resets all shared state", () => {
  const manager = new ContextManager({ activeModule: "GP003", history: [{ id: 1 }] });
  const cleared = manager.clearContext();
  assert.equal(cleared.activeModule, null);
  assert.deepEqual(cleared.transactionHistory, []);
});

test("accepts legacy fields and exposes non-enumerable legacy aliases", () => {
  const manager = new ContextManager({
    currentModule: "GP002",
    sessionData: { region: "north" },
    documents: [{ id: "doc-1" }],
  });
  const context = manager.getContext();
  assert.equal(context.currentModule, "GP002");
  assert.deepEqual(context.sessionData, { region: "north" });
  assert.deepEqual(context.documents, [{ id: "doc-1" }]);
  assert.equal(Object.keys(context).includes("currentModule"), false);
});

test("supports functional updates and change subscriptions", () => {
  const manager = new ContextManager();
  const events = [];
  const unsubscribe = manager.subscribe((event) => events.push(event.type));
  manager.updateContext((context) => ({
    transactionHistory: [...context.transactionHistory, { type: "selection" }],
  }));
  unsubscribe();
  manager.clearContext();
  assert.deepEqual(events, ["context.updated"]);
});

test("rejects unknown modules and invalid collection fields", () => {
  const manager = new ContextManager();
  assert.throws(() => manager.switchModule("GP013"), RangeError);
  assert.throws(() => manager.updateContext({ legalReferences: {} }), TypeError);
});
