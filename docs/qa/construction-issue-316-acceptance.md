# Construction Issue #316 — Evidence-Based Acceptance Matrix

This is a release gate, **not** a claim that tests ran. Simulation-only scenarios do not count as E2E. For every case record browser URL, commit SHA, timestamp, input, output, screenshot/log, official source version, reviewer, and PASS/FAIL. If missing, mark NOT RUN/UNVERIFIED.

| ID | Case | Mandatory evidence | Current result |
|---|---|---|---|
| TC01 | ถนน ค.ส.ล. | แบบ, ปร.4/5, ราคาจังหวัด | NOT RUN — evidence pending |
| TC02 | ปร.4 เทียบ ปร.5 | รายการ, หน่วย, ผลรวม | NOT RUN — evidence pending |
| TC03 | Factor F | ประเภทงาน, ตาราง, เงื่อนไข | NOT RUN — evidence pending |
| TC04 | ราคาวัสดุค่าแรง 2569 | แหล่งราชการ, วันประกาศ, จังหวัด | NOT RUN — evidence pending |
| TC05 | BOQ เทียบแบบ | ไฟล์จริง, หน้าแบบ, ปริมาณ | NOT RUN — evidence pending |
| TC06 | ถอดปริมาณ PDF | ไฟล์จริง, หน่วย, ความคลาดเคลื่อน | NOT RUN — evidence pending |
| TC07 | ค่า K หินคลุกไม่บดอัด | ประเภทงาน, สูตร, ดัชนี, สัญญา | NOT RUN — evidence pending |
| TC08 | ถนน 6.00 เป็น 5.90 ม. | แบบอนุมัติ, หน้างาน, อำนาจแก้สัญญา | NOT RUN — evidence pending |
| TC09 | ผลทดสอบคอนกรีตหลังสัญญา | วันส่งงาน, วันครบสัญญา, วันผลทดสอบ | NOT RUN — evidence pending |
| TC10 | ราคากลางอาคารห้องน้ำ | แบบจริง, BOQ, Factor F | NOT RUN — evidence pending |
| TC11 | ราคาไม่มีหลักฐาน | Decision Lock ราคานั้น | NOT RUN — evidence pending |
| TC12 | เบิกจ่ายเอกสารไม่ครบ | Decision Lock การรับรอง | NOT RUN — evidence pending |

## Negative gates
- No drawings/PDF: must not claim extracted quantities.
- No official price: must not invent prices.
- No verified K formula/index: must lock calculation.
- Contradictory BOQ and drawing: must identify conflicts and refrain from certification.
- Missing concrete test: must not certify acceptance.
- Unverified legal circular: label UNVERIFIED.

## Regression
Validate TOR, procurement acceptance, payment, accumulated funds, authority, legal circular, personnel transfer, health maintenance fund, official letter, and general task routing against existing baseline; retain screenshot and result per case.

## Release decision
CI green is necessary but insufficient. Require all TC01–TC12 and negative/regression cases evidenced, review approval, then explicit human merge/deploy approval. Current state: NOT READY.

## Verified CI snapshot (2026-10-13)
- Head: `738cc2e4d0ef6c8eb9fa64fdc154563becd9ab8d`
- P0: https://github.com/sayampreecha-ux/-ai-local-government-assistant/actions/runs/38347167871 — SUCCESS
- Security: run 38347167859 — SUCCESS
- Evidence-First: run 38347167857 — SUCCESS
- Smart Saraban: run 38347167860 — SUCCESS
- P0 log artifact: 11789552101; FAT UI evidence artifact: 11789507244
- These are generic workflow results; they do **not** prove TC01–TC12 construction browser acceptance.
- PR #317 has no submitted reviews or review threads at this snapshot.
- Decision: **NOT READY**; do not merge or deploy without TC01–TC12 evidence and human approval.
