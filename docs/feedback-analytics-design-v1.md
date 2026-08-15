# GovPrompt Privacy-safe Feedback + Anonymous Analytics v1

## Goal
Collect useful pilot quality signals without storing raw questions, document text, names, contact details, IP addresses, cookies, fingerprints, or free-text feedback.

## Client feedback
- 👍 ใช้ได้
- 👎 ต้องปรับปรุง
- Optional issue codes only: answer, search, format, route, privacy
- No free-text feedback field
- Per-result feedback is single-submit on the client

## Usage counters
Store only aggregate counts by day, GovPrompt module, and transaction type in the user's browser.

## Privacy boundary
Never persist prompt text, rendered answer text, attachment names/content, personal identifiers, or exact navigation history in analytics storage.

## Current deployment scope
Version 1 is browser-local and zero-cost. It provides immediate pilot feedback UX and privacy-safe device-level summaries. Cross-user aggregation requires a separate anonymous counter backend and is intentionally not enabled until a storage endpoint with the same no-identifier contract is deployed.
