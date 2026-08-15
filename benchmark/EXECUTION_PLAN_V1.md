# GovPrompt Benchmark v1 — Execution Plan

Status: execution infrastructure

## Non-negotiable validity controls
1. Freeze 100 synthetic, non-PII Thai local-government questions before scoring.
2. Run each question twice: GovPrompt pipeline and unstructured general-chat baseline.
3. Use the same underlying model/version and equivalent tool access for both arms.
4. Preserve identical raw user question in both arms.
5. Blind product identity and randomize answer order before scoring.
6. Score against the pre-registered 100-point rubric in GOVPROMPT_BENCHMARK_V1.md.
7. Keep raw responses and score sheets as reproducibility artifacts.
8. Do not manufacture scores or infer baseline performance without actually executing both arms.

## Execution state machine
DATASET_FROZEN -> A_RUN_COMPLETE -> B_RUN_COMPLETE -> BLINDED -> SCORED -> AUDITED -> REPORTABLE

A benchmark is not REPORTABLE unless 100/100 paired cases have both responses and scores.

## Required outputs
- frozen-cases-v1.jsonl (100 complete cases)
- responses-govprompt-v1.jsonl (100)
- responses-baseline-v1.jsonl (100)
- blind-pairs-v1.jsonl (100)
- scores-v1.csv (100 paired rows, dimension scores, critical flags)
- BENCHMARK_REPORT_V1.md

## Report gates
The final report must explicitly show execution counts. Any missing response or score makes the benchmark incomplete. Superiority language is permitted only if all pre-registered release thresholds are met.

## Important limitation
GitHub CI can validate dataset/schema/scoring math but cannot by itself constitute a ChatGPT-vs-GovPrompt benchmark unless an authenticated, pinned model execution endpoint is configured for both arms. CI success must never be reported as comparative model success.
