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

Validation: targeted tests 41/41; npm test 1,612/1,612 plus the subsequent 10-case
adversarial suite; existing 18 final-copyable prompt scenarios byte-identical;
9 original QA60 fixtures plus the original memo example and privacy blocks on
both device widths. See the final report for exact CI IDs and observed outputs.

Actual anonymous ChatGPT memo response retained no additional budget without
asserting available old resources. Actual fresh Gemini GP04-A response supplied
2,400 + 500 = 2,900 with C3*E3, C4*E4 and SUM(F3:F4), no named legal citation,
and an honest FILE NOT VERIFIED fallback. It added an unnecessary memo heading;
this is not a claim of perfect output formatting. Actual downloadable file
acceptance is still blocked by the available provider sessions. No merge/deploy.
