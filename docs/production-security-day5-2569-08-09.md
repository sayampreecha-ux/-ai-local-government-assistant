# Day 5 — Production Verification & Security Gate

วันที่: 9 สิงหาคม 2569
สถานะ: **Code/CI gate implemented — Production run must pass before Public Pilot**

## สิ่งที่เพิ่มในรอบนี้

### 1. Security Policy Version
Worker ส่ง header:

`X-GovPrompt-Security: 2026-08-09.1`

ใช้เป็นหลักฐานว่า production endpoint ได้ deploy security policy รุ่นปัจจุบันจริง ไม่ใช่ตรวจเฉพาะ source code

### 2. Strict Origin Gate
POST / OPTIONS สำหรับ `/api/official-search` ต้องมี Origin:

`https://sayampreecha-ux.github.io`

คำขอที่ไม่มี Origin หรือ Origin อื่นถูกปฏิเสธก่อนอ่าน query

> Origin gate เป็น defense layer ไม่ใช่ authentication และไม่ควรถูกใช้แทน user authentication หากระบบมีบัญชีผู้ใช้ในอนาคต

### 3. Actual Body-size Verification
นอกจากตรวจ `Content-Length` แล้ว Worker อ่าน body และตรวจ byte length จริงอีกครั้ง จำกัดไม่เกิน 16 KiB เพื่อป้องกันกรณีไม่มี/ปลอม Content-Length

### 4. Rate-limit Gate
Worker ใช้ Cloudflare Rate Limiting binding ก่อนอ่าน/ส่งคำค้นไปผู้ให้บริการภายนอก หาก rate-limit backend error จะ fail closed สำหรับ request นั้น

### 5. API Security Headers
API response เพิ่ม/ยืนยัน:

- `Cache-Control: no-store`
- `Pragma: no-cache`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CORS จำกัด frontend origin

### 6. Secret-file Hygiene
`.gitignore` ครอบคลุม:

- `.env`
- `.env.*` ยกเว้น example
- `.dev.vars`
- `.dev.vars.*` ยกเว้น example

เพื่อลดความเสี่ยงการ commit local secret โดยไม่ตั้งใจ

### 7. Pre-deploy Security Test
GitHub Actions ต้องรัน `scripts/verify-live-search-backend.mjs` ก่อน deploy หากไม่ผ่าน workflow ต้องหยุดก่อน production

Test ครอบคลุมอย่างน้อย:

- strict Origin
- CORS preflight
- security-policy header
- body-size limit
- rate-limit rejection
- PII block
- secret block
- no raw-query echo
- official-host allowlist
- Tavily `include_answer=false`
- Tavily `include_raw_content=false`

### 8. Post-deploy Production Verification
หลัง Wrangler deploy workflow ต้องรัน:

1. `scripts/benchmark-production-endpoint.mjs`
2. `scripts/verify-production-security.mjs`

Production security test ตรวจ:

- CORS / preflight
- invalid Origin = 403
- Thai ID marker = 422
- PII ไม่ถูก echo กลับ
- safe query ใช้งานได้
- response ไม่ echo raw query
- security headers ครบ
- `X-GovPrompt-Security` ตรงรุ่นปัจจุบัน

## สถานะการเปิดใช้งาน

### Internal Pilot
ดำเนินการต่อได้โดยใช้ข้อมูลจำลอง/de-identified และห้ามข้อมูลลับหรือข้อมูลส่วนบุคคลจริงที่ไม่จำเป็น

### Public Pilot
ยัง **ไม่ควรประกาศพร้อมใช้แบบสาธารณะ** จนกว่าจะมีหลักฐานว่า post-deploy production security workflow ผ่าน และตรวจ dashboard settings ที่เกี่ยวข้องกับ secret/logging/retention แล้ว

## ข้อจำกัดของการตรวจรอบนี้

เครื่องมือที่ใช้แก้ repository สามารถตรวจ source/config/workflow ได้ แต่ไม่สามารถอ่านผลของ push-triggered GitHub Actions run หรือ Cloudflare Dashboard account settings โดยตรงในรอบนี้ ดังนั้นห้ามบันทึกสถานะว่า production PASS จนกว่าจะเห็นผล workflow จริง

## Next Gate

Day 6: Privacy Notice / Processing Inventory / Third-party disclosure / Retention & deletion policy สำหรับ Internal Pilot
