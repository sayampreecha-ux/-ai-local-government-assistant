# GovPrompt Thailand — Day 4 Cloudflare Security Baseline

วันที่: 9 สิงหาคม 2569
สถานะ: Internal Pilot

## สิ่งที่ตรวจจาก repository ได้

### 1) Secret management
- Worker ประกาศ secret ที่จำเป็นเป็น `TAVILY_API_KEY` ผ่าน `secrets.required`
- ไม่พบการ hard-code ค่า Tavily API key ใน source ที่ตรวจ
- workflow deploy ใช้ Cloudflare credentials ผ่าน GitHub Actions secrets ตามสัญญาการทดสอบใน repository

> หมายเหตุ: repository ยืนยันได้เพียงชื่อ secret/วิธีอ้างอิง ไม่สามารถยืนยันค่า secret จริงใน Cloudflare Dashboard หรือประวัติการ rotate key ได้

### 2) Rate limiting
- มี binding `OFFICIAL_SEARCH_RATE_LIMITER`
- namespace: `7001`
- กำหนด 60 requests ต่อ 60 วินาทีสำหรับ class ของ public official-search route
- Worker คืน HTTP 429 เมื่อ limiter ปฏิเสธ request

### 3) Observability / logging
ปรับ configuration ให้ลดข้อมูล telemetry ที่เก็บโดยไม่จำเป็น:
- Workers Logs เปิดไว้เพื่อ incident/debugging
- ปิด invocation logs (`invocation_logs: false`)
- เก็บ custom logs เพียง 5% (`head_sampling_rate: 0.05`)
- custom application logs ถูกออกแบบให้บันทึก metadata เช่น requestId, event, queryLength, siteCount, duration และ status เท่านั้น ไม่บันทึกข้อความ query เต็ม
- ปิด traces ในช่วง Internal Pilot

เหตุผล: รักษาความสามารถในการตรวจเหตุผิดปกติ แต่ลดการเก็บ request metadata ที่ไม่จำเป็น

### 4) Data minimization ฝั่ง Worker
- request body จำกัด 16 KB
- POST/OPTIONS เท่านั้น
- CORS จำกัด origin ของหน้า GovPrompt
- server-side sensitive data detector block ข้อมูลเสี่ยงสูงก่อนเรียก Tavily
- response ไม่ echo query ต้นฉบับกลับ
- Tavily request ตั้ง `include_answer: false` และ `include_raw_content: false`

## สิ่งที่ยังต้องยืนยันใน Cloudflare Dashboard

รายการต่อไปนี้ไม่สามารถยืนยันจาก GitHub repository เพียงอย่างเดียว:

1. `TAVILY_API_KEY` ถูกตั้งเป็น Worker secret จริงและไม่มี plaintext variable ซ้ำ
2. วันที่สร้าง/rotate secret และผู้ที่มีสิทธิ์แก้ไข Worker
3. deployment ล่าสุดใช้ commit/config ชุดปัจจุบันจริง
4. Workers Logs ไม่มีข้อความ query หรือข้อมูลส่วนบุคคลจาก deployment รุ่นเก่าที่ยังอยู่ใน retention window
5. ไม่มี Logpush / OpenTelemetry destination ภายนอกที่ไม่ได้ตั้งใจ
6. ไม่มี route/domain อื่นผูก Worker โดยไม่จำเป็น
7. Account/API token ใช้ least privilege และมี 2FA/MFA ตามนโยบายบัญชี

## Cloudflare Dashboard Verification Checklist

ให้ผู้ดูแลเปิด Cloudflare Dashboard และตรวจทีละข้อ:

- Workers & Pages → `ai-local-government-assistant`
- Settings / Variables and Secrets → ยืนยัน `TAVILY_API_KEY` เป็น Secret
- Observability → Logs → ตรวจตัวอย่าง log ว่าไม่มี full query, เลขบัตร, เบอร์โทร, email, token หรือข้อมูลสุขภาพ
- Observability → ตรวจว่าไม่มี destination/export ที่ไม่รู้จัก
- Deployments → ยืนยัน deployment ล่าสุดหลัง security commits
- Account/API Tokens → ตรวจ scope ให้เท่าที่จำเป็นสำหรับ deploy Worker
- เปิด MFA/2FA สำหรับบัญชีที่มีสิทธิ์ deploy/configure

## Gate ก่อน Public Pilot

GovPrompt ยังไม่ควรรับข้อมูลลับหรือข้อมูลส่วนบุคคลจริงที่ไม่จำเป็นจนกว่าจะมีหลักฐาน PASS ต่อไปนี้:

- [ ] Cloudflare secret verified
- [ ] Current deployment verified
- [ ] Log sample inspected and contains no raw query/PII
- [ ] No unintended log export destination
- [ ] Rate-limit binding confirmed in production
- [ ] Production security test passes
- [ ] API token least-privilege review completed

เมื่อครบทั้งหมดจึงเปลี่ยน Day 4 จาก `PARTIAL PASS` เป็น `PASS` ได้

## สถานะ Day 4

**PARTIAL PASS — configuration ใน source ถูก harden แล้ว แต่ Dashboard controls ยังต้องตรวจจากบัญชี Cloudflare จริง**
