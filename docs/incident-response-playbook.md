# GovPrompt Thailand — Privacy & Security Incident Response Playbook

สถานะ: Internal Pilot
วันที่: 9 สิงหาคม 2569

> ใช้เป็น playbook ภายในเพื่อรับมือเหตุผิดปกติด้านข้อมูลและความมั่นคงปลอดภัย ไม่ใช่คำวินิจฉัยทางกฎหมาย กรณีมีข้อมูลจริงของหน่วยงานต้องประสาน DPO/ฝ่ายกฎหมาย/ผู้บริหารของหน่วยงานตามข้อเท็จจริง

## ระดับเหตุ

### SEV-1 — Critical
- พบหรือสงสัยว่าข้อมูลลับ/API key/token/private key ถูกส่งออกภายนอก
- พบข้อมูลส่วนบุคคลจำนวนมากหรือข้อมูลอ่อนไหวถูกเปิดเผย
- พบช่องโหว่ที่ทำให้บุคคลภายนอกอ่าน/แก้ไขข้อมูลหรือเรียก API โดยมิชอบ

**การตอบสนอง:** ปิด external search หรือระบบที่เกี่ยวข้องทันที, rotate secrets, preserve evidence, แจ้งผู้รับผิดชอบและ DPO/ฝ่ายกฎหมายทันที

### SEV-2 — High
- พบ PII หลุดผ่าน Privacy Guard หรือ Worker filter
- logging เก็บ raw query/prompt โดยไม่ตั้งใจ
- CORS/origin/rate limit protection ไม่ทำงานตามที่ออกแบบ

**การตอบสนอง:** disable feature ที่เกี่ยวข้อง, patch, ทดสอบ regression, ตรวจย้อนหลังเท่าที่จำเป็น

### SEV-3 — Medium
- false negative/false positive ของตัวกรองที่ยังไม่เกิดการส่งข้อมูลสำคัญจริง
- metadata มากเกินจำเป็น
- dependency/configuration warning ที่ยังไม่ถูก exploit

**การตอบสนอง:** เปิด issue, กำหนด owner, แก้ในรอบเร่งด่วนก่อน Public Pilot

## First 30 Minutes

1. **Contain** — ปิด feature/endpoint ที่สงสัยก่อน ไม่ต้องปิดทั้ง GovPrompt ถ้า isolate ได้
2. **Do not delete evidence** — ห้ามลบ log/config/commit ที่จำเป็นต่อการตรวจเหตุโดยพลการ
3. **Do not copy sensitive data unnecessarily** — บันทึก hash/request ID/time แทนการคัดลอกข้อมูลจริงเมื่อทำได้
4. **Rotate secrets** — ถ้า secret อาจรั่ว ให้เปลี่ยนทันที
5. **Record timeline** — เวลาเริ่มพบเหตุ ผู้พบ ระบบที่เกี่ยวข้อง การแก้ที่ทำไปแล้ว

## First 4 Hours

- ระบุ data flow ที่ได้รับผลกระทบ
- ตรวจ Browser -> Worker -> Provider -> Response
- ตรวจ commit/deployment ที่เริ่มมีปัญหา
- ตรวจว่ามี raw query/full prompt/PII ใน logs หรือ response หรือไม่
- ตรวจ provider/API ที่ได้รับข้อมูล
- ระบุประเภทข้อมูล จำนวนโดยประมาณ และเจ้าของข้อมูลที่อาจได้รับผลกระทบ
- ประสาน DPO/ฝ่ายกฎหมายถ้าเกี่ยวข้องกับข้อมูลจริง

## Breach Assessment Record

บันทึกอย่างน้อย:
- Incident ID
- วันที่/เวลา
- ผู้รายงาน
- ระบบ/endpoint
- ประเภทข้อมูล
- จำนวนเจ้าของข้อมูลโดยประมาณ
- ผู้รับข้อมูล/บริการภายนอกที่เกี่ยวข้อง
- สาเหตุเบื้องต้น
- มาตรการ containment
- ความเสี่ยงต่อสิทธิและเสรีภาพ
- การตัดสินใจเรื่อง notification และเหตุผล
- ผู้อนุมัติการตัดสินใจ
- วันที่ปิดเหตุ

## Notification Checkpoint

ห้ามตัดสินจากความรู้สึกว่า “ข้อมูลไม่เยอะจึงไม่ต้องแจ้ง” ต้องให้ผู้ควบคุมข้อมูล/DPO/ฝ่ายกฎหมายประเมินตามเงื่อนไขของกฎหมายและระดับความเสี่ยง

หากเหตุเข้าเกณฑ์ที่ต้องแจ้งสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล ต้องดำเนินการภายในกรอบเวลาที่กฎหมายกำหนด โดยแนวทาง GPPC รองรับการบริหารเหตุและการแจ้งภายใน 72 ชั่วโมง

## Recovery Gate

ก่อนเปิด feature กลับ ต้องมี:
- root cause ชัดเจน
- patch/mitigation แล้ว
- regression test ผ่าน
- ทดสอบ PII/secret blocking ซ้ำ
- ตรวจ logs หลัง patch
- ตรวจ production endpoint
- ผู้รับผิดชอบอนุมัติเปิดกลับ

## Post-Incident Review

ภายในรอบถัดไป:
- สรุป root cause
- เพิ่ม test case ที่เคยพลาด
- ปรับ Privacy Guard/Worker rules
- ปรับ playbook/Privacy Notice หาก data flow เปลี่ยน
- ทบทวนสิทธิ์เข้าถึง secrets และ deployment
- บันทึก lessons learned โดยไม่เผยแพร่ข้อมูลส่วนบุคคลหรือรายละเอียด exploit ที่เพิ่มความเสี่ยง
