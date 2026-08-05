import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

const LOG_LEVELS = Object.freeze(["debug", "info", "warn", "error"]);

function clone(value) {
  return structuredClone(value);
}

function frozenSnapshot(value) {
  const snapshot = clone(value);
  const freeze = (item) => {
    if (item && typeof item === "object" && !Object.isFrozen(item)) {
      Object.freeze(item);
      for (const nested of Object.values(item)) freeze(nested);
    }
    return item;
  };
  return freeze(snapshot);
}

function assertString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string`);
  }
}

/** Async-safe logs, metrics, traces, errors, audits, health, and diagnostics. */
export class Observability {
  #contextManager;
  #scope = new AsyncLocalStorage();
  #logs = [];
  #errors = [];
  #auditEvents = [];
  #metrics = new Map();
  #healthChecks = new Map();
  #clock;
  #now;
  #idFactory;

  constructor(contextManager, options = {}) {
    if (!contextManager?.getContext || !contextManager?.updateContext) {
      throw new TypeError("Observability requires a ContextManager-compatible instance");
    }
    this.#contextManager = contextManager;
    this.#clock = options.clock ?? (() => performance.now());
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#idFactory = options.idFactory ?? randomUUID;
  }

  runInTrace(operation, callback, identifiers = {}) {
    assertString(operation, "operation");
    if (typeof callback !== "function") throw new TypeError("callback must be a function");
    const parent = this.#scope.getStore();
    const scope = frozenSnapshot({
      traceId: identifiers.traceId ?? parent?.traceId ?? this.#idFactory(),
      transactionId: identifiers.transactionId ?? this.#idFactory(),
      operation,
      parentTransactionId: parent?.transactionId ?? null,
    });
    return this.#scope.run(scope, callback);
  }

  getTraceContext() {
    const scope = this.#scope.getStore();
    return scope ? frozenSnapshot(scope) : null;
  }

  log(level, message, attributes = {}) {
    if (!LOG_LEVELS.includes(level)) throw new RangeError(`Unknown log level: ${level}`);
    assertString(message, "message");
    const entry = frozenSnapshot({
      timestamp: this.#now(),
      level,
      message,
      ...this.#identifiers(),
      attributes: clone(attributes),
    });
    this.#logs.push(entry);
    return entry;
  }

  increment(name, value = 1, labels = {}) {
    assertString(name, "metric name");
    if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("metric value must be finite");
    const key = this.#metricKey(name, labels);
    const metric = this.#metrics.get(key) ?? { name, type: "counter", value: 0, labels: clone(labels) };
    metric.value += value;
    this.#metrics.set(key, metric);
    return metric.value;
  }

  gauge(name, value, labels = {}) {
    assertString(name, "metric name");
    if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("metric value must be finite");
    this.#metrics.set(this.#metricKey(name, labels), { name, type: "gauge", value, labels: clone(labels) });
    return value;
  }

  startTimer(name, attributes = {}) {
    assertString(name, "timer name");
    const startedAt = this.#clock();
    const identifiers = this.#identifiers();
    let stopped = false;
    return (status = "ok") => {
      if (stopped) throw new Error(`Timer already stopped: ${name}`);
      stopped = true;
      const durationMs = Math.max(0, this.#clock() - startedAt);
      const key = this.#metricKey(name, attributes);
      const metric = this.#metrics.get(key) ?? {
        name,
        type: "histogram",
        count: 0,
        total: 0,
        min: Number.POSITIVE_INFINITY,
        max: 0,
        labels: clone(attributes),
      };
      metric.count += 1;
      metric.total += durationMs;
      metric.min = Math.min(metric.min, durationMs);
      metric.max = Math.max(metric.max, durationMs);
      this.#metrics.set(key, metric);
      this.log("debug", "performance.timing", { name, durationMs, status, ...identifiers });
      return durationMs;
    };
  }

  captureError(error, attributes = {}) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    const entry = frozenSnapshot({
      id: this.#idFactory(),
      timestamp: this.#now(),
      name: normalized.name,
      message: normalized.message,
      stack: normalized.stack ?? null,
      ...this.#identifiers(),
      attributes: clone(attributes),
    });
    this.#errors.push(entry);
    this.increment("errors.total", 1, { name: normalized.name });
    this.log("error", normalized.message, { errorId: entry.id, ...attributes });
    return entry;
  }

  emitAudit(type, details = {}) {
    assertString(type, "audit type");
    const event = frozenSnapshot({
      type,
      ...clone(details),
      ...this.#identifiers(),
      timestamp: this.#now(),
    });
    this.#auditEvents.push(event);
    this.#contextManager.updateContext((context) => ({
      transactionHistory: [...context.transactionHistory, event],
    }));
    return event;
  }

  registerHealthCheck(name, check) {
    assertString(name, "health check name");
    if (typeof check !== "function") throw new TypeError("health check must be a function");
    if (this.#healthChecks.has(name)) throw new Error(`Duplicate health check: ${name}`);
    this.#healthChecks.set(name, check);
    return () => this.#healthChecks.delete(name);
  }

  async checkHealth() {
    const checks = {};
    for (const [name, check] of this.#healthChecks) {
      const startedAt = this.#clock();
      try {
        const result = await check();
        checks[name] = {
          status: result?.status ?? (result === false ? "unhealthy" : "healthy"),
          details: result?.details ?? null,
          durationMs: Math.max(0, this.#clock() - startedAt),
        };
      } catch (error) {
        checks[name] = {
          status: "unhealthy",
          error: error instanceof Error ? error.message : String(error),
          durationMs: Math.max(0, this.#clock() - startedAt),
        };
      }
    }
    const status = Object.values(checks).some((check) => check.status !== "healthy")
      ? "unhealthy"
      : "healthy";
    return frozenSnapshot({ status, timestamp: this.#now(), checks });
  }

  async diagnostics() {
    const context = this.#contextManager.getContext();
    return frozenSnapshot({
      timestamp: this.#now(),
      health: await this.checkHealth(),
      trace: this.getTraceContext(),
      counts: {
        logs: this.#logs.length,
        errors: this.#errors.length,
        auditEvents: this.#auditEvents.length,
        metrics: this.#metrics.size,
        transactions: context.transactionHistory.length,
      },
      activeModule: context.activeModule,
      metrics: this.getMetrics(),
      recentErrors: this.getErrors().slice(-10),
    });
  }

  getLogs() {
    return frozenSnapshot(this.#logs);
  }

  getErrors() {
    return frozenSnapshot(this.#errors);
  }

  getAuditEvents() {
    return frozenSnapshot(this.#auditEvents);
  }

  getMetrics() {
    return frozenSnapshot([...this.#metrics.values()].map((metric) => ({
      ...metric,
      ...(metric.type === "histogram" ? { average: metric.count ? metric.total / metric.count : 0 } : {}),
    })));
  }

  #identifiers() {
    const scope = this.#scope.getStore();
    return {
      traceId: scope?.traceId ?? this.#idFactory(),
      transactionId: scope?.transactionId ?? this.#idFactory(),
    };
  }

  #metricKey(name, labels) {
    return `${name}:${JSON.stringify(Object.entries(labels).sort(([a], [b]) => a.localeCompare(b)))}`;
  }
}

export { LOG_LEVELS };
