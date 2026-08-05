# Observability Layer

## Purpose

`Observability` centralizes operational signals for every GovPrompt module and Sprint
1 service. It provides structured logs, labeled metrics, performance histograms,
error records, async-safe traces, audits, health checks, and diagnostics without
coupling those concerns to the registries or governance engine.

## Correlation model

`runInTrace()` establishes an async-local scope. A trace ID follows the complete
operation across promises, while each nested operation receives a new transaction ID
and records its parent transaction. Logs, errors, and audits automatically inherit
both IDs. Events emitted outside a scope receive generated standalone identifiers.

## Signals

- Logs contain timestamp, level, message, trace ID, transaction ID, and attributes.
- Metrics support counters, gauges, and timer histograms with stable label keys.
- Timers record count, total, minimum, maximum, and average duration.
- Errors preserve normalized name, message, stack, attributes, and correlation IDs.
- Audit events are retained by Observability and appended to ContextManager history.

All snapshot APIs deep-clone and freeze returned data.

## Health and diagnostics

Named health checks may be synchronous or asynchronous. Exceptions become unhealthy
results rather than escaping the health endpoint. `diagnostics()` combines current
health, trace scope, signal counts, active module, metrics, and the ten most recent
errors into one immutable support snapshot.

```js
await observability.runInTrace("handle-request", async () => {
  const stop = observability.startTimer("request.duration", { module: "GP001" });
  observability.log("info", "request.started");
  try {
    // Route and execute request.
  } catch (error) {
    observability.captureError(error);
  } finally {
    stop();
  }
});

const diagnostics = await observability.diagnostics();
```
