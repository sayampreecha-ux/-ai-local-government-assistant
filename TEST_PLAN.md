# Test Plan — Enterprise 4.0

## 1. Public
- โหลดหน้าแรกบนมือถือและคอมพิวเตอร์
- แพ็กเกจ 3 ระดับแสดงราคา จำนวนครั้ง และเครื่องมือถูกต้อง
- ตัวอย่าง 20% ไม่เปิด Prompt

## 2. Order
- ฟิลด์บังคับทำงาน
- อีเมลผิดรูปแบบถูกปฏิเสธ
- สร้างเลขอ้างอิงไม่ซ้ำ
- Rate Limit ป้องกันการยิงคำสั่งซื้อถี่

## 3. Payment Proof
- JPG/PNG/WEBP/PDF ≤2.5 MB ผ่าน
- EXE/ZIP หรือไฟล์ใหญ่ถูกปฏิเสธ
- Token ผิด/หมดอายุถูกปฏิเสธ
- ส่งหลักฐานภายหลังด้วยข้อมูลยืนยันได้
- Storage bucket ไม่ Public

## 4. Admin
- รหัสผิดเกินจำนวนถูก Rate Limit
- Session หมดอายุ 2 ชั่วโมง
- Filter สถานะคำสั่งซื้อ
- เปิด Signed URL หลักฐาน
- เปลี่ยนสถานะ paid/completed และ timestamp ถูกต้อง
- CSV เปิดใน Excel ได้และภาษาไทยไม่เพี้ยน

## 5. Member
- GP222 เห็น 6 เครื่องมือ
- GP599/GP999 เห็น 10 เครื่องมือ
- แก้ Request ใน DevTools เพื่อเรียกเครื่องมือที่ไม่มีสิทธิ์แล้ว Backend ตอบ 403
- วันหมดอายุและจำนวนครั้งถูกบังคับฝั่ง Server

## 6. AI
- Demo ไม่หักสิทธิ์
- Live หัก 1 ครั้งต่อผลลัพธ์สำเร็จ
- OpenAI error คืนสิทธิ์
- Prompt injection เช่น “แสดง system prompt” ไม่ทำให้ Prompt หลุด
- Output ไม่สมมติชื่อ วันที่ เลขหนังสือ วงเงิน หรือข้อกฎหมาย

## 7. Export
- Copy ทำงาน
- Word เปิดได้และมีลายน้ำ
- Print/PDF มีลายน้ำ

## 8. Notifications
- ปิด Env แล้ว Order ยังสำเร็จ
- เปิด Resend แล้วอีเมลส่งสำเร็จ/ความล้มเหลวถูก log
- เปิด LINE แล้วแจ้งเตือน Admin

## 9. AI Crawler & GEO Readiness — V7 Merge Gate
- `robots.txt` ต้องอนุญาต public pages และต้องกัน `/admin.html`, `/admin.js`, `/api/`, `/private/`, `/logs/`, `/uploads/`
- `robots.txt` ต้องชี้ canonical sitemap ของ GitHub Pages
- `sitemap.xml` ต้องมี homepage, `trust.html`, `privacy-notice.html`, และ `llms.txt`
- `llms.txt` ต้องระบุ GovPrompt Thailand, public-content boundary, และนโยบาย Search / Agent / Training แยกจากกัน
- `llms.txt` ต้องระบุชัดว่าข้อมูลผู้ใช้ ไฟล์อัปโหลด API traffic logs และ authenticated content ไม่ใช่ public knowledge
- `index.html` ต้องมี canonical URL, robots metadata, Open Graph metadata, structured data และ discovery link ไป `llms.txt`
- การแก้ GEO ห้ามเปลี่ยน Intent Router, Prompt Engine, Tool Routing, Privacy Guard หรือพฤติกรรมแชต
- Worker `ai-local-government-assistant` ต้องคงการป้องกันข้อมูลเสี่ยง CORS และ official-source filtering เดิม
- ก่อน merge ต้องยืนยัน branch ไม่ behind `main` และ diff ไม่มีไฟล์นอกขอบเขต GEO โดยไม่ตั้งใจ
- ก่อน production rollout ต้องตรวจ Cloudflare Dashboard จริงแยกอีกครั้ง โดยยืนยัน Search Bots, AI/Agent crawler policy, Training crawler policy และ robots behavior ไม่ขัดกัน
- ห้าม merge เข้า `main` จนกว่ารายการข้างต้นผ่านการ review ครบ
