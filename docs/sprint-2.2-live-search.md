# GovPrompt v7 Sprint 2.2 — Live Official Search Backend

สถานะ: backend พร้อมสำหรับการเชื่อมผู้ให้บริการค้นเว็บแบบ server-side โดยไม่เปิดเผย API key ที่ frontend

## แนวทาง
- Endpoint: `POST /api/official-search`
- จำกัดผลค้นให้เฉพาะโดเมนราชการที่อยู่ใน allowlist
- ใช้ Primary Source First
- API key อยู่ใน Cloudflare Worker secret `BRAVE_SEARCH_API_KEY` เท่านั้น
- ถ้ายังไม่ได้ตั้งค่า secret ระบบตอบ `SEARCH_PROVIDER_NOT_CONFIGURED`
- Frontend จะ fallback เป็น plan-only โดยไม่อ้างว่าค้นสดแล้ว

## หมายเหตุการใช้งาน
เว็บไซต์ GitHub Pages ปัจจุบันยังไม่มี server runtime ดังนั้น endpoint นี้จะทำงานเมื่อ deploy ผ่าน Cloudflare Worker ตาม `wrangler.jsonc` และตั้งค่า secret แล้วเท่านั้น
