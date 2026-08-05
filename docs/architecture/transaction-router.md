# Transaction Router

## Purpose

`TransactionRouter` is the intent-routing boundary in front of GP001-GP012. It
turns a user request into a deterministic ranked route, records that decision in
the shared transaction history, and activates the primary module through
`ContextManager`.

## Routing pipeline

1. Normalize Unicode and tokenize the request.
2. Score every module against its configured intent phrases.
3. Select the highest-confidence candidate when it clears the confidence threshold.
4. Include every candidate above the multi-module threshold.
5. When confidence is insufficient, prefer the active module; otherwise use the
   configured fallback module.
6. Append `request.routed` and `module.switch` events to shared context.

The router is deliberately deterministic and dependency-free. GP module owners can
provide domain-specific `moduleDefinitions` without changing routing mechanics. The
shipped defaults recognize explicit GP001-GP012 references and safely fall back for
unmapped natural-language requests rather than guessing a government workflow.

## API

```js
const router = new TransactionRouter(contextManager, {
  fallbackModule: "GP001",
  confidenceThreshold: 0.45,
  multiModuleThreshold: 0.3,
  moduleDefinitions: {
    GP001: { intents: ["draft policy", "policy"] },
    GP002: { intents: ["legal review", "law"] },
  },
});

const decision = router.routeRequest("Draft policy and check the law");
```

The result includes `primaryModule`, ordered `modules`, `confidence`,
`usedFallback`, and per-module `scores`.

## Backward compatibility

The constructor accepts the legacy `routes` option as an alias for
`moduleDefinitions`, and each module definition accepts `keywords` as an alias for
`intents`. The legacy `route()` method remains available and adds `module` as an
alias of `primaryModule`. Existing ContextManager compatibility aliases continue to
work because the router uses only the manager's public API.
