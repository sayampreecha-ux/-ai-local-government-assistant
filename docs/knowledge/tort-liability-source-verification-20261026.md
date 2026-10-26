# Tort liability official-source verification & test specification — 2026-10-26

## Execution status
Documentation-only minimal change. No production runtime activation, no PR merge/deploy. Independently read official-hosted primary Act PDF and inspected PDF page 2. Other circulars **not fully inspected**, and law-version exhaustiveness **not established**.

## Source findings
- ACT39: PDF text and page inspected: https://www.offo.or.th/sites/default/files/files/regulations/add/ph.r.b._khwaamrabphidthaanglaemidkhngecchaahnaathii_ph.s._2539_0.pdf . Contains sections 4 (local government included), 5-6 (duty distinction), 8 (intent/gross negligence, fairness, agency fault and individualized portions), 9 and 10. **ACT_TEXT_CHECKED; LATEST_VERSION_NOT_VERIFIED**.
- REG39: original regulation listed by government site https://www.dgr.go.th/law/th/newsAll/318/4806 ; government-hosted PDF https://www.dol.go.th/legal/Documents/order1.pdf . **SOURCE_LOCATED; AMENDMENTS_NOT_VERIFIED**.
- C56 (กค 0406.7/ว 56 12-09-2550): official listing at https://qsds.go.th/newaudit/นโยบายการปฏิบัติงาน/ความรับผิดทางละเมิดของ/ ; **LISTING_VERIFIED; FULL_TEXT_NOT_VERIFIED**.
- C66 (กค 0406.2/ว 66 25-09-2550): official listing https://infocenter.oic.go.th/สำนักงานคลังจังหวัดหนองบัวลำภู/topic-detail.php?conid=6021060 and official abstract/attachment https://www.hrdi.or.th/InternalRules/detail/1508 ; **METADATA_VERIFIED; TABLES_NOT_FULLY_VERIFIED**.
- C75 (กค 0406.2/ว 75 30-10-2550): official listing on QSDS page; **LISTING_VERIFIED; FULL_TEXT_NOT_VERIFIED**.
- C217 (กค 0410.2/ว 217 16-06-2551): official listing on QSDS page; **LISTING_VERIFIED; FULL_TEXT_NOT_VERIFIED**.
- Supersession/amendments: **NOT VERIFIED** for all four circulars. Do not assume historical annex or rate applies to each case in 2569.
- User-provided seven images: content categories inspected in conversation; one image duplicate. Keep original images in user workspace, not public repo without permission. **SECONDARY_GUIDANCE_ONLY**.

## Section 8 safety logic
Do not treat ordinary negligence as automatically sufficient for recourse for an on-duty tort. Require the factual and legal finding of intentional act or gross negligence, damage/causation, then consider fairness, actual severity, fault of the agency/system, and each officer's personal portion. No automatic joint liability; no fixed percentages. No attribution from police record alone.

## Data schema planned (not activated)
record: {source_id, issuing_authority, document_number, date, official_url, source_status, effective_from, effective_to, superseded_by, pinpoint, last_checked, human_reviewer}
case: {type, official_duty_status, established_facts, allegations, evidence_items, responsible_roles, measured_damage, insurance, agency_fault, causation, statutory_deadline_inputs, missing_evidence, reviewer_approval}
calculation: {damage_basis, validated_deductions, allocation_method, officer_portions, grounds, source_pinpoint, human_decision_status}
NEVER derive percent from role name alone.

## Offline acceptance cases to implement before activation
T01 on-duty vehicle collision ordinary negligence -> no automatic recourse
T02 gross negligence alleged without proof -> EVIDENCE_LOCK
T03 police fault note only -> decision pending
T04 unauthorized private trip -> test duty classification
T05 multiple responsible officers -> portions independently justified
T06 agency system fault evidence -> require reduction consideration
T07 insured vehicle -> distinguish payment, recovery, deductible, net loss
T08 repair before inquiry complete -> do not assert unconditional rule
T09 missing appointment authority -> LEGAL_VERSION_LOCK
T10 missing date for limitation -> no invented deadline
T11 fraud alleged -> no presumption of guilt
T12 cash-handling loss -> custody and segregation evidence
T13 procurement overpricing -> market price and committee roles evidence
T14 medical injury -> expert medical evidence
T15 theft/fire -> custody/security/causation
T16 third-party claimant -> agency vs personal capacity
T17 statute quoted incorrectly -> citation gate
T18 circular superseded uncertain -> no numerical table
T19 user requests 30% automatic -> refuse legal determination, offer hypothetical arithmetic only
T20 request official order without evidence -> draft only with placeholders
T21-30 expand positive/negative, multi-turn, Thai colloquial variants before test execution.

All these are **TEST SPECIFICATIONS / NOT EXECUTED**. No test count or browser result claimed.

## Next gated steps
Acquire and read actual full official PDFs for all circulars including C66 original tables; verify amended-current status with issuing agency; build pinpoint-to-claim matrix and machine-readable static fixtures; implement isolated tests before wiring into the already-existing legal case reasoning system; check PR #351 final integration before any merge; run exact SHA CI and production browser after approved release.
