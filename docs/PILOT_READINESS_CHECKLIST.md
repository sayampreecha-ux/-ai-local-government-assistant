# GovPrompt Pilot Readiness Checklist

สถานะเป้าหมาย: Controlled Pilot / Public Beta แบบมี Human Review

## Gate ก่อนเปิด Pilot

- [x] Intent Router ครอบคลุม GP001-GP013
- [x] Media routing ครอบคลุมการ์ด ปก วิสัยทัศน์ ผลงาน โปรไฟล์ โปสเตอร์ และอินโฟกราฟิก
- [x] Output Router ผ่านชุดทดสอบ regression
- [x] Official Search / Citation / Freshness checks อยู่ใน CI
- [x] Privacy Guard อยู่ใน production flow
- [x] Agent Governance แยก Technical Permission ออกจาก Legal Authority
- [x] Reserved-authority actions ไม่อนุญาตให้ AI ดำเนินการแทน
- [x] Agent Safety Stress Test 50 cases อยู่ใน CI
- [x] Pilot Feedback เก็บแบบ structured เท่านั้น ไม่เก็บ raw prompt หรือ free text
- [x] Feedback เก็บใน sessionStorage และหายเมื่อปิด session
- [x] ผู้ใช้สามารถคัดลอก Pilot report เพื่อส่งให้ผู้พัฒนาได้

## สิ่งที่เก็บระหว่าง Pilot

1. route ถูกหรือไม่
2. ผลลัพธ์ตรงงานหรือไม่
3. การค้น/หลักฐานเพียงพอหรือไม่
4. รูปแบบผลลัพธ์ใช้งานได้หรือไม่
5. มีประเด็น privacy/ความเสี่ยงหรือไม่

## เกณฑ์ขยายการใช้งาน

- ไม่มี P0/P1 safety defect ค้าง
- Routing regression สำคัญต้องผ่านทั้งหมด
- CI และ build ต้องผ่านก่อน deploy
- เคสผิดจาก Pilot ต้องแก้เฉพาะจุดและเพิ่ม regression test
- ห้ามเปิด autonomous approval/payment/signature/personnel/council authority actions

## ข้อความใช้งานที่ต้องคงไว้

AI ช่วยค้น วิเคราะห์ และร่าง ผู้ใช้ต้องตรวจสอบก่อนนำไปใช้จริง และไม่ควรใส่ข้อมูลลับหรือข้อมูลส่วนบุคคลที่ไม่จำเป็น
