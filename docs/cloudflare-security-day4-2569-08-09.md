# GovPrompt Thailand — Day 4 Cloudflare Operational Security

สถานะ: Internal Pilot
วันที่: 9 สิงหาคม 2569

## สิ่งที่ปรับใน repository

1. ประกาศ `TAVILY_API_KEY` เป็น required secret ใน `wrangler.jsonc`
2. เพิ่ม Cloudflare Workers Rate Limiting binding ชื่อ `OFFICIAL_SEARCH_RATE_LIMITER`
   - namespace_id: `7001`
   - limit: 60 requests
   - period: 60 seconds
3. Worker ตรวจ rate limit ก่อนอ่าน/ส่ง query ไป Tavily
4. เมื่อเกิน limit ตอบ `429 RATE_LIMITED` พร้อม `Retry-After: 60`
5. หาก rate-limit binding มีข้อผิดพลาดใน production logic จะ fail closed สำหรับการตรวจ limit
6. ลด Workers Observability sampling จาก default 100% เหลือ 5%
7. Application logs ยังคงออกแบบให้เก็บ metadata เท่านั้น ไม่ log query text หรือ secret
8. เพิ่ม automated verification สำหรับ CORS, PII blocking, rate limiting, secret non-echo และ Tavily data minimization

## เหตุผล

- ลดปริมาณ persisted logs โดยยังเหลือข้อมูลเพียงพอสำหรับ incident/debug sampling
- ลดการ abuse API และค่าใช้จ่าย upstream search provider
- ป้องกัน deployment ที่ลืมตั้ง `TAVILY_API_KEY`
- รักษาหลัก data minimization และ defense in depth

## สิ่งที่ยังต้องยืนยันจาก Cloudflare Dashboard/Deployment

Repository อย่างเดียวไม่สามารถยืนยันค่าฝั่ง account/runtime ได้ จึงต้องตรวจหลัง deploy:

- `TAVILY_API_KEY` ถูกตั้งเป็น Secret จริง ไม่ใช่ plaintext variable
- Worker deployment ใช้ config ล่าสุด
- Rate Limiting binding ถูก provision สำเร็จ
- Workers Logs retention ตาม plan/account ปัจจุบัน
- ไม่มี Logpush/Tail Worker/third-party observability integration ที่ส่ง log ออกไปโดยไม่ได้ตั้งใจ
- ตรวจ production endpoint ว่า `429`, `403`, `422` ทำงานตาม test
- ตรวจ Network ว่า request ไป upstream มีเฉพาะ safe query และ official-domain filters

## เกณฑ์ Day 4

**Code/config: PASS**

**Production runtime/dashboard: PENDING VERIFICATION**

จนกว่าจะตรวจ production runtime ครบ ให้คงสถานะ Internal Pilot และห้ามใช้ข้อมูลลับหรือข้อมูลส่วนบุคคลจริงที่ไม่จำเป็น
