# GP Legal & Circular Watch — staged implementation

Status: **partial implementation, NOT PRODUCTION READY**. No official documents have been imported. No live website ingestion, PDF extraction, automatic scheduler, browser UI, or AI handoff has been wired by this patch.

## Existing foundations

Use existing knowledge metadata, document loader, source registry, freshness and citation modules. The new `assets/js/core/circular-watch-registry.js` is a small offline adapter for circular metadata, search, pagination and conservative decision locking. It intentionally does not declare an official website or a document verified merely from its URL.

## Record contract

Required: `id`, `documentTitle`, `documentNumber`, `issuingAgency`, `sourceUrl` (HTTPS).
Optional: `documentDate`, `effectiveDate` (ISO date), `category`, `keywords`, `status`, `reviewStatus`, `lastVerifiedAt`, `evidence`, `supersedesDocumentId`, `supersededByDocumentId`, `amendedBy`, `repealedBy`, `contentExcerpt`, `excerptLocator`.

Records default to `unknown` and `pending`. `assess()` reports `DECISION_LOCK` when review, evidence, date, status or applicability is missing. Even `REVIEWED_RECORD` returns `verifiedLatest:false` and `checkedLive:false`; it is not a legal determination.

## Remaining acceptance work

1. Inspect and reuse current UI knowledge entry point and handoff architecture; add feature-flagged integration.
2. Implement review-only manual import with immutable provenance and document relationship validation.
3. Verify source content (including PDFs) with explicit source/date/authority gates. Do not confuse HTTPS or .go.th with content verification.
4. Implement bounded static index and lazy loading, then test 50,000 synthetic records and mobile P50/P95.
5. Assess official site access policies before implementing incremental source updates. No paid API or scheduled scraping by default.
6. Run complete existing regression suite, CI, mobile/desktop E2E and production acceptance after separate release approval.

Run focused tests: `node --test tests/unit/circular-watch-registry.test.js`.

No sample document is official and no live source freshness is implied.
