# GovPrompt Legal & Circular Watch — PR #366 acceptance notes

## Scope and architecture

The existing GovPrompt Knowledge Engine, Document Loader, Source Registry and AI handoff remain unchanged. A small **separate static registry** is linked from the existing **คลังความรู้** panel. This avoids routing regressions across the 13 work domains.

- Public page: `circular-watch.html`
- Browser registry and gates: `assets/js/core/circular-watch-registry.js`
- Browser UI: `assets/js/ui/circular-watch-ui.js`
- Static manifest: `knowledge/circulars/index.json`
- Offline staging CLI: `scripts/circular-watch-import.mjs`
- Focused tests: `tests/unit/circular-watch-*.test.js`, `tests/e2e/circular-watch-browser.mjs`
- Benchmark: `scripts/benchmark-circular-watch.mjs`
- CI: `.github/workflows/circular-watch-acceptance.yml`

## Security and legal evidence policy

**No live official source retrieval is implemented.** HTTPS, a `.go.th` domain, a stored evidence string or a human-review flag does not prove the content is current. The registry always sets `verifiedLatest:false`, `checkedLive:false`, and `conclusionEligible:false`. All legal decisions require fresh official-source verification and human review.

The registry is initially **empty**. There are no fictional official circulars in the published manifest. Synthetic records exist only in tests.

The public UI **never uploads or persists a JSON import**. A file selection is a local schema preview. There is no public approval button or unauthenticated write API. Actual changes must pass repository access controls and a human-reviewed GitHub PR.

The offline CLI stages a local review queue and never publishes. Example:

```sh
node scripts/circular-watch-import.mjs --input path/to/circulars.json --output artifacts/circular-watch/review-queue.json
```

A separate authorized and reviewed process is required to add verified entries to the static manifest. No background scraper or scheduled job is enabled.

## Static shard contract

`knowledge/circulars/index.json` contains `records: []` and `shards: []`. Future shard entries may use `{ "path": "2026/finance.json", "year": "2026" }`, where each shard contains `records: []`. The UI loads at most eight matching shards and **explicitly warns** when search results are incomplete. This is a safety bound, not proof of full 50k-record discovery or mobile scalability.

## AI Handoff

The selected record generates a prompt that the user copies into ChatGPT or Gemini. No automatic transfer of confidential information, no paid AI API, and no claim that GovPrompt has performed live web searches.

## Acceptance gates

Run `node --test tests/unit/circular-watch-registry.test.js tests/unit/circular-watch-import.test.js`.
Run `node scripts/benchmark-circular-watch.mjs` for synthetic 50k P50/P95.
Run `node tests/e2e/circular-watch-browser.mjs` after Playwright Chromium installation.
Run `pnpm build` and the existing `pnpm test`/P0 workflow.

Do not equate successful unit/browser checks with verified legal content or production acceptance. **No Merge / No Deploy** until full human acceptance.

## Remaining work / not verified

- Real official source adapters, content/PDF verification, update polling and completeness are not implemented.
- An authorized, evidence-backed publishing/review workflow has not been built; the current CLI only stages candidate records.
- 50k performance on real mobile hardware and complete shard retrieval are not verified.
- Full end-to-end AI handoff inside the main composer remains separate: this feature copies a conservative prompt.
- No production deployment or production browser acceptance has been performed.
