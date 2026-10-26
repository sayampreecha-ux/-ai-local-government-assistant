# Prompt handoff UX closeout — branch acceptance, not Production

Main baseline: `9008733dcdc9f34bf4d98c8276b26c3209acf9ba`. Immutable final HEAD and CI are recorded in the Draft PR. No merge or deployment is authorized in this round.

## Change
Home hides the bounded zero-AI memorandum button with both hidden and display:none; its source, editor, generator and every legacy test assertion remain. The legacy browser test first asserts the entry is hidden, then explicitly reveals that component only inside the test to retain its editor/review/DOCX coverage. Budget and other document exports are untouched.

The existing correspondence completion adapter gains source completeness, Legal Version Gate, Human Review, authority boundary and final checks. One generic completion suffix is added only to bounded creation intents for reports, TOR/BOQ, tables, Excel and slides. General questions and explicit non-creation requests get no suffix; suffix assembly is idempotent. Existing Router, prompt engine, workflow/evidence/decision gates, privacy policies, document generators, Worker and configuration remain unchanged.

Handoff headings identify the content as a prompt rather than a completed document. Preview, clipboard and both destination actions use the same existing guarded canonical path. Destination opening is intercepted in tests and URLs verified; no prompt is submitted to an AI service.

## Executed checks
- Full npm test: 1424/1424 plus auxiliary 9/9 and 10/10; all verifier chain steps PASS, fail/skipped=0. Build PASS.
- Completion scope: all 30 fixtures checked at function level, plus idempotence, forged marker, hidden-entry and heading assertions. This is prompt-contract QA, not AI semantic QA.
- Branch dist Playwright: 30 scenarios at 390px and 30 at 1366px. 28 per viewport complete Preview=Copy=ChatGPT=Gemini with source-text preservation, hidden memo action, no review panel, no page errors and no horizontal overflow.
- Two per viewport are expected existing Privacy Guard blocks: #11 ผลตรวจสอบ is classified as health context (known conservative false positive); #17 the injection payload ends in secret and is classified as confidential context. Their actual routing/completion/handoff is NOT VERIFIED, not counted as successful handoffs. Guard remains unchanged. Synthetic ID is also blocked in an additional negative path per viewport.
- Retained memo component browser suite: 32/32 per viewport, 64 actual downloads, all old editor/review/error assertions retained. This is isolated legacy-component coverage, not a publicly available Home entry.
- Prompt efficiency: real final-preview/clipboard measurement of 18 pinned baseline scenarios. GP001 +318 characters / +852 UTF8 bytes; exact hashes in prompt-comparison.json. Other 17 byte-identical. Existing zero-growth/exact-hash enforcement remains; one measured, exact GP001 transition is added for owner-requested completion. Estimated tokens are not provider-tokenizer measurements.
- Measured completion suffix sizes: 1090 or 1053 characters for correspondence; 892 for generic deliverables. Tests cap at the measured maximum 1090, not a widened global prompt budget.
- AI API calls: 0; external network attempts in the successful matrix: [].
- Downstream ChatGPT/Gemini semantic deliverable, real free-account file creation and number of repeated instructions: NOT VERIFIED. No destination generation was invoked.

## Limitations and rollback
The existing Privacy Guard can block the ordinary audit term ผลตรวจสอบ. That input remains in the matrix and is not misreported as a routed/copied success. Universal Thai intent understanding and downstream AI output quality are not certified. File production depends on the destination's tools; the prompt requires full content fallback and prohibits fake links. Human review is mandatory.

Rollback: revert this PR's single commit, rebuild using the existing Pages pipeline only after owner approval. No data migration, backend or Cloudflare rollback is required. Keep PR Draft and wait for explicit merge/deploy approval.
