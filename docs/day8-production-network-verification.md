# Day 8 — Production / Network Verification

วันที่: 9 สิงหาคม 2569
สถานะโครงการ: Internal Pilot

## เป้าหมาย
ยืนยันว่า surface ที่ผู้ใช้เข้าถึงจริงบน GitHub Pages และ Cloudflare Worker ตรงกับ security controls ใน source code ล่าสุด และช่วยตรวจ regression หลัง deploy โดยอัตโนมัติ

## สิ่งที่เพิ่ม
1. `scripts/verify-frontend-production.mjs`
   - ตรวจว่า production frontend ใช้ HTTPS
   - ตรวจว่ามีข้อความ Internal Pilot
   - ตรวจว่าโหลด Privacy Guard v1.2.0
   - ตรวจลิงก์ Facebook `GovPromptThailandAI`
   - ตรวจว่ามีหน้า Trust/Transparency และข้อความด้าน data minimization / third-party search disclosure

2. `.github/workflows/verify-production-surface.yml`
   - รันอัตโนมัติเมื่อไฟล์ production surface สำคัญเปลี่ยน
   - รอ 45 วินาทีให้ deployment propagate
   - ตรวจ GitHub Pages จริง
   - ตรวจ Cloudflare Worker จริงด้วย `verify-production-security.mjs`
   - สามารถกด `workflow_dispatch` เพื่อตรวจซ้ำแบบ manual ได้

3. เพิ่มคำสั่ง `npm run test:production:surface`
   - ใช้ตรวจ frontend production และ Worker production ในคำสั่งเดียว

## สิ่งที่ production Worker verification ตรวจอยู่แล้ว
- CORS / origin gate
- Security policy header
- no-store / nosniff / CSP
- PII query ถูก block
- raw query ไม่ถูก echo กลับ
- safe search ทำงาน
- ผลลัพธ์เป็น primary-source tier

## ข้อจำกัดของการตรวจครั้งนี้
สภาพแวดล้อมที่ใช้ช่วยพัฒนาในรอบนี้ไม่สามารถ resolve DNS ไปยัง GitHub Pages/Workers ภายนอกได้ จึงไม่อ้างว่า network test จากสภาพแวดล้อมนี้ผ่านแล้ว การยืนยัน production จริงถูกย้ายไปให้ GitHub Actions เป็นผู้รันจากเครือข่ายภายนอกแทน

## เกณฑ์ PASS
Day 8 จะถือว่า PASS เมื่อ workflow `Verify Production Surface` แสดงผลสำเร็จครบทั้งสองขั้น:
- Verify GitHub Pages production surface
- Verify Cloudflare Worker production security

หาก workflow fail ให้ถือสถานะ Public Pilot เป็น HOLD ต่อไป และแก้สาเหตุก่อน deploy/เปิดวงกว้าง

## สถานะปัจจุบัน
**AUTOMATED VERIFICATION READY — รอผล production workflow**

ยังคงคำวินิจฉัยเดิม:
- Internal Pilot: GO ภายใต้ข้อจำกัด
- Public Pilot: HOLD จนกว่า production/network verification และ Cloudflare Dashboard review จะผ่าน

เอกสารนี้เป็น technical verification record ไม่ใช่การรับรองความปลอดภัยหรือการรับรองทางกฎหมาย 100%
