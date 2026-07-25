# Security Notes

- Prompt หลักและ OpenAI Key อยู่ใน Server Functions เท่านั้น
- Access Code เก็บเป็น SHA-256 hash ไม่เก็บรหัสเต็ม
- Member/Admin/Payment Proof ใช้ Session แยกชนิดและมีวันหมดอายุ
- Supabase Secret key ห้ามส่งลง Browser
- Storage bucket หลักฐานการชำระเงินเป็น Private และอ่านผ่าน Signed URL ชั่วคราว
- จำกัดไฟล์ 2.5 MB และ MIME type
- Rate Limit ใช้ IP hash ไม่เก็บ IP ดิบ
- ไม่บันทึกเนื้อหางานหรือผล AI ฉบับเต็ม
- Audit log เก็บเฉพาะกิจกรรมระบบและ metadata
- CSP, HSTS, X-Frame-Options, noindex Admin/API

## Incident Response

1. ระงับรหัสที่สงสัย
2. หมุน ADMIN_SECRET, SESSION_SECRET และ API Keys
3. ตรวจ `audit_logs`, `notification_logs`, Vercel Logs และ Supabase Logs
4. ลบหลักฐานหรือข้อมูลที่ไม่จำเป็นตามนโยบายเก็บรักษา
5. แจ้งผู้ได้รับผลกระทบเมื่อกฎหมายหรือความเสี่ยงกำหนด
