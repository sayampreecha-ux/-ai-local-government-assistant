# Checklist เปิดใช้ GovPrompt Enterprise 4.0

## Source
- [ ] `npm run validate` ผ่าน
- [ ] Repository เป็น Private
- [ ] ไม่มี `.env` หรือ Secret ใน GitHub
- [ ] GitHub Actions ผ่าน

## Supabase
- [ ] Run `supabase/setup.sql`
- [ ] มีตาราง 7 ตารางตาม README
- [ ] มี Storage bucket `payment-proofs` และเป็น Private
- [ ] RLS เปิดทุกตาราง
- [ ] Browser role ไม่มีสิทธิ์อ่านตารางโดยตรง
- [ ] คัดลอก URL และ Secret key ถูกต้อง

## Vercel
- [ ] Import Repository
- [ ] Framework = Other
- [ ] Environment Variables จำเป็นครบ
- [ ] ใส่ข้อมูล PromptPay/บัญชี
- [ ] Deploy สำเร็จ
- [ ] `/api/health` แสดง `version: 4.0.0`, `database: true`
- [ ] `mode: demo` ก่อนตั้ง OpenAI และ `mode: live` หลังตั้ง OpenAI

## สั่งซื้อ/ชำระเงิน
- [ ] โหลดแพ็กเกจ 222/599/999 ได้
- [ ] ส่งคำสั่งซื้อและได้รับ `REQ-...`
- [ ] ข้อมูลชำระเงินแสดงถูกต้อง
- [ ] อัปโหลด JPG/PNG/PDF ไม่เกิน 2.5 MB ได้
- [ ] ไฟล์เกินขนาดหรือชนิดผิดถูกปฏิเสธ
- [ ] Admin เปิดหลักฐานจาก Signed URL ได้
- [ ] Signed URL หมดอายุภายใน 5 นาที

## สิทธิ์
- [ ] ออกรหัสแต่ละแพ็กเกจได้
- [ ] รหัสเต็มแสดงครั้งเดียว
- [ ] คำสั่งซื้อเดิมไม่สามารถออกรหัสซ้ำ
- [ ] Starter เห็นเฉพาะเครื่องมือในแพ็กเกจ
- [ ] Backend ปฏิเสธเครื่องมือที่ไม่มีสิทธิ์
- [ ] ระงับรหัสแล้วเข้าสู่ระบบไม่ได้
- [ ] จำนวนครั้งลดเฉพาะ Live mode
- [ ] AI ล้มเหลวแล้วคืนจำนวนครั้ง

## การแจ้งเตือน (ถ้าเปิดใช้)
- [ ] Resend domain ยืนยันแล้ว
- [ ] ลูกค้าได้รับอีเมลเลขอ้างอิง
- [ ] ลูกค้าได้รับอีเมลรหัสหลังเปิดสิทธิ์
- [ ] LINE Official Account ส่งแจ้งเตือนผู้ดูแลได้

## ความปลอดภัย
- [ ] Session secret แต่ละตัวเป็นคนละค่า
- [ ] Admin secret ไม่ใช่ค่าทดสอบ
- [ ] ตั้ง OpenAI budget/usage alert
- [ ] ตรวจ CSP, HSTS, noindex Admin/API
- [ ] ทดสอบ Rate Limit
- [ ] ไม่กรอกข้อมูลลับหรือข้อมูลอ่อนไหวในการทดสอบ
