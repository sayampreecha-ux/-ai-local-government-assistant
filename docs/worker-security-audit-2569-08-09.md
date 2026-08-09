# GovPrompt Thailand — Day 3 Worker Security Audit

วันที่: 9 สิงหาคม 2569
สถานะ: Internal Pilot
ขอบเขต: `src/search-worker.js`, `wrangler.jsonc`, live search integration

## สรุป

Cloudflare Worker ใช้เป็นตัวกลางสำหรับ `/api/official-search` และส่งคำค้นต่อไปยัง Tavily เพื่อค้นเฉพาะโดเมนราชการที่กำหนดไว้

จากการตรวจพบว่า application log เดิมไม่ได้บันทึกข้อความคำค้นโดยตรง แต่บันทึก metadata เช่น request ID, query length, site count, result count และ duration ซึ่งเป็นแนวทางที่ลดความเสี่ยงกว่าการ log full prompt

อย่างไรก็ตามก่อนการปรับ Day 3 ยังขาด server-side DLP check, request size guard และ origin rejection ที่ชัดเจน จึงได้เพิ่มมาตรการ defense in depth แล้ว

## Data Flow ฝั่ง Worker

```text
GitHub Pages browser
  -> Privacy Guard (browser)
  -> Cloudflare Worker /api/official-search
       -> validate method/origin/request size
       -> parse + normalize query
       -> server-side sensitive-data detection
       -> if risky: 422 SENSITIVE_QUERY_BLOCKED
       -> if allowed: Tavily Search API
            -> official domains only
       -> normalize/filter official results
       -> response without echoing query
```

## มาตรการที่มีแล้ว

- CORS allow origin จำกัดไว้ที่ `https://sayampreecha-ux.github.io`
- POST/OPTIONS only สำหรับ search endpoint
- `cache-control: no-store`
- `pragma: no-cache`
- `x-content-type-options: nosniff`
- `x-frame-options: DENY`
- `referrer-policy: no-referrer`
- จำกัด query ที่ 400 ตัวอักษร
- จำกัดจำนวน result สูงสุด 20
- จำกัด official domains ด้วย allowlist
- ไม่ใช้ `include_answer`
- ไม่ใช้ `include_raw_content`
- API key อ่านจาก `env.TAVILY_API_KEY` และไม่ส่งคืน client
- application log ไม่เก็บ full query
- เพิ่ม server-side detection สำหรับข้อมูลเสี่ยงความเชื่อมั่นสูง เช่น เลขบัตร 13 หลัก, อีเมล, โทรศัพท์, บัญชี/พร้อมเพย์, password/API key/token/secret, private key, ข้อมูลชั้นความลับ, HN/AN
- หากพบข้อมูลเสี่ยงให้ตอบ `422 SENSITIVE_QUERY_BLOCKED` และไม่เรียก Tavily
- ไม่ echo query กลับใน JSON response
- เพิ่ม request size guard 16 KiB
- เพิ่ม origin rejection สำหรับ origin ที่ไม่ตรง frontend

## Logging / Retention

โค้ด application ปัจจุบัน log เฉพาะ metadata และ error code ไม่ log full query

`wrangler.jsonc` เปิด `observability.enabled = true` ดังนั้น Cloudflare platform observability ยังทำงานอยู่ ต้องตรวจ retention และ access policy ใน Cloudflare dashboard เพิ่มเติม เพราะข้อมูลส่วนนี้ไม่สามารถสรุปจาก source repository เพียงอย่างเดียวได้

## External Processor / Search Provider

Worker ส่งคำค้นที่ผ่าน browser Privacy Guard และ server-side validation ต่อไปยัง Tavily Search API

ดังนั้น Tavily เป็น external service ใน data flow ของ live search และต้องถูกระบุใน transparency/privacy documentation ของโครงการ

## สิ่งที่ยังไม่ถือว่าผ่าน Public Pilot

1. ยังไม่มีหลักฐานจาก Cloudflare dashboard เรื่อง log retention / access controls
2. ยังไม่ได้ตรวจ Network traffic จริงบน production browser ทุก module
3. ยังไม่มี Cloudflare rate limiting rule / WAF rule ที่ยืนยันจาก deployment configuration
4. Origin checking ไม่ใช่ authentication และสามารถ spoof ได้จาก non-browser client
5. ยังต้องพิจารณา abuse protection เช่น rate limit, bot protection หรือ Turnstile ตามรูปแบบการเปิดใช้จริง
6. ต้องตรวจ secret management ใน Cloudflare dashboard ว่า `TAVILY_API_KEY` ถูกเก็บเป็น secret และไม่มี plaintext ใน repository

## สถานะความเสี่ยงหลัง Day 3

- Browser privacy filtering: ดีขึ้น
- Worker defense in depth: ดีขึ้น
- Application logging minimization: ผ่านในระดับ source-code review
- External provider transparency: เพิ่มแล้ว
- Rate limiting / WAF: ยังต้องทำ
- Production network verification: ยังต้องทำ
- Cloudflare retention/access audit: ยังต้องทำ

**ข้อสรุป:** ใช้ต่อใน Internal Pilot ได้ภายใต้ข้อจำกัดเดิม แต่ยังไม่ควรรับข้อมูลลับหรือข้อมูลส่วนบุคคลจริงที่ไม่จำเป็น และยังไม่ควรประกาศว่า Public Production พร้อมเต็มรูปแบบจนกว่าจะผ่าน Day 4–5 security controls และ production verification
