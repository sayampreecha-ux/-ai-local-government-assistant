# Circular Watch: offline import and responsible human review

This extends the registry merged in PR #366. No new service, account, paid API, scheduled scraping or automatic legal conclusion is introduced. The public manifest remains empty. The existing GitHub review contract remains in effect; no additional reviewer account is required for technical acceptance.

## Staff workflow

1. Find the document on the DLA official listing; MOI and Royal Gazette are supplementary sources. Open the original and attachments when accessible. A search-engine index is a discovery lead, never proof of current content.
2. On `circular-watch.html`, download the empty JSON structure. Complete only fields evidenced by the original. Use Gregorian ISO dates (YYYY-MM-DD); leave an unsupported effective date blank. Search accepts Buddhist or Gregorian years.
3. Select JSON or paste it, and optionally select one original PDF for one record. The browser calculates SHA-256 locally; no upload occurs. Hash proves byte identity only, not authenticity. Document number, title, issuer, dates, official URL, evidence text/locator, authority/version evidence, amendment/repeal relations and verification time survive normalization/export.
4. Review the in-memory queue and open candidate details. Download the queue JSON to retain it; closing/reloading the page loses unsaved queue data. Reimport queue JSON to continue. Forged approved/VERIFIED/PUBLISHED imports are rejected. An unknown or partial baseline is explicitly `BASELINE_NOT_VERIFIED`, never labelled NEW.
5. A responsible human inspects the original, issuer/authority, dates and amendments/repeals/replacements. `DISCOVERED` means incomplete evidence; `STAGED` means ready to send for human review. Imported JSON cannot confer VERIFIED or PUBLISHED. Both remain DECISION_LOCK in this tool. Human approval and release authorization are separate decisions.
6. Only after authorized human review may a maintainer propose public registry records in the normal reviewed change process. Public UI requires PUBLISHED + approved + source/hash/evidence/authority/version completeness; these metadata flags alone do not authenticate a reviewer or prove legal currency. No UI/CLI publisher or trusted reviewer-authentication backend is implemented. Never call an offline record the latest law.

## Offline CLI

```sh
node scripts/circular-watch-import.mjs --input input.json --output review-queue.json --registry knowledge/circulars/index.json
node scripts/circular-watch-import.mjs --input one-document.json --original original.pdf --output hashed-review-queue.json
```

Input is limited to 5 MB/5,000 records in CLI, 1 MB/100 records in browser; original PDFs to 20 MB. Output creation is exclusive (`wx`) to preserve prior evidence. CLI rejects `--publish`, forged approval, duplicate IDs or agency/number, invalid dates/URLs/hashes, hash mismatches, and partial shard baselines. With sharded registries, supply a complete flattened registry for comparison. Changed identity-matching documents remain CHANGED_REVIEW_REQUIRED. No network is used by import/gates.

## Verified boundaries for this closeout

- DLA listing/detail: Cloud Browser connection timeout (listing retried once). MOI: remote connection failure. Royal Gazette: persistent security/bot-verification screen (one reload; no bypass).
- API/RSS/feed support: NOT VERIFIED. These access failures do not prove no feed exists, or that the sites are down for users.
- One real DLA metadata lead retained under `docs/evidence/circular-watch-20261105/`, outside static build directories. It is search-index-only DISCOVERED, with no original PDF, document hash, lastVerifiedAt, approval or publication. 06/10/2568 from indexed detail is normalized to 2025-10-06; effective date is unknown. No claim of legal effect is made.
- Public production observed read-only: 0 registry records, old preview-only UI. Branch improvements have not been deployed.
- Automated browser tests use explicitly synthetic fixtures to exercise hashing, XSS safety, queue export, forged approvals, public visibility, outages and mobile layout. They do not certify any real government PDF.
