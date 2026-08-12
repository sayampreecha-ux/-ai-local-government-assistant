# GovPrompt Thailand — AI Agent Governance Blueprint

> สถานะ: กรอบกำกับภายในสำหรับการพัฒนาและทดสอบ GovPrompt ไม่ใช่มาตรฐานหรือคู่มือทางการของหน่วยงานรัฐ

## 1. หลักการตั้งต้น

GovPrompt ต้องเริ่มจาก **งานที่ต้องการให้ดีขึ้น** ไม่ใช่เริ่มจากการเลือก Agent หรือเทคโนโลยี

เส้นทางการออกแบบหลัก:

`Job → Need for Agent → Agency → Authority → Autonomy → Capability → Architecture → Technology → Governance → Impact Assessment → Testing → Controlled Deployment`

หลักย่อสำหรับระบบปัจจุบัน:

`Job → Intent → Evidence → Authority → Tool → Output → Human Approval → Audit`

## 2. หลักการบังคับใช้

1. **Technical Permission ≠ Legal Authority** — สิทธิ์ทางเทคนิคในการเขียนข้อมูล เรียก API หรือส่ง workflow ไม่ทำให้ AI มีอำนาจตามกฎหมาย
2. **Minimum Necessary Agency** — ให้ความสามารถแก่ AI เท่าที่จำเป็นกับงาน
3. **Minimum Necessary Authority** — AI ห้ามขยายขอบเขตอำนาจเอง
4. **Meaningful Human Oversight** — มนุษย์ต้องมองเห็น เข้าใจ และมีอำนาจ Pause, Redirect, Reject, Revoke หรือ Rollback ได้ทันเวลา
5. **Evidence-based Autonomy Expansion** — เพิ่ม autonomy เมื่อมีหลักฐานจากการใช้งานจริงและการทดสอบรองรับเท่านั้น
6. **Test Before You Trust** — ทดสอบทั้งระบบ ไม่ใช่เฉพาะความถูกต้องของคำตอบ
7. **Data Governance + AI Governance** — คุณภาพ แหล่งที่มา เจ้าของข้อมูล สิทธิ์เข้าถึง Source of Truth และ auditability ต้องถูกพิจารณาร่วมกัน

## 3. Autonomy Levels

### L1 — Read
อ่าน ค้น ดึงข้อมูล สรุป เปรียบเทียบ โดยไม่เปลี่ยนแปลงระบบจริง

### L2 — Recommend
วิเคราะห์ ประเมินความเสี่ยง เสนอทางเลือก และสนับสนุนการตัดสินใจ โดยไม่ตัดสินแทนผู้มีอำนาจ

### L3 — Draft
สร้างร่างหนังสือ TOR โครงการ ตาราง Checklist ข่าว หรือเอกสารอื่นเพื่อให้มนุษย์ตรวจและอนุมัติก่อนใช้จริง

### L4 — Bounded Action
ดำเนินการเชิงระบบได้เฉพาะเมื่อครบทุกเงื่อนไข: มี Human Approval, ขอบเขตชัด, ย้อนกลับได้, มี Audit Trail และยืนยันฐานอำนาจตามกฎหมายแล้ว

**ค่าเริ่มต้นของ GovPrompt คือ L1–L3** ส่วน L4 ต้องเป็นข้อยกเว้นที่พิสูจน์แล้ว ไม่ใช่ค่าเริ่มต้น

## 4. การกระทำที่ห้าม AI ทำเองโดยอัตโนมัติ

- อนุมัติหรือสั่งจ่ายเงินแทนผู้มีอำนาจ
- ลงนามหรือออกคำสั่งทางปกครองแทนเจ้าหน้าที่
- ตัดสินผลการจัดซื้อจัดจ้างหรือคัดเลือกผู้ชนะ
- ลงโทษทางวินัย แต่งตั้ง โอนย้าย หรือเลิกจ้างบุคคล
- ลงมติหรือใช้อำนาจของสภาท้องถิ่น
- เปิดเผยข้อมูลส่วนบุคคล ข้อมูลสุขภาพ หรือข้อมูลลับโดยอัตโนมัติ
- ส่งข้อมูลหรือเรียก API ที่มีผลผูกพันภายนอกโดยไม่มีการอนุมัติที่ตรวจสอบได้

