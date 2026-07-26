# GovPrompt Thailand Enterprise 4.0 — Release Notes

วันที่จัดทำ: 22 กรกฎาคม 2569

## สถานะ

- Source พร้อมนำขึ้น Vercel และเชื่อม Supabase
- ผ่าน JavaScript syntax check
- ผ่าน Unit Tests 11/11
- ผ่าน Deployment Preflight
- ไม่รวม Secret หรือ API Key จริงใน Source
- ยังไม่ได้ Deploy ออนไลน์ เพราะต้องตั้งค่า Supabase และ Environment Variables ในบัญชีเจ้าของระบบ

## ฟังก์ชันเด่น

- แพ็กเกจ 222 / 599 / 999 บาท
- รหัสใช้งานเฉพาะบุคคล จำกัดเครื่องมือ จำนวนครั้ง และวันหมดอายุ
- แบบฟอร์มสั่งซื้อและอัปโหลดหลักฐานชำระเงินแบบ Private
- Dashboard ผู้ดูแล พร้อมออกสิทธิ์ ตรวจหลักฐาน และส่งออก CSV
- Prompt และ API Key อยู่ฝั่ง Server
- Word/PDF พร้อมลายน้ำ
- อีเมลผ่าน Resend และแจ้งผู้ดูแลผ่าน LINE Messaging API แบบเลือกเปิดใช้
- Audit log, rate limit, RLS และ Security Headers

## เริ่มติดตั้ง

1. อ่าน `GO_LIVE_NEXT.md`
2. รัน `supabase/setup.sql` ใน Supabase SQL Editor
3. ตั้ง Environment Variables ตาม `.env.example` บน Vercel
4. Deploy และตรวจ `/api/health`
5. ทดสอบตาม `TEST_PLAN.md`
