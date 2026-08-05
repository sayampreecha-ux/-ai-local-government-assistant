# Checklist เปิดระบบด้วย Vercel Drop

## A. Supabase
- [ ] สร้าง Project แล้ว
- [ ] รัน `supabase/setup.sql` สำเร็จ
- [ ] ตาราง `packages`, `orders`, `access_codes`, `usage_logs` มีอยู่
- [ ] Bucket `payment-proofs` เป็น Private

## B. Vercel
- [ ] อัปโหลด ZIP ผ่าน Vercel Drop
- [ ] ตั้ง Environment Variables ครบ
- [ ] Redeploy หลังตั้งค่าตัวแปร
- [ ] `/owner-check.html` แสดงฐานข้อมูลพร้อม
- [ ] `/api/packages` โหลด 3 แพ็กเกจ

## C. ทดสอบขาย
- [ ] ส่งคำขอสั่งซื้อทดลอง
- [ ] อัปโหลดหลักฐานทดลอง
- [ ] เข้าหน้า `/admin.html`
- [ ] สร้างรหัสทดสอบ 1 ชุด
- [ ] เข้าระบบสมาชิกด้วยรหัสทดสอบ
- [ ] สร้างผลลัพธ์และดาวน์โหลด Word/PDF
- [ ] ตรวจว่าจำนวนสิทธิ์ถูกหัก
- [ ] ระงับรหัสทดสอบได้

## D. ก่อนโพสต์ขาย
- [ ] เปลี่ยนข้อมูลชำระเงินเป็นข้อมูลจริง
- [ ] OpenAI อยู่โหมด Live
- [ ] ทดลองบนมือถือและคอมพิวเตอร์
- [ ] เก็บ `ADMIN_SECRET` และ `MASTER_ACCESS_CODE` แยกจาก Source
