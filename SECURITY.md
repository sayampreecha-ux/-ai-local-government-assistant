# Security Policy — GovPrompt Thailand

สถานะโครงการ: **Internal Pilot / ทดลองใช้ภายใน**

GovPrompt Thailand ให้ความสำคัญกับ Privacy by Design, Security by Design, Data Minimization และ Human Review โดยระบบยังอยู่ระหว่างการพัฒนาและทดสอบ ไม่ใช่ระบบราชการทางการหรือช่องทางเก็บข้อมูลลับ/ข้อมูลส่วนบุคคลของหน่วยงาน

## สถาปัตยกรรมที่เกี่ยวข้องกับความปลอดภัย

- หน้าเว็บหลักเผยแพร่ผ่าน GitHub Pages และประมวลผล routing / prompt preparation ใน browser
- live official search ส่งคำค้นที่ผ่าน Privacy Guard ไปยัง Cloudflare Worker ของโครงการ
- Worker ตรวจข้อมูลเสี่ยงซ้ำ จำกัด origin / request size / rate และส่งคำค้นที่ผ่านการตรวจต่อไปยัง Tavily เพื่อค้นเฉพาะโดเมนราชการที่ allowlist ไว้
- API key ของผู้ให้บริการค้นต้องอยู่ใน Cloudflare Secret และห้ามอยู่ใน source code หรือ repository
- GovPrompt ไม่ควรถูกใช้เป็นที่เก็บเอกสารลับหรือฐานข้อมูลส่วนบุคคล

## ขอบเขตที่ให้ความสำคัญ

- การรั่วไหลของข้อมูลส่วนบุคคลหรือข้อมูลลับ
- การข้าม Privacy Guard / server-side sensitive-data block
- การเข้าถึงหรือ abuse API เกินขอบเขต
- การเปิดเผย API key, token, secret หรือ credential
- XSS, injection, dependency vulnerability หรือ supply-chain risk
- การเก็บ log, cache หรือ telemetry เกินความจำเป็น
- การส่งข้อมูลไป third-party service โดยไม่ตั้งใจ

## มาตรการขั้นต่ำของระบบปัจจุบัน

- HTTPS สำหรับ GitHub Pages และ Cloudflare Worker
- Privacy Guard ก่อน external search
- server-side sensitive-data block ที่ Worker
- allowlist แหล่งราชการสำหรับผลค้น
- strict frontend Origin gate สำหรับ API
- request-size limit และ rate limiting
- `Cache-Control: no-store` และ security headers สำหรับ API response
- ไม่ echo raw query กลับใน API response
- application log ไม่บันทึกข้อความ query เต็มโดยตรง
- required secret declaration สำหรับ `TAVILY_API_KEY`
- post-deploy production security verification
- `.env`, `.dev.vars` และไฟล์ secret สำหรับ local development ต้องถูก ignore จาก Git

## การแจ้งช่องโหว่

โปรดรายงานโดยตรงที่อีเมลผู้ดูแลโครงการ: **sayampreecha@gmail.com**

### ห้ามทำ

- ห้ามโพสต์เลขบัตรประชาชน เลขบัญชี ข้อมูลสุขภาพ รหัสผ่าน API key/token หรือข้อมูลลับของราชการลง GitHub Issue สาธารณะ
- ห้ามแนบเอกสารราชการจริงที่มีข้อมูลส่วนบุคคลหรือข้อมูลลับเพื่อสาธิตช่องโหว่
- ห้ามทดสอบด้วยการดึง เปลี่ยนแปลง หรือลบข้อมูลของบุคคลอื่น
- ห้ามทำ load test / denial-of-service ต่อ production endpoint โดยไม่ได้รับอนุญาต

หากจำเป็นต้องยกตัวอย่าง ให้ใช้ข้อมูลจำลองหรือข้อมูลที่ทำ de-identification แล้วเท่านั้น

## ข้อมูลที่ควรระบุในการรายงาน

1. จุดที่พบปัญหา เช่น URL / ฟังก์ชัน / module
2. ขั้นตอนทำให้เกิดปัญหา โดยใช้ข้อมูลจำลอง
3. ผลที่เกิดขึ้นและผลที่คาดหวัง
4. ระดับผลกระทบโดยประมาณ
5. ภาพหน้าจอหรือ log ที่ตัดข้อมูลส่วนบุคคลและ secret ออกแล้ว

## Incident Response Baseline

เมื่อสงสัยว่าเกิดเหตุด้านข้อมูลหรือความปลอดภัย ให้ดำเนินการตามลำดับ:

1. **Contain** — หยุดหรือจำกัดฟังก์ชันที่เกี่ยวข้อง เช่น external search / Worker endpoint หากจำเป็น
2. **Preserve evidence** — เก็บเฉพาะ log/metadata ที่จำเป็น ห้ามคัดลอกข้อมูลส่วนบุคคลเพิ่มโดยไม่จำเป็น
3. **Assess** — ระบุว่าข้อมูลอะไรได้รับผลกระทบ จำนวน/ประเภทเจ้าของข้อมูล ระบบใดเกี่ยวข้อง และมี third party ใดรับข้อมูลไปหรือไม่
4. **Fix** — แก้ root cause, rotate secret/credential ที่เกี่ยวข้อง, เพิ่ม regression test
5. **Notify** — แจ้งผู้ดูแลโครงการ ผู้รับผิดชอบด้านกฎหมาย/PDPA/DPO ของหน่วยงาน (ถ้ามี) และดำเนินการแจ้งเหตุหรือเจ้าของข้อมูลเมื่อเข้าเงื่อนไขตามกฎหมาย/นโยบายที่ใช้บังคับ
6. **Review** — บันทึกเหตุการณ์ บทเรียน และมาตรการป้องกันซ้ำโดยไม่เก็บข้อมูลส่วนบุคคลเกินความจำเป็น

## Production Safety Gates

ก่อนขยายจาก Internal Pilot ไป Public Pilot ต้องอย่างน้อย:

- Privacy Guard ฝั่ง browser ผ่าน test corpus
- server-side sensitive-data block ผ่าน regression tests
- external search ใช้ allowlist ของแหล่งทางการ
- API secret อยู่ใน Cloudflare Secret ไม่อยู่ใน repository
- CORS/origin gate, request-size limit และ rate limit ทำงาน
- response ไม่ echo raw query
- production security verification หลัง deploy ผ่าน
- ตรวจ logging / retention / third-party data flow แล้ว
- มี Privacy Notice และแนวทาง Incident Response ที่เหมาะสมกับการใช้งานจริง

## ข้อจำกัด

มาตรการใน repository ลดความเสี่ยงแต่ไม่ใช่การรับรองว่าไม่มีช่องโหว่หรือรับรองการปฏิบัติตามกฎหมายในทุกกรณี การใช้งานจริงของหน่วยงานต้องพิจารณาบทบาทผู้ควบคุมข้อมูล/ผู้ประมวลผลข้อมูล นโยบายความมั่นคงปลอดภัย และข้อกำหนดของหน่วยงานนั้นเพิ่มเติม

ปรับปรุงล่าสุด: 9 สิงหาคม 2569