## 5. Human Oversight Gate สำหรับ L4

ก่อน Bounded Action ต้องตอบ YES ครบทุกข้อ:

- ผู้อนุมัติมีอำนาจตามกฎหมายหรือการมอบอำนาจที่ถูกต้องหรือไม่
- ผู้ใช้มองเห็นสิ่งที่ AI กำลังจะทำก่อนเกิดผลจริงหรือไม่
- ขอบเขตข้อมูล/ระบบ/รายการที่อนุญาตถูกจำกัดหรือไม่
- สามารถ Pause / Reject / Revoke / Rollback ได้หรือไม่
- มี log ระบุผู้ใช้ เวลา input, evidence, tool, action และผลลัพธ์หรือไม่
- มี Privacy/Security gate ก่อนส่งข้อมูลออกนอกระบบหรือไม่
- มีวิธีจัดการเมื่อหลักฐานไม่พอหรือระบบขัดแย้งกันหรือไม่

ถ้าข้อใดข้อหนึ่งไม่ผ่าน ให้ลดกลับเป็น **L3 Draft with Approval**

## 6. Testing Standard

การทดสอบ Agent ต้องครอบคลุมอย่างน้อย:

1. Intent ถูกหรือไม่
2. Evidence/Source ถูกเรื่องและเป็นฉบับที่ควบคุมได้หรือไม่
3. Tool ถูกเลือกหรือไม่
4. Output ตรงเจตนาผู้ใช้หรือไม่
5. อยู่ใน Authority Boundary หรือไม่
6. ข้าม Human Approval ได้หรือไม่
7. Privacy/Security gate ทำงานหรือไม่
8. หยุดหรือยกเลิกได้หรือไม่
9. Rollback ได้หรือไม่เมื่อมี action จริง
10. มี Audit Trail เพียงพอหรือไม่

ทุก regression ที่เกิดจากการใช้งานจริงควรถูกเพิ่มเป็น test case ก่อนแก้ logic

## 7. Deployment Path

`Discover → Sandbox → Read-only → Recommend → Draft with Approval → Bounded Action`

ห้ามข้ามขั้นเพราะเพียงเห็นว่าเทคโนโลยีทำได้

## 8. Definition of Done สำหรับการเพิ่ม Autonomy

การเพิ่มระดับ autonomy จะถือว่าพร้อมเมื่อ:

- มี use case และเจ้าของงานชัดเจน
- มีฐานอำนาจและผู้อนุมัติชัดเจน
- กำหนดข้อมูลขั้นต่ำและสิทธิ์ขั้นต่ำ
- มี sandbox และ test cases ครอบคลุม failure mode
- มี Human Approval ที่ meaningful
- มี audit log และ rollback plan
- ผ่าน Privacy/Security review
- ผ่าน regression suite เดิมทั้งหมด
- มี pilot evidence จากผู้ใช้จริง

## 9. สถานะ GovPrompt ปัจจุบันตามกรอบนี้

GovPrompt ควรเน้น **L1 Read + L2 Recommend + L3 Draft** เป็น production posture หลัก โดยใช้ Intent Router, Tool Routing, Official Search/Citation, Output Router, Privacy Guard และ Prompt Orchestrator เพื่อสนับสนุนงาน ส่วน L4 จะเปิดได้เฉพาะ bounded action ที่ผ่าน governance gate แยกต่างหาก

## 10. แหล่งแนวคิดอ้างอิงสำหรับการพัฒนาต่อ

กรอบนี้เป็นข้อเสนอภายในที่สังเคราะห์แนวคิดจาก OECD ด้าน AI in Government, DGA ด้าน Smart Back Office และ Data Governance, ETDA ด้าน AI Governance, NIST AI RMF และแนวทาง AI Playbook ของรัฐบาลสหราชอาณาจักร ทั้งนี้เมื่อจะอ้างข้อกำหนดหรือมาตรฐานในเอกสารทางการ ต้องตรวจต้นฉบับและฉบับปัจจุบันล่าสุดอีกครั้ง
