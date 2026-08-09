# GovPrompt Thailand — Data Flow & Privacy/Security Baseline

สถานะ: Internal Pilot / เอกสารตรวจสอบเบื้องต้น
วันที่ตรวจ: 9 สิงหาคม 2569
ขอบเขต: หน้าเว็บหลักและ JavaScript ฝั่งผู้ใช้ใน repository `sayampreecha-ux/-ai-local-government-assistant`

> เอกสารนี้เป็น technical baseline เพื่อใช้ตรวจสอบและลดความเสี่ยง ไม่ใช่การรับรองว่า GovPrompt ปลอดภัย 100% หรือเป็นการรับรองการปฏิบัติตาม PDPA โดยหน่วยงานทางการ

## 1. สรุป Data Flow ปัจจุบัน

```text
ผู้ใช้
  │
  ├─ พิมพ์คำถามใน Browser
  │      │
  │      ├─ เก็บ/ประมวลผลชั่วคราวในหน้าเว็บ
  │      │   ├─ route งาน
  │      │   ├─ สร้าง Prompt
  │      │   └─ แสดงข้อความใน DOM
  │      │
  │      ├─ Privacy Guard
  │      │   └─ sanitizeExternalQuery()
  │      │       ├─ เลขบัตร 13 หลัก
  │      │       ├─ อีเมล
  │      │       ├─ เบอร์โทร
  │      │       ├─ เลขบัญชี/พร้อมเพย์บางรูปแบบ
  │      │       ├─ password/API key/secret/token บางรูปแบบ
  │      │       ├─ ชื่อบุคคลที่มีคำนำหน้าบางรูปแบบ
  │      │       └─ ข้อมูลสุขภาพบางรูปแบบ
  │      │
  │      └─ ส่งเฉพาะ safeQuery ไปยัง External Search Connector
  │              └─ Cloudflare Worker
  │                 `https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search`
  │
  ├─ แนบไฟล์/ภาพ
  │      └─ จากโค้ดหน้า Home ที่ตรวจ พบการนำ `file.name` ไปใช้ใน context/prompt
  │         ยังไม่พบการอัปโหลดเนื้อหาไฟล์จากหน้า Home ไป Worker โดยอัตโนมัติ
  │
  └─ กด “เปิดใน ChatGPT”
         ├─ GovPrompt คัดลอก Prompt ไป Clipboard
         ├─ เปิด `https://chatgpt.com/`
         └─ ผู้ใช้เป็นผู้วาง Prompt/แนบเอกสารใน ChatGPT เอง
            (เป็น data flow แยกจาก GovPrompt)
