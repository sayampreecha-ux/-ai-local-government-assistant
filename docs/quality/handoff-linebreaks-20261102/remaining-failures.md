# Remaining-failure correction

Baseline PR HEAD: 4b2daae31e4420d185fdfc3a45d32e28d7dcc379.

The GP04-A phrase `ไม่รับรองสิทธิเบิก` was still treated as a positive financial
legal topic. The assembled prompt included HIGH-risk/legal search instructions
and a finance-authority workflow despite a request for arithmetic on synthetic
quantity/unit-price values. The downstream Gemini response then added unsourced
legal statements and omitted reusable formulas.

Add a bounded final-handoff adapter, analogous to the existing factual-minutes
adapter. It applies only to explicit simulation + table/XLSX + numeric unit
prices + explicit exclusion of reimbursement certification, with no attachments.
Legal, entitlement, actual payment, procurement, tax, approval, mixed-action and
instruction-override terms fall back to the existing workflow. The adapter
preserves the literal user request, factual arithmetic, privacy, human review,
no real action without authority/permission/approval/audit/kill switch, and the
requirement to re-enter official-source and Decision Lock gates for real legal
decisions. It does not change the 13-category router.

For memo requests explicitly saying no additional budget, add a bounded rule
that this is not zero cost or proof of available resources/equipment/personnel.
Any proposed additional resources must be outside the memo and marked pending
verification. Existing ordinary sample prompts remain byte-identical.

Validation: targeted tests 42/42; npm test 1,613/1,613 plus the subsequent 10-case
adversarial suite; existing 18 final-copyable prompt scenarios byte-identical;
9 original QA60 fixtures plus the original memo example and privacy blocks on
both device widths. See the final report for exact CI IDs and observed outputs.

Actual anonymous ChatGPT memo response retained no additional budget without
asserting available old resources. Actual fresh Gemini GP04-A response supplied
2,400 + 500 = 2,900 with C3*E3, C4*E4 and SUM(F3:F4), no named legal citation,
and an honest FILE NOT VERIFIED fallback. It added an unnecessary memo heading;
this is not a claim of perfect output formatting. Actual downloadable file
acceptance is still blocked by the available provider sessions. No merge/deploy.

A subsequent GP01-E live retest treated edits to user instructions as a completed booking/cancellation story. Add a correction-specific rule: retain the latest selected facts, but do not invent earlier reservations, cancellations, committees, or room capacity. The original fixture is retained and a regression checks this distinction.

## 3 November: room-only scope follow-up

The observed ChatGPT GP01-E output still inserted an equipment request inside
the memo's proposal section. The general suggestion/pending-verification rule
left the scope of the actual request ambiguous. Add one bounded rule for room
memo requests with no accessory terms: the main request is room-only, including
its consideration/proposal sections; optional additions belong outside the
memo under a pending-proposal heading. Explicit accessory/food requests and
ordinary advice are negative controls and retain their intended scope.

Targeted 45/45 and Node 1,616/1,616 plus subsequent 10/10 passed locally. Live
model outputs, browser evidence, exact-head CI and actual file acceptance are
recorded separately in the updated report; this source note does not certify
them. No merge/deploy.

The 3 November exact-head CI browser jobs failed before tests because ubuntu-latest resolved to Ubuntu 26.04, unsupported by the pinned Playwright 1.55.0. Pin the five affected browser workflows to ubuntu-24.04. Keep their steps, assertions, dependencies and gates unchanged. Evidence: Engineering run 41603069114 job 125806182854.

### Narrow-scope negative controls (2026-11-03)
The first room-only predicate also matched an unrelated tort report mentioning a meeting room. Two negative controls reproduced the failure. Restrict the predicate to a room-request memo/letter and exclude mixed legal/rights/procurement requests. Explicit accessory/food requests remain unchanged. Targeted tests: 47/47; complete Node regression and static build pass. Live guest ChatGPT outputs for both original room-request cases contain no added equipment/services; actual DOCX remains unavailable and is not FILE PASS.

## Final quantity-unit correction

The real GP04-A ChatGPT response at d4633436 summed 20 reams and 50 pens into 70. The simulation-only handoff requested a total without distinguishing money from unlike quantity units. Reproduce with the original response and a failing regression, then append one sentence to that adapter: sum money, forbid unlike quantity units, allow same-unit quantities. Mixed entitlement requests retain the authority workflow. No router/governance changes.

A further live memo retest added an unrequested exchange-of-opinions purpose; GP01-E used unspecified-time wording and varied placeholders. Tighten the existing room-only sentence to source-only purpose/activities, missing details as [รอตรวจสอบ], and no reference to an unspecified time. Preserve all room/accessory/mixed-workflow negative controls.

Final-copyable prompt inspection confirmed conflicting placeholders: template/workflow sections prescribed [ระบุ...] and [ระบุข้อมูลที่ต้องยืนยัน], while the document contract required [รอตรวจสอบ]. Reconcile only these generated policy placeholders inside the room-only predicate. Split around the literal user request before substitution, preserving it byte-for-byte. Unrelated/mixed legal templates are negative controls. This removes conflicting instructions rather than adding another quality paragraph.
