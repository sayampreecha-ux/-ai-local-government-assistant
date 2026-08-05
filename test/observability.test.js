import test from "node:test";
import assert from "node:assert/strict";
import { ContextManager } from "../src/context-manager.js";
import { Observability } from "../src/observability.js";

function createObservability() {
  let tick = 0;
  let id = 0;
  const contextManager = new ContextManager();
  const observability = new Observability(contextManager, {
    clock: () => (tick += 5),
    now: () => "2026-08-05T00:00:00.000Z",
    idFactory: () => `id-${++id}`,
  });
  return { contextManager, observability };
}

test("emits structured immutable logs", () => {
  const { observability } = createObservability();
  const entry = observability.log("info", "request received", { module: "GP001" });
  assert.equal(entry.level, "info");
  assert.equal(entry.attributes.module, "GP001");
  assert.equal(Object.isFrozen(entry), true);
  assert.throws(() => observability.log("fatal", "bad"), RangeError);
});

test("propagates trace and transaction IDs across async boundaries", async () => {
  const { observability } = createObservability();
  await observability.runInTrace("route", async () => {
    await Promise.resolve();
    const first = observability.log("info", "one");
    const second = observability.log("info", "two");
    assert.equal(first.traceId, second.traceId);
    assert.equal(first.transactionId, second.transactionId);
    assert.equal(observability.getTraceContext().operation, "route");
  }, { traceId: "trace-fixed", transactionId: "tx-fixed" });
  assert.equal(observability.getLogs()[0].traceId, "trace-fixed");
});

test("collects counters and gauges by label set", () => {
  const { observability } = createObservability();
  observability.increment("requests.total", 2, { module: "GP001" });
  observability.increment("requests.total", 1, { module: "GP001" });
  observability.gauge("queue.depth", 4);
  const metrics = observability.getMetrics();
  assert.equal(metrics.find(({ name }) => name === "requests.total").value, 3);
  assert.equal(metrics.find(({ name }) => name === "queue.depth").value, 4);
});

test("records performance timing histograms", () => {
  const { observability } = createObservability();
  const stop = observability.startTimer("router.duration", { module: "GP001" });
  assert.equal(stop(), 5);
  const metric = observability.getMetrics()[0];
  assert.equal(metric.type, "histogram");
  assert.equal(metric.average, 5);
  assert.throws(() => stop(), /already stopped/);
});

test("tracks normalized errors with metrics and error logs", () => {
  const { observability } = createObservability();
  const error = observability.captureError(new TypeError("Invalid input"), { module: "GP002" });
  assert.equal(error.name, "TypeError");
  assert.equal(observability.getErrors().length, 1);
  assert.equal(observability.getLogs()[0].level, "error");
  assert.equal(observability.getMetrics()[0].value, 1);
});

test("emits audit events into ContextManager", () => {
  const { contextManager, observability } = createObservability();
  const event = observability.emitAudit("access.checked", { status: "allowed" });
  assert.equal(event.status, "allowed");
  assert.equal(contextManager.getContext().transactionHistory[0].type, "access.checked");
  assert.equal(observability.getAuditEvents().length, 1);
});

test("runs healthy and unhealthy health checks", async () => {
  const { observability } = createObservability();
  observability.registerHealthCheck("context", () => ({ status: "healthy" }));
  observability.registerHealthCheck("registry", () => { throw new Error("offline"); });
  const health = await observability.checkHealth();
  assert.equal(health.status, "unhealthy");
  assert.equal(health.checks.context.status, "healthy");
  assert.equal(health.checks.registry.error, "offline");
});

test("rejects duplicate health checks", () => {
  const { observability } = createObservability();
  observability.registerHealthCheck("context", () => true);
  assert.throws(() => observability.registerHealthCheck("context", () => true), /Duplicate/);
});

test("returns an immutable diagnostic snapshot", async () => {
  const { contextManager, observability } = createObservability();
  contextManager.switchModule("GP006");
  observability.log("info", "ready");
  observability.captureError("sample");
  observability.registerHealthCheck("context", () => true);
  const diagnostics = await observability.diagnostics();
  assert.equal(diagnostics.activeModule, "GP006");
  assert.equal(diagnostics.counts.logs, 2);
  assert.equal(diagnostics.counts.errors, 1);
  assert.equal(diagnostics.health.status, "healthy");
  assert.equal(Object.isFrozen(diagnostics.counts), true);
});

test("keeps nested trace IDs while assigning child transaction IDs", () => {
  const { observability } = createObservability();
  observability.runInTrace("parent", () => {
    const parent = observability.getTraceContext();
    observability.runInTrace("child", () => {
      const child = observability.getTraceContext();
      assert.equal(child.traceId, parent.traceId);
      assert.notEqual(child.transactionId, parent.transactionId);
      assert.equal(child.parentTransactionId, parent.transactionId);
    });
  });
});
