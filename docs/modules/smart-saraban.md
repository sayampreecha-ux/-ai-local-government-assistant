# GP Smart Saraban MVP

## Scope

`GP-SB001` provides additive, dependency-free helpers for preparing and validating a Thai government memorandum workflow.

The module is intentionally separate from the existing Router, Context Manager, Prompt Registry, Governance Layer, and Quality Gates. Integration can be added through an adapter after the host UI and current APIs are verified.

## Functions

- `createSarabanContext(input)` — normalizes task input.
- `inspectSarabanInput(context)` — reports missing fields and draft readiness.
- `classifySarabanRisk(context)` — detects content that should trigger an authority review.
- `buildSarabanPrompt(context, options)` — produces a constrained prompt with explicit anti-fabrication rules.
- `runSarabanQualityGate(context, draft)` — performs a lightweight document gate and always requires human review.

## Safety rules

1. Missing information is reported, not invented.
2. Drafting is not approval or signature.
3. Elevated content sets `decisionLock` to true for downstream decision handling.
4. The module does not claim legal correctness; authority verification must be performed by the host evidence and governance pipeline.
5. Uploaded files remain references; this module does not persist file contents.

## Integration plan

1. Import the module through a feature adapter.
2. Map the existing Context Manager fields into `createSarabanContext`.
3. Register `GP-SB001` in the existing Prompt Registry only after reviewing its registry contract.
4. Attach the Quality Gate result to the existing workflow checkpoint.
5. Add UI controls only after regression tests pass.

## Verification

Run the focused test:

```bash
node --test tests/unit/smart-saraban.test.js
```

Then run the repository's complete suite:

```bash
pnpm test
```
