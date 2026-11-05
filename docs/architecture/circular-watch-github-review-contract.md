# PR #366 — GitHub Review evidence binding (design; fail closed)

Status: **DESIGN ONLY / NOT AUTHENTICATED / NO PUBLISHING**. This file does not approve any record.

## Authority and separation of duties

- The repository owner `sayampreecha-ux` currently has GitHub `admin` permission. This is not evidence of an independent review.
- A document approval requires a GitHub `APPROVED` pull-request review by a **different authorized reviewer** with verified `write` or `maintain` or `admin` permission, subject to repository rules and applicable separation-of-duties policy.
- Never infer permission from a user-supplied JSON field. Query GitHub collaborator permission and review API at acceptance time.
- Review must be on the exact PR and commit HEAD being accepted, not dismissed or outdated. A review of a changed document hash is invalid.
- An approved code PR does not itself prove a PDF is authentic, current, or legally effective.

## Per-document binding contract (proposed)

A review manifest for each candidate document must bind:

- `documentId`, `issuingAgency`, `documentNumber`, `sourceUrl`
- `documentSha256`: SHA-256 of **downloaded official PDF bytes**, not a text field or URL hash
- `sourceCheckedAt`, `excerptLocator`, `evidence`, `effectiveDate`, `versionLinks`, `versionCheckedAt`
- `repository`, `pullNumber`, `reviewedHeadSha`, `reviewId`, `reviewerLogin`, `reviewSubmittedAt`
- `reviewedDocumentSha256` equal to `documentSha256`

The system must independently retrieve the official PDF, calculate its hash, and verify source/version/effective dates. Review identity, permission, state, head binding, and dismissal must be independently retrieved from GitHub API; never trust a staged approval field. Reject self-review, stale SHA, missing permission, mismatched hashes, invalid official source, unverified legal status, and changed documents.

## Execution / acceptance gate

1. Keep all imported documents in a local-only staging queue. No automatic publish.
2. Verify official source, PDF bytes, and latest amendment/repeal relations; record evidence.
3. Verify independent GitHub reviewer and permissions, approved review and current HEAD, document hashes.
4. Run targeted unit tests, security, P0, full regression, and browser checks on exact HEAD.
5. Human acceptance records evidence per document. Only a separately implemented trusted publisher may consider release after all gates; **the current code never unlocks**.
6. On any missing or ambiguous evidence return `DECISION_LOCK`, `publishable:false`, `authenticated:false`.

## Current gap

`scripts/circular-watch-review-gate.mjs` is an **offline preflight only**. It does not call GitHub, download PDFs, verify reviewer permissions or implement publishing. The static registry remains empty. CI success is not evidence of legal-document authenticity. No Merge/Deploy is authorized.
