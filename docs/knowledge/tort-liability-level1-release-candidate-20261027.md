# PR #352 — Level-1 Human Acceptance & Release Candidate Package

Date: 2026-10-27. **TECHNICAL CI PASS / LEGAL AND HUMAN APPROVAL PENDING. NOT PRODUCTION READY.**

PR: https://github.com/sayampreecha-ux/-ai-local-government-assistant/pull/352
Existing branch: `docs/tort-liability-evidence-register-20261026`
Verified PR SHA before this docs commit: `c310f452011d2da3d088d30e8d84380c69bd3eaa`
Main: `18ef279fb6c95cc2c3298bd81ffec442339c60ff`

## Technical acceptance — 12/12 SUCCESS on referenced branch SHA

These are **automated branch CI**, not approval of law, external AI or deployed production.

| Workflow | Actions run ID | Result |
|---|---:|---|
| Smart Saraban MVP Test | 40478197846 | PASS |
| GovPrompt v8 Evidence-First | 40478197923 | PASS |
| Security Release Gate | 40478197886 | PASS |
| Construction Full-Site PR | 40478197851 | PASS |
| Revenue Real-User Browser | 40478197876 | PASS |
| Engineering Six-Menu | 40478197856 | PASS |
| Construction Browser Contract | 40478197917 | PASS |
| P0 verification | 40478197933 | PASS |
| Tort Level-1 Focused Tests | 40478190563 | PASS |
| Security Release Gate (second) | 40478190514 | PASS |
| Tort Level-1 Browser Acceptance | 40478190674 | PASS |
| P0 verification (second) | 40478190710 | PASS |

Each run: `https://github.com/sayampreecha-ux/-ai-local-government-assistant/actions/runs/<run_id>`. Browser tests exercise branch-served UI and copy/handoff (mobile and desktop); they are **not** live-production E2E tests.

## Seven-part AI output — honest acceptance ledger

Relevant evidence: `tort-liability-external-ai-7part-acceptance-20261027.md`, `tort-liability-external-ai-retest-20261027.md`, and `tort-liability-internal-7part-acceptance-20261027.md`.

The user supplied a purported downstream response with parts 1–7. Provenance of the external AI provider, original generation session and exact browser paste were **not independently observed**. Round 1 FAIL: invented damaged vehicle parts, unsupported 'verified facts', fictitious performed inquiry and unsafe legal citations. Round 2 improved placeholders and non-adjudication, but FAIL: incorrect Prime Minister regulation name, blanket clauses 8/9 and premature established-fact wording.

| Requested document | Structural presence in user-supplied Round 2 | Independent legal / external E2E assessment |
|---|---|---|
| 1. Incident report | PRESENT | CONDITIONAL: every alleged fact remains UNVERIFIED absent actual evidence |
| 2. Evidence register | PRESENT | HUMAN REVIEW REQUIRED |
| 3. Witness questions | PRESENT | HUMAN REVIEW REQUIRED |
| 4. Executive memo | PRESENT | Round-2 regulatory-title error = FAIL |
| 5. Conditional appointment draft | PRESENT | Round-2 regulatory title, clauses 8/9 and authority = FAIL |
| 6. Investigation report template | PRESENT | Only blank non-operative template; no committee work actually evidenced |
| 7. Loss analysis | PRESENT | Placeholder-only/no liability percentage in submitted Round 2 = PASS LIMITED |

Current `assets/js/home-v3.js` handoff now explicitly instructs exact name `ระเบียบสำนักนายกรัฐมนตรีว่าด้วยหลักเกณฑ์การปฏิบัติเกี่ยวกับความรับผิดทางละเมิดของเจ้าหน้าที่ พ.ศ. 2539`, forbids unverified clauses 8/9 authority, premature investigation findings, fabricated loss items, invented time limits and auto-effective committee orders. `tests/unit/tort-liability-home-handoff.test.js` includes specific regression checks; passing CI does not prove a downstream model obeyed the new instructions.

**EXTERNAL AI E2E: NOT VERIFIED. Seven-section format alone is not semantic PASS.**

## Legal evidence boundaries

Source-to-claim matrix: `tort-liability-source-to-claim-matrix-20261026.md`. Machine-readable lock: `tort-liability-release-gates.json`.

- C217 cross-referenced against 2559 amended regulation clauses 12 and 12/1. Old clause 12 cannot be applied mechanically.
- MI785 historical circular and two appendices inspected in official PAO-hosted PDF pages 46–50; current amendments and case-specific report/referral authority not certified.
- Office of Council of State opinion 1175/2568 is PAO-related but **case-specific**, not blanket authority to appoint/investigate/issue recourse orders.
- Current consolidated legal version, appointing authority for the individual PAO fact-pattern, reporting chain and limitation-date calculations need qualified human legal review.
- **Level-2 C66/C141 percentages, automatic fault findings, recourse orders remain LOCKED.**

## Human sign-off sheet (intentionally unchecked)

Reviewer: [รอระบุชื่อ / ตำแหน่ง]  Date: [รอระบุ]

- [ ] Verify applicable current law and all later amendments, 2539 Act and 2539/2559 regulation
- [ ] Verify official C56/C75/C217, MI785 and newer instructions in relevant PAO context
- [ ] Check case-specific appointment/reporting/signatory authority under applicable clauses 8, 9, 12, 12/1 and 18
- [ ] Witness actual de-identified free-AI browser copy/paste and examine seven **complete** outputs against hallucination/safety rubric
- [ ] Validate redaction, non-operative drafts, no automatic rates and no compensation order
- [ ] Review actual-final SHA, CI, PR diff, and explicitly approve or reject merge/deploy

Decision: [ ] APPROVE  [ ] REQUEST CHANGES  [ ] REJECT
Signature: [รอลงนาม]

## Actual closeout decision

- Branch CI on reference SHA: **PASS 12/12**
- Browser handoff on branch: **PASS**
- Independent downstream AI generation: **NOT VERIFIED**
- Current-version / PAO authority legal gate: **NOT VERIFIED**
- Human release authorization: **NOT RECEIVED**
- Production browser verification of PR feature: **NOT VERIFIED**
- **Release status: DRAFT / BLOCKED FOR MERGE AND DEPLOY.**

No paid AI API was requested; no new PR/branch; no legal gate or percentage lock can be relaxed to force PASS. Once legal reviewer and external-test witness sign off, authorize merge separately, then verify actual deployed SHA and production behavior.
