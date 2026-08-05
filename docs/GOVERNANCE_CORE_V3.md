# GovPrompt Thailand — Governance Core v3

## เป้าหมาย

ยกระดับ Release 2.0 จาก Static Prompt Generator ให้เป็น Government Decision Support Layer โดยคง GP001–GP012 และ UI เดิมไว้

## โครงสร้างใหม่

1. Shared Context
2. Transaction Router
3. Core Engines
4. Domain Packs
5. Legal Knowledge Base
6. Quality Gates
7. Prompt Composer
8. Confidence & Human Escalation

## ไฟล์ที่เริ่มสร้างแล้ว

- `assets/js/core/shared-context.js`
- `assets/js/core/transaction-router.js`
- `assets/js/core/quality-gate.js`
- `assets/js/core/prompt-composer.js`

## ลำดับเชื่อมหน้า

1. GP005 การเงินและการคลัง — ต้นแบบ
2. GP003 พัสดุและ TOR
3. GP004 แผน โครงการ และงบประมาณ
4. GP002 กฎหมาย
5. GP010 ตรวจสอบภายใน
6. GP011 ผู้บริหาร

## Shared Context ขั้นต่ำ

- ประเภท อปท./หน่วยงาน
- หน่วยงานเจ้าของเรื่อง
- ภารกิจ/Domain
- ขั้นตอนปัจจุบัน
- ประเภทธุรกรรม
- แหล่งเงิน
- ข้อเท็จจริง
- เอกสารที่มี
- กรณีพิเศษ
- ผลลัพธ์ที่ต้องการ

## Routes รุ่นแรก

- procurement
- procurement-construction
- procurement-consultant
- entitlement
- advance
- grant
- revenue
- administrative-order
- hr
- council
- emergency procurement
- payment
- accounting
- asset
- monitoring

## Quality Gate

ทุกคำตอบต้องตรวจอย่างน้อย:

- เขตอำนาจและฐานอำนาจ
- ผู้มีอำนาจและการมอบอำนาจ
- แผน งบ และแหล่งเงิน
- วิธีดำเนินการและพัสดุ
- หลักฐานและการตรวจรับ/รับรองสิทธิ
- การเบิกจ่าย บัญชี และทรัพย์สิน
- PDPA ข้อมูลข่าวสาร และความลับ
- ความเสี่ยงและ audit trail
- Human review / escalation

## Definition of Done — GP005 Pilot

- เพิ่ม Shared Context โดยไม่ทำให้แบบฟอร์มเดิมซับซ้อนเกินไป
- Router แยกพัสดุออกจากรายจ่ายตามสิทธิและเงินยืมได้
- ตรวจ flag เร่งด่วน ไม่มีใบเสร็จ ย้อนหลัง รายเดียว ข้ามปี และแก้สัญญาได้
- Prompt ที่สร้างแสดง Route, Missing facts, Quality level และ Human Review
- ฟังก์ชันบันทึกร่าง PDPA scan เสียง และคัดลอกเดิมยังใช้งานได้
- มี test cases อย่างน้อย 10 กรณีสำหรับ GP005

## หลักการสำคัญ

- ไม่แก้ `main` จนกว่าจะทดสอบ branch นี้ผ่าน
- ไม่เพิ่มเมนูหลักโดยไม่จำเป็น
- ไม่ฝังกฎหมายหรือเลขมาตราไว้ใน rule โดยไม่มี source/version
- ไม่ให้ AI ตัดสินแทนผู้มีอำนาจ
- ทุกคำตอบต้องระบุข้อจำกัดและข้อมูลที่ยังขาด
