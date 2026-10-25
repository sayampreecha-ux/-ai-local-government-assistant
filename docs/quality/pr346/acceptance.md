# PR 346 Downstream AI completion handoff

This replaces the withdrawn Workers AI Pilot approach at commit `1477bed890acfde6eca6bf415ef2b6625fc7c5b3`. Historical Mock DOCX evidence remains in that immutable commit and does not certify this new handoff scope.

## Resulting behavior

For a request to draft a memorandum or official letter, GP prepares one final prompt. Preview, copy-only, Open ChatGPT and Open Gemini use the same Privacy Guard checked text. The user pastes and sends it in their chosen AI. There is no automatic account login, message submission, file transfer or extra AI call from this document handoff.

The destination is instructed to finish the requested document first. When it has a file tool, it should attach a real editable DOCX. When it lacks a tool or its file quota is exhausted, it should provide the full, structured text ready to paste into Word and honestly say that no file was created. It must not invent a download link or disguise another format as DOCX. No purchase or API is required by the prompt. Missing facts use `[รอตรวจสอบ]`, with existing Evidence Gate, Decision Lock and human review retained. Official letters keep their requested type instead of being forced into memorandum format.

This accommodates destinations without file-generation features. It does not guarantee that any particular free account can accept the entire prompt, obey it correctly, browse, or generate a downloadable file. The destination's actual tools, context limits and account quotas still apply.

## Scope and cost

- The new chat → Document Studio → Workers AI Pilot route, budget object, client marker, source-text Studio extension and related Pilot-only tests are withdrawn.
- `src/search-worker-v2.js` and `assets/js/core/document-studio-v1.js` are byte-identical to main. Their legacy behavior is retained.
- Router, Prompt Engine, governance gates, existing Workflow Runtime V5 and backend configuration are unchanged.
- Existing baseline tests are retained. Tests belonging solely to the withdrawn, PR-added Pilot feature are replaced with tests for the newly agreed handoff behavior; no assertions in baseline tests are weakened.
- The added document-only prompt clause is compact. In the 18-scenario final-browser benchmark, GP001 changes by exactly +1390 UTF-8 bytes; the other 17 prompts retain identical SHA-256 values. Byte/4 is a proxy, not a model tokenizer count. The CI guard retains all assertions and updates only the existing GP001 exact measured before/after hash exception, subject to human PR review.

## Executed evidence

- `npm test`: PASS, **1287/1287** in the main Node suite, plus 9/9 and 10/10 auxiliary suites and chained existing verifiers. No baseline tests skipped.
- `npm run build`: PASS; home cache version 6.4.27.
- `node --test test/document-mvp-intent-30.test.mjs`: **32/32 PASS**: 30 task fixtures, canonical handoff integration and spoofed-marker rejection.
- `scripts/verify-document-handoff-browser.mjs`: **60/60** at mobile 390px and desktop 1366px. Thirty scenarios per viewport: 15 document intents and 15 other tasks. Each viewport has one existing intake-only task; copy/open checks are not applicable to that intake. For the other 58 scenarios, actual clipboard content matches the rendered prompt for copy, ChatGPT and Gemini actions. Windows are intercepted to avoid submitting content or invoking AI. Document/Workers AI requests: **0**; downstream AI invocations: **0**.
- `scripts/verify-prompt-efficiency-runtime.mjs`: all **18/18** scenarios measured on both pinned main and the new built app using fixed Date/Math. Only the local executable path was adapted to the available Chromium; assertions were unchanged. The existing CI comparison logic passes the exact new GP001 exception and verifies the other 17 unchanged scenarios.

Evidence: `handoff-browser-30.json`, `prompt-comparison.json`, `mobile-390.png`, `desktop-1366.png`, and verification logs in this directory. CI on the latest pushed SHA is recorded in the PR body; previous commit checks are not reused.

## Review boundary

The GP handoff implementation is locally verified. Actual output from a signed-in free ChatGPT/Gemini/other AI account is **NOT VERIFIED**. A signed-in destination's file generation and Word output remain destination-dependent, with the full-text fallback available in the instruction. No claim is made that the destination performed work merely because GP prepared the instruction.

No merge, deployment, cloud configuration change, purchase or live AI call occurred. PR remains Draft for review and the user's release decision.
