# Cash Reserve + K Payment Rule Pack v1

## Scope

Use this rule pack when a user asks whether accumulated funds (เงินสะสม) may be used to pay a contractor's price-adjustment compensation (ค่า K), and whether a provincial-g Governor exemption is required.

## Non-negotiable decision policy

1. Treat the classification of an expense and the legal permission to use accumulated funds as separate questions.
2. Verify the current text of the applicable accumulated-funds rule, especially the cited clause 97(1), from an official primary source.
3. Verify the original text of DLA letter มท 0808.2/1095 dated 28 May 2021 and the exact wording/scope of category (13), rather than relying on a screenshot or paraphrase.
4. Verify the contract, price-adjustment clause, calculation, indices, work period, approval, inspection and payment evidence.
5. Do not hard-code that every K payment is automatically payable from accumulated funds or that every case is exempt from seeking a waiver.
6. If the evidence is incomplete or conflicting, keep Decision Lock on and provide a conditional preliminary analysis only.

## Required output

- Confirmed facts / unconfirmed facts
- Applicable authority and version/date
- Classification analysis
- Accumulated-funds eligibility analysis
- K entitlement and calculation checks
- Waiver/exemption analysis
- Evidence matrix (claim → source → document/page → status)
- Risk level and corrective actions
- Final status: allowed / allowed after correction or additional evidence / cannot conclude yet

## Test prompts

1. เงินสะสมจ่ายค่า K ให้ผู้รับจ้าง ต้องขอยกเว้นผู้ว่าราชการจังหวัดหรือไม่
2. ค่า K อยู่ในงบค่าที่ดินและสิ่งก่อสร้างตาม ว 1095 แล้ว จ่ายจากเงินสะสมได้เลยหรือไม่
3. มีคำตอบจาก กคท. ว่าไม่ต้องขอยกเว้น แต่ยังไม่มีต้นฉบับ ว 1095 และข้อ 97(1) ฉบับปัจจุบัน ให้ตรวจอย่างไร
4. ค่า K คำนวณแล้วแต่ยังไม่มีเอกสารอนุมัติและการตรวจสอบดัชนี ให้ระบบล็อกข้อสรุปหรือไม่

## Implementation note

The executable rule pack is located at `assets/js/core/cash-reserve-k-rulepack-v1.js` and registers as `window.GovPrompt.cashReserveKRulePack`. It is designed to augment the existing Evidence-First / Applicable Authority Check / Decision Lock architecture without changing the existing UI categories.
