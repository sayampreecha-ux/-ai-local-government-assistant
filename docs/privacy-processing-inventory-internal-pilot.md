# GovPrompt Thailand — Privacy Processing Inventory (ROPA-lite)

สถานะ: **Internal Pilot / เอกสารทำงานภายใน**
วันที่: 9 สิงหาคม 2569

> เอกสารนี้ใช้เพื่อ map การประมวลผลและเตรียม Privacy Notice / ROPA ไม่ใช่คำรับรองทางกฎหมาย และต้องให้ผู้รับผิดชอบด้านกฎหมาย/PDPA/DPO ตรวจบทบาทและฐานกฎหมายก่อน Public Pilot หรือใช้ข้อมูลส่วนบุคคลจริงในงานหน่วยงาน

## 1. กิจกรรม: เปิดและใช้งานหน้าเว็บไซต์

- จุดเริ่ม: ผู้ใช้เปิด GitHub Pages ของ GovPrompt
- ข้อมูลที่ GovPrompt application ตั้งใจใช้: ไม่ต้องสมัครบัญชีใน flow ปัจจุบัน
- การประมวลผลหลัก: โหลด static HTML/CSS/JavaScript
- ผู้ให้บริการโครงสร้างพื้นฐาน: GitHub Pages
- ข้อมูล platform/network metadata: อาจมีข้อมูลมาตรฐานของการให้บริการเว็บตามระบบของ GitHub ซึ่งอยู่นอก application code ของ GovPrompt
- Retention ของ application: ไม่มีฐานข้อมูลผู้ใช้ในหน้า Home ที่ตรวจ
- ความเสี่ยง: third-party infrastructure metadata
- สถานะ: ต้องอ้าง/ตรวจ privacy terms ของ GitHub ก่อน Public Pilot หากต้องลงรายละเอียดใน Privacy Notice

## 2. กิจกรรม: พิมพ์คำถามใน GovPrompt

- ข้อมูล: ข้อความที่ผู้ใช้พิมพ์
- วัตถุประสงค์: route งาน, สร้าง shared context, เตรียม prompt และค้นแหล่งราชการ
- ที่ประมวลผล: browser ของผู้ใช้
- Persistence ที่พบจากหน้า Home: ใช้ memory/DOM; มีการลบ legacy history key จาก localStorage
- ข้อห้าม: ข้อมูลลับ ข้อมูลส่วนบุคคล/ข้อมูลอ่อนไหวที่ไม่จำเป็น
- Control: Privacy Guard ก่อน external search
- Retention ของ application: ไม่พบการบันทึก full query ใหม่ลงฐานข้อมูลจาก flow หน้า Home ที่ตรวจ

## 3. กิจกรรม: Privacy Guard

- Input: ข้อความคำถามต้นฉบับ
- Output: safeQuery สำหรับ external official search
- ตัวอย่างข้อมูลที่ตรวจ/ปกปิด: เลขบัตรประชาชน, อีเมล, โทรศัพท์, เลขบัญชี/พร้อมเพย์บางรูปแบบ, secret/token, ชื่อบุคคลบางรูปแบบ, ข้อมูลสุขภาพบางรูปแบบ และตัวระบุความเสี่ยงอื่นตาม rule ปัจจุบัน
- Fail-safe: หากพบความเสี่ยงสูง/ยังไม่ปลอดภัย ระบบสามารถหยุด external search
- ข้อจำกัด: regex/rule-based detection ไม่สามารถรับประกันการตรวจข้อมูลส่วนบุคคลได้ 100%

## 4. กิจกรรม: Live Official Search ผ่าน Cloudflare Worker

- ข้อมูลที่ส่งจาก browser: safeQuery + รายการ official domains + จำนวนผลลัพธ์
- Endpoint: Cloudflare Worker ของโครงการ `/api/official-search`
- Server controls:
  - strict frontend Origin gate
  - request size limit
  - rate limiting
  - server-side sensitive-data block
  - official-domain allowlist
  - no raw-query echo ใน response
  - application logs ใช้ metadata ไม่ log query เต็มโดยตรง
- Application log metadata ที่โค้ดอาจบันทึก: request ID, method, query length, site count, requested count, provider status, result count, duration, security policy version
- Secret: `TAVILY_API_KEY` ต้องเป็น Cloudflare Secret
- Cloudflare observability: sampling ถูกลดลง แต่ retention จริงขึ้นอยู่กับ account/plan/config และต้องยืนยันใน Dashboard ก่อน Public Pilot

## 5. กิจกรรม: Tavily Search API

- ข้อมูลที่ส่ง: query ที่ผ่าน browser Privacy Guard และ server-side check, official-domain allowlist, max result count
- Endpoint: Tavily Search API
- การตั้งค่าที่ GovPrompt ใช้:
  - `include_answer: false`
  - `include_raw_content: false`
  - `include_domains`: official domains ที่ระบบกำหนด
