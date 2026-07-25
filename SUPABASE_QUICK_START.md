# ตั้งค่า Supabase แบบย่อ

1. สร้าง Project ใหม่ใน Supabase Dashboard
2. เลือก Region ที่ใกล้ผู้ใช้ เช่น Singapore หากมีให้เลือก
3. รอฐานข้อมูลพร้อมใช้งาน
4. ไปที่ SQL Editor → New query
5. เปิดไฟล์ `supabase/setup.sql` คัดลอกทั้งหมด แล้วกด Run
6. ไปที่ Project Settings → API
7. คัดลอก Project URL ไปใส่ `SUPABASE_URL`
8. คัดลอก Secret/Service role key ไปใส่ `SUPABASE_SECRET_KEY` ใน Vercel เท่านั้น
9. ห้ามใส่ Secret key ใน HTML, JavaScript ฝั่งหน้าเว็บ หรือไฟล์ที่เผยแพร่

หลังตั้งค่าเสร็จ เปิด `/owner-check.html` เพื่อตรวจฐานข้อมูลและแพ็กเกจ
