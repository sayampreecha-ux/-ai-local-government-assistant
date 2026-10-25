# PR 346 Mock acceptance and cost control evidence

Date: 2026-10-25. Main baseline: `08d612d5c4566247892351399deef2a860fb0163`.
Starting PR HEAD: `6c31afdbbf0047d2c75c2a11600e9e6e2642f2ad`.
Decision: **PARTIAL — retain Draft. Do not merge, deploy or enable Pilot.**

## Changes

The chat action uses `/api/document-studio/pilot/compose`. Pilot selection and limits no longer depend on `x-gp-document-pilot`. Old marked requests are denied. The legacy route and its existing callers are retained; legacy AI usage is not covered by the new Pilot budget and must not be described as globally capped.

The new route defaults to closed. It requires an explicit server flag, a separately provisioned server credential and a Durable Object namespace. No secret is embedded in the frontend. The current browser deliberately has no privileged credential handoff; enabling a live, authenticated pilot requires separate design and approval.

The proposed Durable Object uses one global ID, a storage transaction before AI, a persisted daily counter and source hashes, and a persisted concurrency lock. Daily allowance must be an integer 1–10. Each accepted request permits exactly one AI call, max_tokens 1800, input 4000 characters, request 16384 bytes, instruction 1200 characters. No retries or refunds. A 15-second response timeout retains the lock until the actual AI promise settles. Failed storage/configuration closes access. There is no expiration that permits a second call while the first could still be running.

Instructions/filename supplied by the client are not promoted to the Pilot system prompt. Sensitive request metadata and sensitive provider output are rejected. Malformed JSON returns a fixed error without echoing source content. Source facts are serialized into the user message. This is a prompt boundary, not proof that a live model resists all injection.

No Cloudflare configuration, model, infrastructure, Router, Prompt Engine, Evidence Gate, Decision Lock or Official Precedent Gate was changed. No live AI was called.

## Executed verification

- `npm test`: PASS, including Node suite **1306/1306**, auxiliary suites 9/9 and 10/10, and the existing chained verification scripts. No assertions removed or tests skipped.
- `node --test test/document-pilot-cost.test.mjs`: **17/17 PASS**, including timeout, persisted reservation, concurrency, quota, duplicate, streaming size, privacy, sensitive output, configuration failure and retired-header paths.
- `npm run build`: PASS. `npm run check:syntax`: PASS.
- `GP_CHROMIUM_EXECUTABLE=/tmp/gp346-chromium node scripts/verify-document-pilot-browser.mjs`: **60/60 PASS** (30 inputs at 390px and 1366px). External traffic was blocked. The actual local Worker and budget class ran with an in-memory transactional storage test double and fixed Mock AI. The harness injects a synthetic credential on the server side; it does not validate a production identity flow.
- `browser-30-cases.json`: individual intent and mock output results. 15 memorandum requests produce drafts; 15 unrelated requests produce no memorandum action. Mock output checks preserve exact source facts, all nine headings, review warning and missing-data placeholders. This is output/transport QA with predetermined answers, **not live AI semantic reasoning acceptance**.
- `scripts/verify-document-pilot-docx.py`: **30/30 PASS** ZIP CRC, XML parsing, required OOXML parts, Thai Unicode, memorandum fields and editable python-docx save/reopen round trips.
- A downloaded sample was opened/rendered with LibreOffice using the documents skill renderer, after installing a local Sarabun font. One-page image inspected: readable Thai, required fields and placeholders, no clipping. It is a working draft, not certification of an official stationery template.

## Evidence files

- `browser-30-cases.json` — 60 individual browser results.
- `docx-results.json` — 30 individual DOCX structural/editability results.
- `mobile-390.png`, `desktop-1366.png` — actual local browser screenshots.
- `mock-memorandum.docx`, `docx-render.png` — actual downloaded sample and inspected render.
- Test output logs are attached alongside this report. CI results must be checked against the final PR SHA; the eight green workflows on starting HEAD do not certify the updated code.

## Remaining release gates

1. Real Cloudflare Durable Object binding, storage semantics, AI binding and account quota have NOT been provisioned, enabled or verified. The transaction behavior here is verified with a test double, not a deployed Durable Object.
2. Authenticated live credential handoff is not implemented in the public browser. Keep Pilot disabled.
3. Live model output quality and prompt-injection resilience on all 30 cases: **NOT VERIFIED**. Mock checks do not establish model reasoning quality.
4. Opening/editing in Microsoft Word: **NOT VERIFIED**. LibreOffice rendering and python-docx editing passed.
5. Human officer acceptance, production browser acceptance, deploy and rollback execution: **NOT VERIFIED / NOT AUTHORIZED**.
6. Legacy document endpoints retain existing limits and are not governed by this Pilot quota. A separate review is needed before making any account-wide AI spend guarantee.

No merge, deployment, purchase or paid call occurred. No real personal data was used.
