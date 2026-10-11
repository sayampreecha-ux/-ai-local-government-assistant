# GovPrompt v7 — Vehicle regulation 2569 knowledge pack (DRAFT / DECISION LOCK)
Updated: 2026-10-11
Status: NOT APPROVED FOR LEGAL AUTONOMOUS DECISIONS. Knowledge/routing specification only; NOT activated in production.

## Scope
Attach to existing "งานพัสดุและทรัพย์สิน" workstream, NOT a new category/menu. No separate intake form; one free-text composer, AI downstream searches for official sources. Preserve existing UI, answer governance, action governance, router, backend and prompt engine.

## Trigger intent examples
รถราชการ, รถส่วนกลาง, รถประจำตำแหน่ง, ยานพาหนะ อปท., รถ EV, รถไฟฟ้า, สถานีชาร์จ, บัตรอัดประจุไฟฟ้า, การขอใช้รถ, การอนุมัติใช้รถ, แบบ 1, แบบ 2, แบบ 3, แบบ 4, แบบ 5, แบบ 6, สก.1, ปต.1, ซ่อมรถ, รถเสียกลางทาง, ซ่อมฉุกเฉิน, จ้างซ่อม, ซื้อรถ, เช่ารถ, เติมน้ำมัน.
Do not capture generic car discussions unrelated to local government, and do not override existing procurement routing.

## Source candidates — must inspect ORIGINAL FULL TEXT before applying
1. ระเบียบกระทรวงมหาดไทยว่าด้วยการใช้และรักษายานพาหนะขององค์กรปกครองส่วนท้องถิ่น พ.ศ. 2569.
   Official local government publication: https://www.jaothong.go.th/index/load_data/?doc=15283
   Another publication: https://phsmun.go.th/documents/view/231
2. หนังสือ มท 0808.2/ว 6384 ลงวันที่ 31 กรกฎาคม 2569: หลักเกณฑ์และวิธีปฏิบัติตามระเบียบ — https://danchumpon.go.th/front/menu/20/9
3. Any applicable public procurement law, implementing regulation, and updated circulars; identify current versions and legal authority before applying.

NOTE: Other circular identifiers previously discussed (ว 2600, ว 2778) are candidate references only until their complete official texts and applicability are checked. The infographic is explanatory, NOT the legal source. Exact effective date, repeal/transitional provisions, EV definition, form labels, and emergency repair conditions MUST be verified against originals. Do not manufacture legal section numbers.

## Downstream AI instruction / Answer Governance
The user types a natural-language question once. Classify topic and vehicle type; identify action needed. Use AI destination's own source-search tools; GovPrompt makes NO automatic external API/Tavily searches. Retrieve current official regulation, gazette text, related ministry circulars, and procurement instruments, then cite each applicable section and date. Confirm Authority → Version/effective period → Evidence → Reasoning. Separate mandatory law, discretion, and internal control suggestions.
Ask only ONE essential follow-up in the main composer if genuinely blocked; do not require uploads.
If original sources are inaccessible or conflict, say 'ยังไม่ยืนยันข้อกฎหมาย / Decision Lock'; offer a conditional draft/checklist, not an approval.
For use, approval, operations, recordkeeping, procurement and maintenance, identify who may approve ONLY from verified law/delegation document. For emergency repairs, do not automatically deem qualifying solely from the three-condition infographic. Check budget, procurement authority, urgency record, contemporaneous evidence, permissions and historical maintenance record.
Privacy: do not request licence plates, IDs, driver names, travel itineraries or other personal data unless needed; mask when drafting.
Action governance: no approval, ordering repair, payment or external execution without authenticated permission, scope validation and human approval.

## Answer structure
1. คำตอบสั้น: ทำได้/ทำไม่ได้/ยังไม่ยืนยัน พร้อมเงื่อนไข
2. ข้อกฎหมายและหนังสือสั่งการ: ฉบับ, วันที่, ข้อ, ลิงก์ต้นฉบับ, verified/unverified
3. ขั้นตอนปฏิบัติและเอกสาร: ขอใช้ / อนุมัติ / ใช้ / บันทึก / ดูแล, as applicable
4. ผู้รับผิดชอบและผู้มีอำนาจ: VERIFIED ONLY
5. ความเสี่ยง / จุดต้องตรวจหลักฐาน / Decision Lock
6. สิ่งที่ให้ผู้ปฏิบัติอนุมัติหรือตรวจทาน (Human Review)

## Acceptance tests (not run; required before merge)
- รถ อบจ. เสียกลางทาง ซ่อมก่อนทำเรื่องได้ไหม? => no blanket approval, search originals, urgency/procurement gate
- ขอใช้รถส่วนกลางไปประชุม => asks/checks authorization & use record, no invented signer
- รถ EV ชาร์จไฟเบิกอย่างไร => source/financial/charging documents, no invented rate
- ซื้อหรือเช่ารถ => value/authority/procurement, no unfounded thresholds
- แบบ สก.1 ปต.1 ใช้เมื่อใด => inspect full annex; lock if unavailable
- รถประจำตำแหน่งให้คนอื่นขับ => check rights/delegation, no blanket answer
- ซ่อมก่อนมีงบ => no blanket approval
- ถามเรื่องรถยนต์ส่วนตัว => should not divert to municipal vehicle rules
- Existing ปค.1–ปค.6, GP223, procurement routes and mobile composer unchanged
- No source => clear Decision Lock; no fabricated section, date, or template
- Full regression and production browser check needed, with evidence logged.
