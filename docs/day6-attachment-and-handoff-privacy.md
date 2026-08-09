# Day 6 — Attachment & External Handoff Privacy Review

วันที่: 9 สิงหาคม 2569
สถานะ: Internal Pilot

## เป้าหมาย
ลดความเสี่ยงที่ข้อมูลส่วนบุคคลหรือข้อมูลลับจะหลุดผ่านชื่อไฟล์, metadata, Clipboard หรือการส่งต่อไปยัง ChatGPT

## สิ่งที่ตรวจพบก่อนแก้
1. หน้า Home เก็บ File object ไว้ในหน่วยความจำของแท็บ
2. ชื่อไฟล์จริงถูกนำไปใส่ shared context และ prompt
3. ปุ่ม “เปิดใน ChatGPT” และ “คัดลอก Prompt” เคยคัดลอก prompt ต้นฉบับโดยตรง
4. เนื้อหาไฟล์ไม่ได้ถูก upload ไป Worker จากหน้า Home ตามเส้นทางที่ตรวจ แต่ชื่อไฟล์อาจมี PII ได้

## มาตรการที่เพิ่มใน Day 6
- เพิ่ม `sanitizeAttachmentName()` ใน Privacy Guard
- ก่อนสร้าง prompt จะใช้เฉพาะ attachment metadata ที่ปกปิดชื่อแล้ว
- ไม่ส่ง File object จริงเข้า prompt orchestrator จากหน้า Home
- UI แสดงเพียงจำนวนไฟล์ ไม่แสดงชื่อไฟล์จริง
- หลัง submit สำเร็จ ระบบล้าง File object จากตัวแปร attachments และ reset file input
- เพิ่ม `sanitizeExternalContent()` สำหรับ prompt ที่จะออกจาก GovPrompt
- ปุ่ม “คัดลอก Prompt” และ “เปิดใน ChatGPT” ต้องผ่าน Privacy Guard ก่อน
- หากพบข้อมูลลับ/credential หรือ residual sensitive pattern ระบบ Fail Closed และไม่คัดลอก/ไม่เปิด ChatGPT
- หากเป็น PII ที่สามารถ redact ได้ ระบบจะใช้ข้อความที่ปกปิดแล้วแทน

## Data Flow หลังแก้

```text
File selected in browser
   └─ File object อยู่ชั่วคราวใน memory
       ├─ UI แสดงเฉพาะจำนวนไฟล์
       ├─ sanitizeAttachmentName(original filename)
       └─ prompt ใช้ safe metadata เท่านั้น

Prompt generated locally
   └─ ก่อน Clipboard / ChatGPT
       └─ sanitizeExternalContent(prompt)
           ├─ blocked => หยุดส่งต่อ
           └─ safe => copy sanitized prompt
```

## ข้อจำกัดที่ยังเหลือ
- Regex/DLP แบบ client-side ไม่สามารถรับประกันการตรวจจับ PII ทุกชนิดได้
- เนื้อหาไฟล์ยังไม่ได้ถูกอ่านเพื่อ DLP; หากอนาคตมีการอ่านหรือ upload เนื้อหาไฟล์ ต้องเพิ่ม file-content scanning แยกต่างหาก
- ผู้ใช้ยังสามารถนำเอกสารไปแนบกับ ChatGPT ด้วยตนเอง ซึ่งเป็น data flow ภายนอก GovPrompt และต้องปฏิบัติตามนโยบายของหน่วยงาน/บริการนั้น
- Prompt ต้นฉบับยังแสดงในหน้าจอภายใน browser เพื่อให้ผู้ใช้ตรวจสอบ จึงต้องระวัง shared device / screen exposure

## เกณฑ์ผ่าน Day 6
สถานะ: PASS สำหรับเส้นทางชื่อไฟล์และ external prompt handoff ในหน้า Home ภายใต้ Internal Pilot

ยังไม่ถือว่า Public Ready จนกว่าจะมี network audit จริง, production deployment verification, Cloudflare dashboard review และ governance/legal review ตามแผน
