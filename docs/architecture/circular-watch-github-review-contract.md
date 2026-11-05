# PR #366 — Lean acceptance and document evidence policy

## Scope: simple search assistant, not a legal certification service

Users ask once, find official circular metadata and links, and pass a source-grounded handoff to their AI of choice. The assistant must distinguish verified evidence from unverified claims and direct staff to inspect the official original before relying on legal conclusions.

**No additional GitHub reviewer account is required for technical acceptance.** GitHub Actions and documented manual tests are the technical evidence. This does not assert independent legal approval.

## Minimum user experience

1. Search by keyword, agency, year, category, and status.
2. Display document title/number/date, source link, evidence locator, and limitations.
3. Copy a concise AI handoff asking the downstream AI to check the official source, authority, version, amendments/repeals, and evidence.
4. If official freshness or source content is unverified, say **NOT VERIFIED** and retain **DECISION_LOCK** for legal conclusions.

## Evidence policy (no unnecessary approval workflow)

- A source URL alone does not prove a document exists or is the latest version.
- For any actual legal document added to the registry, a responsible staff member must inspect the official original, record source and evidence, and check amendments/repeals before relying on the result.
- No additional GitHub account, per-document GitHub review, or automated publisher is required for this **read-only assistant** scope.
- Existing offline review-gate helpers remain conservative compatibility safeguards, not mandatory interactive steps for search users. Never interpret JSON `approved` as authoritative evidence.
- No paid API or automatic legal certification.

## Technical acceptance criteria

- Circular Watch focused tests, security checks, P0/regression and browser checks succeed on the same PR HEAD.
- Empty registry is explicitly disclosed; do not claim live official circular coverage while `knowledge/circulars/index.json` has no records.
- No fake legal documents, no production deployment and no automatic unlocking.
- If CI passes but official documents have not been checked, status is **TECHNICAL ACCEPTED — LEGAL CONTENT NOT VERIFIED**, subject to human review and release authorization.

## Current boundaries

This PR does not implement live official-site ingestion, original-PDF authentication, legal freshness verification, or independent legal sign-off. Such features are not prerequisites to accepting the **technical read-only assistant**, but they are prerequisites to asserting verified legal coverage. No Merge/Deploy is authorized.
