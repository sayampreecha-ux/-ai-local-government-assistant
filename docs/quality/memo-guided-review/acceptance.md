# Local memorandum guided intake and editable review acceptance

Main baseline: `6149a45fc9d92ce0f4ebe8c02e9a2828ff100ae7` (merged PR #347). Follow-up branch `fix/local-memo-guided-review-20261025`. Final immutable SHA and live CI conclusions are recorded in the Draft PR, not inferred from this pre-commit report. No merge/deployment is authorized for this follow-up.

## Root cause and correction

Guided Intake serialized unknown-field metadata into the same string as user facts. Home passed that combined string to local memorandum parsing, and the unstructured fallback copied it into the factual body. Intake also normalized line breaks and its short-request check caused a pending conversation to finalize prematurely.

The Router's existing combined prompt is retained. A memory-only, single-use, exact-submission provenance envelope carries the original input and ordered user answers separately to the Word action. Unknown keys stay out of document source; this does not delete literal words topic/recipient/purpose from user data. Privacy-modified text cannot reuse the raw envelope and fails closed for local generation. New chat clears it. No storage/network added.

The review panel pre-fills 11 Thai fields and lets officers edit them. Preview and DOCX use the same structured-field builder and validation; literal labels inside field values are not reparsed. Edits reset review consent; invalid claims/injection/PII/oversize input block output. Original user source is available separately for comparison. Unlabelled language is bounded V1, preserved for officer structuring, not universal natural-language understanding. A bare request to draft is not a fact. Missing data remain `[รอตรวจสอบ]`.

The existing DOCX generator remains unchanged. Only its local action now accepts validated structured edits as well as legacy strings. No checklist/unknown metadata is placed inside the signed memo. Preview uses textContent and wraps the long signature line on mobile.

## Executed local checks

| Evidence | Result | Scope |
|---|---|---|
| Full npm test | PASS 1390/1390; auxiliary 9/9 and 10/10 | Unit, integration, regression, security/privacy and existing verifier chain |
| Focused factual + new flow | PASS 57/57 | 30 exact-field fixtures + safety and Guided Intake regression, not LLM semantic QA |
| Build | PASS | Current source build; cache versions home 6.4.31, intake 1.2.4, Studio 1.0.3 |
| Mobile 390px | PASS 32/32 | 30 fixtures + unknown flow + two-answer/edit flow |
| Desktop 1366px | PASS 32/32 | Same matrix |
| Actual DOCX downloads | PASS 64/64 | ZIP CRC, all XML, internal relationship targets, Thai headings, supplied facts, placeholders, metadata exclusion |
| Edit/save/reopen | PASS 64/64 | Python-docx, not Microsoft Word |
| Visual render | PASS | Every page of two representative documents inspected with LibreOffice renderer |
| Microsoft Word app | NOT VERIFIED | No Word application in this environment |
| New-path AI API calls | 0 | Browser denies all external-origin and local /api or /v1 requests; successful matrix has externalRequests=[] |
| Production after fix | NOT VERIFIED | Intentionally no merge/deploy |
| AI-produced content quality | NOT VERIFIED | No destination or paid/live AI called |

Browser negative paths on each viewport: unsupported approval claim; duplicate field; non-memo button absent; oversize failure; synthetic ID blocked before results; invalid edited claim cannot enable download. The two Guided Intake flows also assert review-reset, exact literal user text preservation, no unknown-metadata leakage and no horizontal document overflow. No JavaScript page errors in the successful matrix. Failed/interrupted development runs are excluded.

The original npm tests were retained; only exact cache version assertions were updated. Added tests do not replace old assertions. Existing UI/API tests remain intact. Security patterns remain conservative and finite, not exhaustive PDPA/injection detection or legal authorization. Human review is required.

## Evidence files

- `browser-results.json`: 64 individual browser rows and negative path scope.
- `docx-check.json`: 64 ZIP/XML/relationship/factual/edit-save-reopen rows.
- `verification-summary.json`: local command summaries and full-log SHA256 values; complete logs are also produced by CI.
- `sample.docx`, `guided-edited.docx`: actual browser downloads using synthetic data. The latter intentionally contains literal topic/recipient/purpose as user-supplied facts, demonstrating preservation rather than blanket deletion.
- `mobile-review.jpg`, `desktop-review.jpg`, `docx-edited-page.jpg`, `docx-full-page.jpg`: inspected representative images. Sticky headers appear mid-full-page browser captures; no claim that this capture placement is a product layout bug.
- `capabilities-13.md`: all 13 registry modules, distinguishing prompt handoff, local shared memo and specialist functions not accepted in this scope.

## Preserved boundary

No Router/Prompt Engine/Workflow V5/Evidence/Legal Version/Official Precedent/Decision Lock implementation, Worker, backend, Cloudflare config, model or dependency changes. No paid API calls, purchases or real personal data. Source changes are limited to intake provenance, local memo validation/review, generator call boundary and cache keys, with tests and evidence.

CI must pass on the final PR HEAD before declaring the change ready. Keep the PR Draft and wait for explicit next-step approval. Microsoft Word compatibility remains an explicit verification limitation, not a claimed pass.
