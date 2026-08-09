# GovPrompt Privacy Guard v1.1 — Test Report

วันที่: 9 สิงหาคม 2569
สถานะ: Day 2 / Internal Pilot

## สรุป

Privacy Guard ได้รับการปรับเป็น v1.1 โดยเพิ่มแนวทาง **fail closed** สำหรับความเสี่ยงสูง: หากพบข้อมูลลับของราชการ, credential/รหัสผ่าน/API key/token, private key หรือยังพบรูปแบบข้อมูลเสี่ยงคงเหลือหลัง sanitize ระบบจะ **ไม่เรียก external search connector** และคืนผลสถานะ `mode: blocked` แทน

## กลุ่มข้อมูลที่เพิ่ม/ปรับการตรวจ

- เลขประจำตัว 13 หลัก รองรับตัวเลขติดกันและคั่นด้วยช่อง/ขีด
- เบอร์โทรศัพท์
- อีเมล
- เลขบัญชี/พร้อมเพย์เมื่อมี keyword นำหน้า
- ชื่อบุคคลที่มีคำนำหน้า
- ชื่อ-นามสกุลเมื่อมี label ชัดเจน
- ข้อมูลสุขภาพ
- HN / AN / รหัสผู้ป่วย
- วันเดือนปีเกิดเมื่อมี label ชัดเจน
- ที่อยู่เมื่อมี label ชัดเจน
- ทะเบียนรถเมื่อมี label ชัดเจน
- password / API key / secret / token / bearer
- ข้อมูลชั้นความลับของราชการ
- Private key
- ชุดตัวเลขยาวผิดปกติที่ยังคงเหลือหลัง sanitize

## พฤติกรรมที่ต้องได้

| กรณี | ผลที่คาดหวัง |
|---|---|
| คำถามราชการทั่วไป ไม่มี PII | ส่ง query ไป external search ได้ |
| พบ PII ที่ rule ปกปิดได้ | ส่งเฉพาะ safeQuery หลัง redact |
| พบข้อมูลลับของราชการ | Block external search |
| พบ password/API key/token | Block external search |
| พบ Private key | Block external search |
| หลัง sanitize ยังพบ ID/phone/email/credential/เลขยาวผิดปกติ | Block external search |
| query หลัง redact สั้นมาก | ใช้ fallback query ที่ไม่มีข้อมูลต้นฉบับ |

## ตัวอย่าง test corpus

1. `ช่วยตรวจระเบียบค่าเดินทาง` → allow
2. `เลขบัตร 1234567890123 ขอเช็กสิทธิ` → redact ID
3. `เลขบัตร 1-2345-67890-12-3 ขอเช็กสิทธิ` → redact ID
4. `โทร 081-234-5678 เรื่องค่าเดินทาง` → redact phone
5. `อีเมล somchai@example.com` → redact email
6. `เลขบัญชี 123-4-56789-0` → redact bank account
7. `นายสมชาย ใจดี ขอหารือวินัย` → redact named person
8. `HN: 12345678 ผลตรวจ: ...` → redact patient/health data
9. `วันเดือนปีเกิด 1 มกราคม 2520` → redact date of birth
10. `ที่อยู่ 99 หมู่ 1 ตำบล...` → redact address
11. `ทะเบียนรถ กข 1234` → redact vehicle plate
12. `api key: sk-example` → block
13. `password: example-password` → block
14. `ชั้นความลับ: ลับที่สุด` → block
15. `-----BEGIN PRIVATE KEY-----` → block

## ข้อจำกัดที่ยังต้องทดสอบต่อ

การทดสอบรอบนี้เป็นการตรวจ logic/rules และโค้ดที่ติดตั้งใน repository ยัง **ไม่ถือเป็นการยืนยัน network traffic จริง** ของ browser หรือ Cloudflare Worker

ก่อน Public Pilot ยังต้องทำอย่างน้อย:

1. เปิด DevTools/Network และยืนยันว่าเคส blocked ไม่มี request ไป `/api/official-search`
2. ตรวจ request payload จริงสำหรับเคส redact ว่ามีเฉพาะ `safeQuery`
3. ตรวจ Worker source/config ว่าไม่ log full query โดยไม่จำเป็น
4. ทดสอบ false positive/false negative ด้วยข้อความภาษาไทยจริงจำนวนมาก
5. ทดสอบชื่อไฟล์ที่มี PII และการ copy prompt ไป Clipboard

## เกณฑ์สถานะ

- Privacy Guard logic: **ปรับปรุงแล้ว / พร้อมทดสอบภายใน**
- Browser network verification: **ยังไม่ยืนยัน**
- Worker logging/retention/security: **ยังไม่ยืนยัน**
- Public Pilot: **ยังไม่แนะนำ**
