# Day 10 — Cloudflare Dashboard Manual Verification

วันที่: 9 สิงหาคม 2569
สถานะ: Internal Pilot

## เป้าหมาย
ยืนยันสิ่งที่ GitHub source code และ automated production tests ตรวจไม่ได้ ได้แก่ค่าจริงใน Cloudflare Dashboard, ผู้มีสิทธิ์, secret, logging/retention และ deployment bindings ก่อนพิจารณา Public Pilot

## สิ่งที่ยืนยันแล้วจากระบบอัตโนมัติ
- GitHub Pages production verification ผ่าน
- Cloudflare Worker production security verification ผ่าน
- Production endpoint บังคับ CORS/origin, block PII ที่มีความเชื่อมั่นสูง, ไม่ echo raw query และใช้ security headers ตาม policy version ปัจจุบัน
- Source config กำหนด TAVILY_API_KEY เป็น required secret
- Source config กำหนด rate limit 60 requests ต่อ 60 วินาที
- invocation logs ปิด, traces ปิด, custom logs sampling 5%

## สิ่งที่ต้องตรวจด้วย Dashboard จริง

### A. Variables & Secrets
Cloudflare Dashboard → Workers & Pages → `ai-local-government-assistant` → Settings → Variables and Secrets

- [ ] มี `TAVILY_API_KEY` และแสดงเป็น Secret/Encrypted value
- [ ] ไม่มี plaintext variable ชื่อซ้ำหรือ key เก่าที่ไม่ได้ใช้งาน
- [ ] ไม่มี secret อื่นที่ไม่ทราบที่มา
- [ ] มีแผน rotate/revoke key เมื่อสงสัยว่ารั่ว

### B. Deployments
Workers & Pages → Deployments

- [ ] deployment ล่าสุดเป็นรุ่นหลัง security hardening
- [ ] endpoint production ตรงกับ Worker `ai-local-government-assistant`
- [ ] ไม่มี deployment/branch เก่าที่เปิด public โดยไม่จำเป็น

### C. Observability / Logs
Workers & Pages → Observability → Logs

- [ ] invocation logs ปิด
- [ ] traces ปิด
- [ ] sampling ของ custom logs ไม่เกินค่าที่กำหนดใน config ปัจจุบัน
- [ ] ตรวจ sample log แล้วไม่พบข้อความ query เต็ม, เลขบัตร, เบอร์โทร, email, HN/AN, token หรือข้อมูลสุขภาพ
- [ ] ไม่มี Logpush / OpenTelemetry / external destination ที่ไม่ทราบที่มา
- [ ] retention เป็นค่าที่เหมาะสมและไม่เก็บนานเกินความจำเป็น

### D. Rate Limit / Bindings
Workers & Pages → Settings / Bindings

- [ ] `OFFICIAL_SEARCH_RATE_LIMITER` มีอยู่จริง
- [ ] binding ทำงานกับ production Worker
- [ ] การทดสอบ production security ที่ผ่านล่าสุดไม่รายงาน rate limiter unavailable

### E. Account Security / Access
Cloudflare Account → Members / API Tokens / Security

- [ ] เปิด MFA/2FA สำหรับบัญชีที่มีสิทธิ์ deploy/configure
- [ ] ตรวจสมาชิกบัญชีและถอนสิทธิ์ผู้ที่ไม่จำเป็น
- [ ] `CLOUDFLARE_API_TOKEN` ที่ใช้ GitHub Actions ให้สิทธิ์เท่าที่ต้องใช้ deploy Worker เท่านั้น
- [ ] ไม่มี Global API Key อยู่ใน workflow หรือ repository
- [ ] หากมี token เก่าที่ไม่ได้ใช้ ให้ revoke

### F. Routes / Domains
Workers & Pages → Domains & Routes

- [ ] ไม่มี custom domain/route อื่นผูก Worker โดยไม่จำเป็น
- [ ] production endpoint ที่ใช้งานจริงเป็น endpoint ที่โครงการประกาศไว้

## วิธีบันทึกหลักฐาน
เพื่อไม่ให้เก็บ secret หรือข้อมูลอ่อนไหวใน GitHub ให้บันทึกเพียงผล PASS/FAIL และวันที่ตรวจ ห้าม capture หรือ commit ค่า API key/token จริง

ตัวอย่าง:
- TAVILY_API_KEY secret: PASS — verified 2569-08-09
- invocation logs off: PASS — verified 2569-08-09
- MFA: PASS — verified 2569-08-09

## Gate
Day 10 จะเป็น PASS เมื่อ A–F ไม่มีรายการเสี่ยงค้าง โดยเฉพาะ Secret, Logs, MFA, least-privilege token และ production bindings

จนกว่าจะครบ: **Internal Pilot = GO / Public Pilot = HOLD**

เอกสารนี้เป็น operational security checklist ไม่ใช่การรับรองทางกฎหมายหรือความปลอดภัย 100%