- ผลลัพธ์: title, URL, snippet/content summary, metadata ของผลค้น
- Tavily documentation ณ วันที่ตรวจระบุแนวทาง zero data retention; ต้องตรวจ Privacy Policy/terms/account plan ที่ใช้จริงก่อนอาศัยเป็นข้อผูกพันทางกฎหมาย
- Retention/processor role: **ต้องยืนยันก่อน Public Pilot**

## 6. กิจกรรม: ไฟล์แนบ/ภาพในหน้า Home

- Browser รับ File objects จาก file picker/camera
- จาก flow ที่ตรวจ พบการใช้ชื่อไฟล์ใน context/prompt
- ยังไม่พบ automatic upload ของเนื้อหาไฟล์จากหน้า Home ไป Cloudflare Worker
- ความเสี่ยง: ชื่อไฟล์อาจมีชื่อบุคคล เลขเอกสาร หรือ PII
- Control ที่ควรทำต่อ: sanitize/ลดการใช้ชื่อไฟล์ และ network test ทุก attachment path

## 7. กิจกรรม: “เปิดใน ChatGPT” / Copy Prompt

- GovPrompt เปิด `https://chatgpt.com/` และคัดลอก prompt ไป clipboard
- GovPrompt Home ที่ตรวจไม่ได้ส่ง prompt ไป OpenAI API อัตโนมัติ
- ผู้ใช้เป็นผู้วาง prompt/แนบเอกสารใน ChatGPT เอง
- ถือเป็น data flow แยกจาก live official search ของ GovPrompt
- ต้องแจ้งผู้ใช้ชัดเจนก่อน Public Pilot ว่าการนำข้อมูลไปบริการ AI ภายนอกต้องเป็นไปตามนโยบายหน่วยงานและต้อง anonymize/de-identify ตามความเหมาะสม

## 8. Processing Roles — ยังต้องตัดสินใจ

ก่อน Public Pilot ต้องกำหนดให้ชัด:

- ใครเป็นผู้ควบคุมข้อมูลส่วนบุคคลสำหรับ GovPrompt
- หากหน่วยงานรัฐนำไปใช้ ใครเป็น controller ของข้อมูลที่เจ้าหน้าที่นำเข้า
- บทบาทของผู้พัฒนา GovPrompt ต่อข้อมูลดังกล่าว
- บทบาท/ข้อตกลงของ Cloudflare, Tavily, GitHub และบริการ AI ที่ผู้ใช้เลือก
- จำเป็นต้องมี DPA/processor terms หรือไม่
- มีการโอนข้อมูลไปต่างประเทศหรือไม่ และใช้กลไกใดรองรับ

ห้ามสมมติบทบาทเหล่านี้จาก architecture อย่างเดียว

## 9. Lawful Basis — ยังต้องกำหนดตาม use case

ยังไม่ควรฟันธงฐานกฎหมายเดียวสำหรับทุกกรณี เพราะงานราชการแต่ละประเภทและบทบาทผู้ใช้อาจต่างกัน

ก่อนใช้ข้อมูลส่วนบุคคลจริง ต้องระบุอย่างน้อย:

- วัตถุประสงค์ของแต่ละ processing activity
- ประเภทข้อมูล
- เจ้าของข้อมูล
- necessity/proportionality
- ฐานกฎหมายที่ใช้ได้จริง
- หากเป็น sensitive data ต้องตรวจเงื่อนไขเฉพาะเพิ่มเติม
- ระยะเวลาเก็บและวิธีลบ
- ผู้รับ/ผู้ให้บริการภายนอก
- ช่องทางใช้สิทธิของเจ้าของข้อมูล

## 10. Retention Baseline ที่เสนอสำหรับ Internal Pilot

- Full query ใน GovPrompt application: **ไม่เก็บแบบ persistent โดยเจตนา**
- Raw sensitive query ที่ Worker reject: **ห้าม log ค่า raw**
- Application operational metadata: เก็บเท่าที่จำเป็นต่อ security/debugging และลด sampling
- Cloudflare platform logs: ใช้ retention ต่ำสุดที่เหมาะสมกับ incident investigation; ต้องยืนยันค่าจริงใน Dashboard
- Test files/test data: ใช้ข้อมูลจำลองและลบเมื่อจบการทดสอบ
- Incident evidence: เก็บเฉพาะเท่าที่จำเป็นและกำหนดผู้เข้าถึง

## 11. Go/No-Go ก่อน Public Pilot

ห้ามเปลี่ยนสถานะเป็น Public Pilot จนกว่า:

- [ ] controller / contact / responsible person ชัดเจน
- [ ] lawful basis ต่อ use case ที่อนุญาตชัดเจน
- [ ] Privacy Notice ผ่าน review
- [ ] third-party disclosure และ terms ได้ตรวจ
- [ ] retention/deletion policy ได้อนุมัติ
- [ ] Cloudflare production security workflow ผ่าน
- [ ] attachment/network test ผ่าน
- [ ] Incident Response และ data-subject request channel พร้อม
- [ ] หาก use case มีความเสี่ยงสูง ให้ประเมินความจำเป็นของ DPIA ก่อนใช้งานจริง
