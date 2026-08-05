# Shared Context Foundation

## Purpose

`ContextManager` is the single in-process state boundary for GP001-GP012. Modules use
the package entry point instead of maintaining independent conversation state, so a
module switch preserves workflow data, selections, document and legal references,
procurement/budget facts, and transaction history.

## Context model

| Field | Purpose |
| --- | --- |
| `activeModule` | Current GP001-GP012 module |
| `workflowState` | Module-agnostic workflow checkpoint |
| `userSelections` | Explicit user choices |
| `uploadedDocumentReferences` | References to uploaded documents; payloads remain outside context |
| `legalReferences` | Laws, regulations, and citations used by the workflow |
| `procurementAndBudgetContext` | Shared procurement and budget facts |
| `transactionHistory` | Auditable domain events and module transitions |

The manager returns deep snapshots, preventing callers from mutating centralized
state accidentally. `switchModule()` validates the target, preserves shared fields,
and appends a timestamped transition. Subscribers can connect persistence,
observability, or UI adapters without coupling those concerns to the core.

## API and integration

```js
import { getContext, updateContext, clearContext, switchModule } from "govprompt-shared-context";

updateContext({ userSelections: { procurementMethod: "e-bidding" } });
switchModule("GP002", { step: "legal-review" });
const context = getContext();
```

The package exports a process-wide singleton for normal use and the
`ContextManager` class for isolated runtimes and tests. Persistence adapters should
subscribe to changes and hydrate a new manager through its constructor.

## Backward compatibility

Legacy input keys are normalized to the canonical schema: `currentModule`,
`sessionData`, `documents`, `legalContext`, `procurementContext`, and `history`.
Snapshots expose matching non-enumerable read aliases, preserving direct reads while
keeping serialized output on the new schema. Existing modules can migrate one at a
time without losing state.

## Boundaries

This foundation stores references and workflow metadata, not uploaded file content.
Durable persistence, authorization, encryption, and cross-process synchronization
belong to infrastructure adapters planned around the Context Manager boundary.
