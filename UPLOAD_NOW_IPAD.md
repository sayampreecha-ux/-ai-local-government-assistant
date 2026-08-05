# อัปโหลด GovPrompt Thailand 4.2 ด้วย iPad

1. ดาวน์โหลดไฟล์ `govprompt-thailand-vercel-drop-v4.2.zip`
2. เปิด Safari ไปที่ `https://vercel.com/drop`
3. แตะเลือกไฟล์ แล้วเลือก ZIP จากแอป Files
4. ตั้งชื่อโครงการ เช่น `govprompt-thailand`
5. กด Deploy
6. เมื่อได้ลิงก์ ให้เปิด `/setup.html`
7. ระหว่างติดตั้ง ให้คง `SALES_ENABLED=false`
8. ตั้ง Supabase และข้อมูลรับชำระเงินให้ครบ
9. เมื่อ `/setup.html` แสดง “พร้อมขายจริง” จึงตั้ง `SALES_ENABLED=true` และ Redeploy

ข้อสำคัญ: ห้ามอัปโหลดไฟล์ Owner Secrets หรือไฟล์ `.env` ที่มีค่าจริงรวมกับ Source
