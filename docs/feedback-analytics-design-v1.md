# GovPrompt Privacy-safe Feedback + Anonymous Analytics v1

## Goal
Collect useful pilot quality signals without storing raw questions, answer text, document text, names, contact details, IP addresses, cookies, fingerprints, user identifiers, or free-text feedback.

## Feedback UX
- 👍 ใช้ได้
- 👎 ต้องปรับ
- Structured issue codes only: route, answer, search, format, privacy
- No free-text feedback field
- Detailed feedback records are session-only

## Persistent browser analytics
Only aggregate counters are stored in localStorage:
- total feedback count
- up/down counts and satisfaction rate
- counts by GP001–GP013
- counts by structured issue code
- counts by day (last 30 days)
- usage counts by module and transaction type

Route-correction pairs, question text, answer text, files, and identifiers are not persisted in aggregate storage.

## Deployment scope
Version 1 is browser-local and zero-cost. It gives pilot users feedback controls and gives the operator a privacy-safe report when exported from that device.

It does **not** claim to count unique users or aggregate statistics across devices. Cross-device totals require a separate shared counter backend with the same no-identifier/no-content contract.
