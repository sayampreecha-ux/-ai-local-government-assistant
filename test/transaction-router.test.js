import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../src/context-manager.js";
import { TransactionRouter } from "../src/transaction-router.js";

const definitions = {
  GP001: { intents: ["draft policy", "policy"] },
  GP002: { intents: ["legal review", "law"] },
  GP003: { intents: ["procurement plan", "procurement"] },
};

function createRouter(initialContext, options = {}) {
  const contextManager = new ContextManager(initialContext);
  const router = new TransactionRouter(contextManager, {
    moduleDefinitions: definitions,
    ...options,
  });
  return { contextManager, router };
}

test("detects intent and ranks modules with confidence scores", () => {
  const { router } = createRouter();
  const scores = router.detectIntent("Please perform a legal review of this law");
  assert.equal(scores[0].moduleId, "GP002");
  assert.equal(scores[0].confidence, 1);
  assert.ok(scores.every(({ confidence }) => confidence >= 0 && confidence <= 1));
});

test("routes to the highest-confidence module", () => {
  const { router } = createRouter();
  const result = router.routeRequest("Create a procurement plan");
  assert.equal(result.primaryModule, "GP003");
  assert.equal(result.usedFallback, false);
});

test("supports multi-module routing", () => {
  const { router } = createRouter();
  const result = router.routeRequest("Draft policy and perform a legal review", {
    multiModuleThreshold: 0.4,
  });
  assert.deepEqual(result.modules, ["GP001", "GP002"]);
});

test("falls back to the active module and then configured fallback", () => {
  const active = createRouter({ activeModule: "GP004" });
  assert.equal(active.router.routeRequest("unrecognized request").primaryModule, "GP004");

  const configured = createRouter(undefined, { fallbackModule: "GP012" });
  const result = configured.router.routeRequest("unrecognized request");
  assert.equal(result.primaryModule, "GP012");
  assert.equal(result.usedFallback, true);
});

test("integrates routing decisions and module switches into shared context", () => {
  const { contextManager, router } = createRouter();
  router.routeRequest("legal review");
  const context = contextManager.getContext();
  assert.equal(context.activeModule, "GP002");
  assert.deepEqual(
    context.transactionHistory.map(({ type }) => type),
    ["request.routed", "module.switch"],
  );
});

test("preserves legacy route() result shape", () => {
  const { router } = createRouter();
  const result = router.route("draft policy");
  assert.equal(result.module, "GP001");
  assert.equal(result.primaryModule, "GP001");
});

test("rejects empty requests and invalid fallback modules", () => {
  const { router } = createRouter();
  assert.throws(() => router.detectIntent("  "), TypeError);
  assert.throws(
    () => createRouter(undefined, { fallbackModule: "GP013" }),
    RangeError,
  );
});
