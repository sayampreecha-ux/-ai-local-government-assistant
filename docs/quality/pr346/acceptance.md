# PR 346 final acceptance

Date: 2026-10-25. Baseline main: `08d612d5c4566247892351399deef2a860fb0163`. Final SHA and immutable CI links are recorded in the PR after push. This report supersedes the earlier Pilot scope.

## Delivered behavior

GP prepares the canonical prompt for the user to paste and send to their chosen AI. The destination delivers full content and an editable file when tools permit, otherwise full Word-ready text. No new Workers drafting path, paid call, model change, cloud configuration change or automatic downstream submission.

Document contract now distinguishes facts, proposals and pending verification, rejects unsupported completed review/suitability/approval claims and budget-impact inference, and places officer checklist outside the memo. Privacy signer-label instructions remain intact while supplied synthetic signer values remain masked. Legacy Studio only changes its hidden-element CSS: stale download buttons now hide after failures. Its generator and Worker implementation remain unchanged.

## Executed checks

- npm test: main Node suite 1297/1297, auxiliary 9/9 and 10/10 plus existing chained verifiers PASS. No skipped/cancelled tests.
- Targeted privacy and handoff: 57/57 PASS. New cases increased the baseline assertions. Only the Studio asset version assertion changes from 1.0.0 to 1.0.1.
- Build PASS. Existing 30-document handoff fixture browser run: 60/60 PASS.
- All-category browser matrix: 30/30 at 390px and 30/30 at 1366px, actual clipboard/ChatGPT/Gemini destinations intercepted, zero page errors, synthetic ID blocked before routing.
- Legacy Studio: 2 viewports PASS privacy checkpoint before request, predetermined Mock compose, draft preview, actual DOCX download, sensitive-input rejection, provider-error stale-download hiding. Four intercepted mock calls, zero live calls.
- DOCX: unchanged makeDocx, 5-part ZIP CRC/XML/relationships, Thai memo fields/placeholders, no editing protection, edit/save/reopen PASS. Rendered one page and visually inspected. Microsoft Word NOT VERIFIED.
- Prompt browser measurement: only GP001 changes, +1975 UTF8 bytes against pinned main. Exact before/after hash exception updated. Remaining 17 measured prompts unchanged. Byte proxy is not provider tokenizer measurement.

## Thirty cases

| Case | Module | Kind | Intent mobile/desktop | Handoff mobile/desktop | Semantic output |
|---|---|---|---|---|---|
| 1 | GP001 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 2 | GP001 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 3 | GP002 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 4 | GP002 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 5 | GP003 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 6 | GP003 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 7 | GP004 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 8 | GP004 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 9 | GP005 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 10 | GP005 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 11 | GP006 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 12 | GP006 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 13 | GP007 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 14 | GP007 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 15 | GP008 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 16 | GP008 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 17 | GP009 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 18 | GP009 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 19 | GP010 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 20 | GP010 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 21 | GP011 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 22 | GP011 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 23 | GP012 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 24 | GP012 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 25 | GP013 | category | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 26 | GP013 | missing-facts | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 27 | GP001 | privacy-label | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 28 | GP001 | injection | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 29 | intake | ambiguous-intake | PASS/PASS | PASS/PASS | NOT VERIFIED |
| 30 | GP001 | missing-memo | PASS/PASS | PASS/PASS | NOT VERIFIED |

Each full request and observed category is in final/matrix.json. Semantic output is NOT VERIFIED for all 30 because no external AI was invoked. Regex, prompt-content checks and predetermined Mock documents are not counted as semantic acceptance. Earlier current-chat rehearsal and privately supplied Word example do not certify all 13 categories or free accounts.

## Security, privacy and release limits

Router, Prompt Engine, official precedent/evidence/decision gates, Worker and Cloudflare configuration are untouched. No PR-added Pilot route remains. Existing legacy Studio is not a newly accepted Live AI service. Live binding, server quota and actual model behavior are NOT VERIFIED and are not enabled by this change. Existing legacy service behavior and its separate controls are not claimed as fully audited by this scoped fix.

All browser tests block external processing; mocked requests never reach Workers AI. No real personal information or keys are in fixtures. No new AI provider charge was incurred by this test run. Human review remains required for official use.

Release scope: static prompt handoff and scoped privacy/UI corrections. A successful release does not certify destination-model legal correctness or file-generation availability. User explicitly authorized merge and existing GitHub Pages publication after passing checks. Do not publish if final required CI or repository rules fail.
