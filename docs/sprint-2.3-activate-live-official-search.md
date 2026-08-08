# GovPrompt v7 Sprint 2.3 — Activate Live Official Search

## เป้าหมาย
เปิดใช้ Official Search จากหน้าใช้งานจริง โดยคงหลัก Primary Source First และไม่อ้างว่าเอกสารเป็นฉบับล่าสุดเพียงเพราะค้นเจอ

## Request flow

User question
→ Official Source Registry
→ `POST /api/official-search`
→ Brave Search (server-side secret only)
→ Official-domain filter
→ Metadata normalization
→ Primary Source ranking
→ Freshness Engine
→ Citation pipeline
→ Prompt handoff

## Freshness gate
ผลค้นจาก search provider เป็นเพียงตัวชี้ไปยังต้นฉบับราชการ ไม่ถือเป็นการยืนยันสถานะการใช้บังคับ

หาก metadata ยังไม่พอยืนยันสถานะปัจจุบัน ระบบต้องแสดง:

> ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง

Secondary source ห้ามเป็นฐานข้อสรุปเมื่อมี Primary Source และ `conclusionEligible` จะเป็น `true` เฉพาะเมื่อ Freshness Engine ยืนยัน current primary evidence แล้วเท่านั้น

## Security boundary
- `BRAVE_SEARCH_API_KEY` อ่านเฉพาะจาก `env.BRAVE_SEARCH_API_KEY` ใน Cloudflare Worker
- frontend ไม่รับ ไม่เก็บ และไม่ส่ง API key
- Worker response ไม่คืน secret
- Worker กรอง `sites` และผลลัพธ์ด้วย official allowlist
- ห้าม hardcode key ใน repository, `wrangler.jsonc`, JavaScript ฝั่ง browser หรือเอกสาร

## Cloudflare secret
สถานะ secret จริงใน Cloudflare account ไม่สามารถยืนยันจาก repository ได้

ก่อน deploy ให้ตั้ง secret ใน Cloudflare Worker environment:

```bash
npx wrangler secret put BRAVE_SEARCH_API_KEY
```

จากนั้นวาง Brave Search API key จริงเมื่อ Wrangler ขอค่า secret ห้ามใส่ key ลง command line, source code หรือ commit

## Pre-deploy gate

```bash
pnpm install --frozen-lockfile
pnpm run check:syntax
pnpm test
pnpm build
```

เมื่อทุกขั้นผ่านจึง deploy:

```bash
pnpm run deploy
```

หลัง deploy ให้ทดสอบ `POST /api/official-search` ผ่าน origin ของ Cloudflare Worker ไม่ใช่ GitHub Pages origin

## Acceptance queries
1. ระเบียบค่าเดินทางล่าสุด
2. หนังสือเวียนกรมบัญชีกลางล่าสุด
3. ระเบียบ/หนังสือสั่งการ สถ. ล่าสุด
4. TOR/พัสดุ
5. คำพิพากษาศาลปกครอง

## Merge gate
ห้าม merge Sprint 2.3 จนกว่า:
- CI test/build/syntax ผ่าน
- Cloudflare Worker มี `BRAVE_SEARCH_API_KEY`
- หน้าใช้งานจริงเรียก `/api/official-search` ได้
- acceptance queries ได้ผลจาก primary official source ตามที่เกี่ยวข้อง
- secret ไม่ปรากฏใน browser bundle, repository หรือ API response
