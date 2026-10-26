# Acceptance scope corrections — 26 October 2026

Base: e8a692eb7bae488a80c7159d12b266dd6d59e23f (PR #350 merged).

Production Cloud Browser reproduced false-positive blocks for “ไม่ใส่ชื่อนายก ไม่ใส่รูปบุคคล” and “ตรวจความเชื่อมโยงแผนและงบ”. Base main Actions: all nine latest workflows successful, including Pages run 40254926488 (fresh REST inspection).

Changes: narrow negated-title exception while retaining names (including นายกิตติ and names after นายก); distinguish ความเชื่อมโยง from sensitive beliefs; prevent dimensional volume-only requests from receiving the mandatory four-part BOQ/price audit contract; replace stale 13-category accessibility label with a count-independent label. Router, prompt-engine core, authority/evidence/version/decision gates, backend and paid-service configuration unchanged.

Validation: npm test PASS: 1445/1445 main tests, plus 9/9 and 10/10 auxiliary tests and verification scripts. Build PASS. Existing 30-case handoff browser suite: 56 handoffs and four existing expected privacy blocks at 390/1366px. New browser suite: 70 questions reconstructed from the old report matrix, 140/140 handoff/source/clipboard/destination/overflow checks PASS at 390/1366px. This is a rerun of matrix question text, not a replay of all prior conversation context. Extra five cover the 14th visible group. No submitted downstream AI requests in these automated suites. No observed external requests. Prompt comparison: all 18 pinned browser scenarios byte-identical.

The broader old report's downstream semantic failures, actual DOCX/XLSX/PPTX/PDF creation, free-account limits and other routing observations remain NOT VERIFIED by this patch. Existing conservative health-context blocking for ผลตรวจสอบ remains unchanged. No claim of full 65-case end-to-end acceptance.

New recurring costs and paid AI API calls: 0. No added dependency or service. Release requires exact-head CI and post-deployment real browser verification. Rollback: revert this patch commit through the existing review/Pages pipeline; no migration.
