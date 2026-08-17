# GovPrompt Benchmark v1 — Execution Plan

Status: execution infrastructure only; no comparative result has been produced.

## Validity controls

1. Freeze the 100 synthetic, non-PII cases before any scoring.
2. Execute every frozen question once through GovPrompt and once through the unstructured baseline.
3. Pin the same underlying model/version and equivalent tool access for both arms.
4. Preserve the identical raw user question in both arms.
5. Remove product identity and randomize answer order before scoring.
6. Score only against the pre-registered rubric in `GOVPROMPT_BENCHMARK_V1.md`.
7. Retain raw responses, blind pairs, and score sheets as reproducibility artifacts.
8. Never infer or manufacture baseline performance from CI/schema success.

## Execution state machine

`DATASET_FROZEN → A_RUN_COMPLETE → B_RUN_COMPLETE → BLINDED → SCORED → AUDITED → REPORTABLE`

Transitions are forward-only. `REPORTABLE` requires 100/100 paired cases, both responses for every case, a blind score for every pair, and an audit of counts and release-threshold calculations.

## Reproducibility artifacts

- `frozen-cases-v1.jsonl` — exactly 100 complete cases and a dataset checksum
- `responses-govprompt-v1.jsonl` — exactly 100 responses with pinned execution metadata
- `responses-baseline-v1.jsonl` — exactly 100 responses with matching execution metadata
- `blind-pairs-v1.jsonl` — exactly 100 randomized, identity-free pairs
- `scores-v1.csv` — exactly 100 paired rows with dimension scores and critical-failure flags
- `BENCHMARK_REPORT_V1.md` — counts, model/tool policy, reviewer details, limitations, and threshold calculations

Artifacts must exclude secrets, real PII, and raw government data that is not approved for publication.

## Reportability gates

- Dataset is frozen and checksummed before execution.
- All 100 cases have paired A/B responses and blind scores.
- Model/version, tool policy, timestamps, and execution configuration are recorded for both arms.
- The audit reconciles artifact counts and scoring math.
- The report discloses missing reviewers, execution failures, retries, and limitations.
- Superiority language is prohibited unless every release threshold in `GOVPROMPT_BENCHMARK_V1.md` passes.

GitHub CI may validate schemas, counts, checksums, and scoring math. CI success alone is not evidence that either arm performed better; authenticated paired model execution and blind scoring are still required.
