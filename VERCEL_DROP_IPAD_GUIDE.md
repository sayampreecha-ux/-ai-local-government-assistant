# นำ GovPrompt Thailand ขึ้น Vercel ด้วย iPad โดยไม่ใช้ GitHub

## สิ่งที่ต้องมี

1. บัญชี Vercel
2. ไฟล์ `govprompt-thailand-vercel-drop-v4.1.zip`
3. Supabase Project ที่รัน `supabase/setup.sql` แล้ว
4. ค่าตัวแปรลับตามไฟล์ `.env.example`

## ขั้นตอน Deploy

1. เปิด Safari ไปที่ `https://vercel.com/drop`
2. เข้าสู่ระบบ Vercel
3. แตะพื้นที่อัปโหลด แล้วเลือกไฟล์ ZIP จากแอป Files
4. ตั้งชื่อโครงการ เช่น `govprompt-thailand`
5. กด Deploy และรอจนได้ URL
6. เข้า Vercel Dashboard → Project → Settings → Environment Variables
7. เพิ่มตัวแปรทั้งหมดที่จำเป็น โดยเลือก Production, Preview และ Development
8. กด Redeploy หลังเพิ่มตัวแปร
9. เปิด `https://ชื่อเว็บไซต์/owner-check.html`
10. ตรวจให้ฐานข้อมูล แพ็กเกจ และข้อมูลชำระเงินผ่านก่อนเปิดขาย

## ตัวแปรที่จำเป็น

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `SESSION_SECRET`
- `ADMIN_SESSION_SECRET`
- `ADMIN_SECRET`
- `MASTER_ACCESS_CODE`
- `IP_HASH_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `PAYMENT_ACCOUNT_NAME`
- `PAYMENT_PROMPTPAY_ID` หรือข้อมูลบัญชีธนาคาร

ห้ามใส่ไฟล์รหัสลับลงใน ZIP หรือเผยแพร่ใน GitHub
