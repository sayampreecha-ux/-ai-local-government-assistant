# Day 7 — Final Go/No-Go Security Review

วันที่: 9 สิงหาคม 2569
สถานะโครงการ: Internal Pilot

## คำวินิจฉัย

**GO สำหรับ Internal Pilot แบบจำกัดขอบเขต**

**NO-GO สำหรับ Public Pilot ที่รับข้อมูลประชาชนจริงหรือข้อมูลลับของหน่วยงาน** จนกว่าจะผ่าน Production/Network verification และการตรวจ Cloudflare Dashboard/สิทธิ์/Secrets/Logs โดยผู้ดูแลจริง รวมถึง governance/legal/DPO review ตามความเหมาะสม

## สิ่งที่ผ่านแล้ว

1. หน้าเว็บแสดงสถานะ Internal Pilot และคำเตือนข้อมูลเสี่ยง
2. Privacy Guard ทำ redaction ก่อน external search
3. Fail Closed เมื่อพบ classified data, credentials หรือ residual high-risk pattern
4. Worker ตรวจ sensitive data ซ้ำก่อนเรียก provider
5. จำกัด Origin, Method, request size และ rate limit
6. Worker ไม่ echo raw query กลับใน response
7. Tavily ถูกตั้ง `include_answer: false` และ `include_raw_content: false`
8. Application log ไม่ควรบันทึก query เต็ม แต่ใช้ metadata ที่จำเป็น
9. Cloudflare observability ถูกลดระดับและกำหนด sampling
10. ชื่อไฟล์แนบถูก sanitize ก่อนเข้าพrompt และ UI ไม่แสดงชื่อไฟล์จริง
11. File object ในหน้า Home ถูกล้างหลัง submit สำเร็จ
12. Clipboard/ChatGPT handoff ผ่าน Privacy Guard ก่อนออกจาก GovPrompt
13. มี Data Flow baseline, Privacy Governance baseline และ Incident Response Playbook
14. มี automated Internal Pilot Security Gate ใน test suite

## ความเสี่ยงคงเหลือ

### ระดับสูง — ต้องปิดก่อน Public Pilot
- ยังต้องยืนยันว่า production Worker ที่ deploy จริงตรงกับ source ล่าสุด
- ยังต้องตรวจ Cloudflare Dashboard ว่า Secret, rate-limit binding, observability/log settings และ deployment version ถูกต้องจริง
- ยังต้องทำ network audit จาก browser จริงเพื่อยืนยันว่าไม่มี external request อื่นที่ไม่คาดคิด
- ยังต้องตรวจ retention/logging/upstream data handling ของบริการภายนอกในบริบทการใช้งานจริง
- หากในอนาคตอ่านเนื้อหาไฟล์ ต้องมี DLP/file-content scanning เพิ่ม เพราะ Day 6 ป้องกันเฉพาะ filename/metadata/handoff

### ระดับกลาง
- Regex/DLP ไม่สามารถรับประกันการตรวจจับ PII ทุกชนิดได้
- Prompt ต้นฉบับยังอยู่ใน DOM/หน่วยความจำชั่วคราวของ browser
- ผู้ใช้ยังสามารถนำข้อมูลไปวางหรือแนบกับบริการภายนอกด้วยตนเอง
- ต้องมีการทบทวน Privacy Notice/ROPA/DPIA/ฐานกฎหมายและบทบาทผู้ควบคุม/ผู้ประมวลผลตามกรณีใช้งานจริง

## กติกาการใช้งานที่อนุญาตใน Internal Pilot

- ใช้โจทย์จำลองหรือข้อมูล de-identified เป็นหลัก
- ห้ามข้อมูลลับของราชการ
- ห้าม password, API key, token, secret และ private key
- หลีกเลี่ยงเลขบัตรประชาชน เลขบัญชี ข้อมูลสุขภาพ HN/AN และข้อมูลประชาชนจริงที่ไม่จำเป็น
- เอกสารจริงต้องปกปิดข้อมูลระบุตัวบุคคลก่อน
- ผล AI ต้องมี human review ทุกครั้ง
- ไม่ใช้ GovPrompt เป็นระบบอนุมัติอัตโนมัติหรือฐานเก็บเอกสารราชการ

## Security Gates ก่อน Public Pilot

Public Pilot จะพิจารณาได้ต่อเมื่อทุกข้อเป็น PASS:

- [ ] Production Worker version verification
- [ ] Browser network audit
- [ ] Cloudflare secret/config/dashboard review
- [ ] Rate-limit binding verification in production
- [ ] Log/retention review and no sensitive payload sampling
- [ ] Third-party processing disclosure/terms review
- [ ] Privacy Notice พร้อมใช้งานจริง
- [ ] Incident response owner/contact ชัดเจน
- [ ] DPO/legal/governance review ตามความเหมาะสมของกรณีใช้งาน
- [ ] Regression/security tests ผ่านก่อน deploy

## Final Decision

### Internal Pilot: GO 🟢
ภายใต้ข้อจำกัดด้านข้อมูลและ human review ข้างต้น

### Public Pilot: HOLD 🟡
พัฒนาต่อได้ แต่ยังไม่เปิดรับข้อมูลประชาชนจริงในวงกว้างจนกว่าจะผ่าน Security Gates ที่เหลือ

### Official Government System: NO-GO 🔴
ยังไม่ควรนำไปประกาศหรือใช้งานในฐานะระบบราชการทางการจนกว่าจะมีการอนุมัติ นโยบาย หน่วยงานรับผิดชอบ การกำกับดูแล และมาตรการด้านกฎหมาย/ความมั่นคงปลอดภัยที่เกี่ยวข้อง

เอกสารนี้เป็น technical risk decision สำหรับการพัฒนาโครงการ ไม่ใช่การรับรองทางกฎหมายหรือการรับรองความปลอดภัย 100%