```

## 2. สิ่งที่ยืนยันได้จากโค้ดปัจจุบัน

### 2.1 Browser-side processing
- ข้อความผู้ใช้ถูกแสดงใน DOM และใช้สร้าง shared context / prompt ภายใน browser
- ตัวแปร `history` เป็น array ในหน่วยความจำ
- มีการลบ legacy key `govprompt-v3-history` จาก `localStorage`
- จากส่วนที่ตรวจยังไม่พบการบันทึก full prompt ใหม่ลง localStorage โดยหน้า Home

### 2.2 External live search
- หน้า Home เรียก `officialSearchConnector.search(...)`
- endpoint เริ่มต้นของ connector คือ Cloudflare Worker ของโครงการ
- `privacy-guard.js` wrap connector และเรียก `sanitizeExternalQuery()` ก่อนส่ง query ออกภายนอก
- หาก Privacy Guard ทำงานสำเร็จ connector เดิมจะได้รับ `privacy.safeQuery` ไม่ใช่ข้อความต้นฉบับโดยตรง

### 2.3 ChatGPT handoff
- ปุ่ม “เปิดใน ChatGPT” เปิดเว็บไซต์ ChatGPT และคัดลอก prompt ไป clipboard
- GovPrompt ไม่ได้ส่ง prompt เข้า ChatGPT API โดยอัตโนมัติจากโค้ดหน้า Home ที่ตรวจ
- เมื่อผู้ใช้นำ prompt หรือเอกสารไปวาง/แนบใน ChatGPT ถือเป็นการประมวลผลอีกเส้นทางหนึ่งและต้องมีคำอธิบาย/แนวปฏิบัติแยกให้ชัดเจน

### 2.4 Attachments
- หน้า Home รับ `File` objects จาก file picker/camera
- จากฟังก์ชัน `preparePrompt()` ที่ตรวจ มีการส่งรายชื่อไฟล์ (`file.name`) เข้า context และ prompt
- ยังไม่พบหลักฐานในเส้นทางหน้า Home ที่ตรวจว่าไฟล์ถูก upload ไป Cloudflare Worker อัตโนมัติ
- ต้องทดสอบ network traffic จริงเพื่อยืนยันอีกชั้นก่อนเปิดสาธารณะ

## 3. ความเสี่ยงที่ยังเหลือ

| ระดับ | ความเสี่ยง | สถานะ/ข้อเสนอ |
|---|---|---|
| สูง | ไม่ทราบนโยบาย logging/retention ฝั่ง Cloudflare Worker จาก repo นี้ | ต้องตรวจ source/config/log ของ Worker ก่อน Public Pilot |
| สูง | Privacy Guard เป็น regex จึงอาจพลาดข้อมูลส่วนบุคคลบางรูปแบบ | ต้องทำ test corpus และเพิ่ม fail-safe ก่อน external call |
| สูง | ข้อมูลลับที่ไม่ตรง pattern อาจยังหลุดไปกับ safeQuery | เพิ่ม block/confirmation สำหรับคำเสี่ยงและเอกสารลับ |
| กลาง | ชื่อบุคคล regex อาจ over-redact ทำให้ค้นผิดความหมาย | ทดสอบ precision/recall และปรับเฉพาะ external query |
| กลาง | Prompt ต้นฉบับยังอยู่ใน DOM/หน่วยความจำและ Clipboard | หลีกเลี่ยง persistence, ล้างเมื่อ New Chat, แจ้งผู้ใช้เรื่อง Clipboard |
| กลาง | ผู้ใช้อาจนำข้อมูลจริงไปวางใน ChatGPT ภายหลัง | ต้องแจ้งชัดว่าเป็น external processing และให้ anonymize ก่อน |
| กลาง | ชื่อไฟล์อาจมีชื่อบุคคล/เลขที่เอกสาร | sanitize ชื่อไฟล์ก่อนใส่ prompt หรือไม่ใส่ชื่อไฟล์เมื่อไม่จำเป็น |
| กลาง | ยังไม่ยืนยันด้วย Network test ว่ามี request อื่นนอกเหนือจาก Worker | ทำ browser DevTools / automated network audit |

## 4. กติกา Internal Pilot ระหว่างนี้

1. ห้ามใช้ข้อมูลลับของราชการ
2. ห้ามใช้เลขบัตรประชาชน เลขบัญชี รหัสผ่าน token/API key หรือข้อมูลสุขภาพจริงโดยไม่จำเป็น
3. เอกสารทดสอบต้องปกปิดข้อมูลระบุตัวบุคคลก่อน
4. ใช้โจทย์จำลองหรือเอกสารที่ de-identify แล้วเป็นหลัก
5. ผลลัพธ์ AI ต้องมี human review ทุกครั้ง
6. ยังไม่ใช้ GovPrompt แทนระบบสารบรรณ การเงิน พัสดุ หรือระบบอนุมัติของหน่วยงาน
7. ไม่เปิดรับข้อมูลประชาชนจริงใน Public Pilot จนกว่าจะผ่าน Worker audit + network test + privacy/security checklist

## 5. Day 2 — Test Plan สำหรับ Privacy Guard

ต้องทดสอบอย่างน้อยกลุ่มต่อไปนี้และบันทึกผลว่า `original`, `safeQuery`, redaction ที่เกิดขึ้น และ request จริงที่ออกจาก browser:

- เลขบัตรประชาชน 13 หลัก ทั้งติดกันและมีช่อง/ขีด
- เบอร์มือถือ/เบอร์สำนักงานหลายรูปแบบ
- อีเมล
- เลขบัญชี/พร้อมเพย์ โดยมีและไม่มี keyword นำหน้า
- ชื่อ-นามสกุล มี/ไม่มีคำนำหน้า
- ที่อยู่
- วันเดือนปีเกิด
- ทะเบียนรถ
- เลขผู้ป่วย/HN/AN
- ข้อมูลสุขภาพและผลตรวจ
- รหัสผ่าน/API key/token/secret หลายรูปแบบ
- ข้อความชั้นความลับ
- ข้อมูลหลายประเภทผสมกันในประโยคเดียว
- ชื่อไฟล์ที่มี PII

**เงื่อนไขผ่านขั้นต่ำ:** request ที่ออกไปยัง external search ต้องไม่มีข้อมูลที่กำหนดให้ปกปิด และหากตรวจพบความเสี่ยงสูงแต่ sanitize ไม่มั่นใจ ระบบควรหยุด external search แทนการส่งข้อความต้นฉบับ

## 6. สิ่งที่ยังไม่ได้ยืนยัน

- source code และ configuration ฝั่ง Cloudflare Worker
- logging / analytics / retention ของ Worker และ upstream search provider
- CORS, rate limit, secret management และ abuse protection
- network requests จริงครบทุกหน้า/ทุกโมดูล
- การจัดการ cache ของ browser/CDN
- dependencies / third-party scripts ทั้ง repository
- incident response และ breach handling ของผู้ดูแลระบบ

จนกว่าจะตรวจหัวข้อเหล่านี้ครบ ให้ถือ GovPrompt เป็น **Internal Pilot** และไม่ใช้กับข้อมูลลับหรือข้อมูลส่วนบุคคลจริงที่ไม่จำเป็น
