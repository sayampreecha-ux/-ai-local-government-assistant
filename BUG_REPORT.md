# BUG REPORT — SLDP v1.2 Stable RC1

วันที่ตรวจและแก้ไข: 19 กรกฎาคม 2026  
ขอบเขต: Sprint 1 — Security, LocalStorage, Draft/Autosave, PWA Cache และ Version Alignment  
Source baseline SHA-256: `1d3073b23546980284edb60d02220bf91d214c1749cc944a004ded6807566905`

## เกณฑ์ระดับความรุนแรง

| ระดับ | ความหมาย |
|---|---|
| Critical | สามารถทำให้ระบบหรือข้อมูลเสียหายร้ายแรงได้โดยตรง |
| High | กระทบความปลอดภัย ความครบถ้วนของข้อมูล หรือฟังก์ชันหลัก |
| Medium | กระทบความเสถียร การอัปเดต หรือความน่าเชื่อถือของระบบ |
| Low | กระทบรองด้านการวินิจฉัยหรือประสบการณ์ใช้งาน |

## สรุปก่อนและหลังแก้ไข

| ID | ปัญหา | ก่อนแก้ | หลังแก้ | สถานะ |
|---|---|---:|---:|---|
| S1-001 | Stored XSS จาก Custom Prompt / Import / Draft rendering | High | Low residual | Fixed |
| S1-002 | `JSON.parse()` จาก LocalStorage โดยไม่มี safe fallback | High | Low | Fixed |
| S1-003 | Import ไม่มี schema, type, size และ version validation | High | Low | Fixed |
| S1-004 | Import เขียนข้อมูลทีละส่วนและอาจค้างครึ่งชุด | High | Low | Fixed |
| S1-005 | Draft จับคู่ Form ใหม่กับ Output เก่า | High | Low residual | Fixed for new writes |
| S1-006 | Autosave ไม่ถูกกู้คืนเมื่อมี Last Document | High | Low | Fixed |
| S1-007 | “ร่างใหม่” ไม่ล้าง Autosave และ Last Document | Medium | Low | Fixed |
| S1-008 | Service Worker Cache ยังเป็น v1.1 | Medium | Low | Fixed |
| S1-009 | Offline fallback คืน `index.html` ให้ JS/CSS/รูปภาพ | Medium | Low | Fixed |
| S1-010 | Cache ทุก GET รวม cross-origin และ response ผิดสถานะ | Medium | Low | Fixed |
| S1-011 | Service Worker registration ไม่มี error handling | Low | Low | Fixed |
| S1-012 | Version Drift ระหว่าง UI, Export, README และ Cache | Medium | Low | Fixed |

## รายละเอียดการแก้ไข

### S1-001 — Stored XSS

**อาการเดิม**  
ข้อมูลที่ผู้ใช้กรอกหรือนำเข้าถูกต่อเป็น HTML แล้วกำหนดผ่าน `innerHTML` ใน Prompt Card และ Draft List ทำให้ payload เช่น `<img onerror=...>` ทำงานได้

**การแก้ไข**

- เปลี่ยนการ render ข้อมูลผู้ใช้เป็น DOM element ที่กำหนดข้อความด้วย `textContent`
- ไม่ประกอบ HTML จาก `category`, `title`, `desc`, `subject`, `type` และ ID
- Event handler ผูกกับ element ที่สร้างขึ้นโดยตรง
- ข้อมูล HTML เดิมยังถูกเก็บเป็นข้อความและไม่ถูกลบอัตโนมัติ

**ผลทดสอบ**  
ก่อนแก้ payload ทำงานและสร้าง `<img>` ได้ 1 รายการ; หลังแก้ payload แสดงเป็นข้อความและไม่ทำงาน

---

### S1-002 — LocalStorage JSON เสียแล้วระบบหยุดทำงาน

**อาการเดิม**  
มีการเรียก `JSON.parse(localStorage.getItem(...))` หลายตำแหน่งโดยไม่มี `try/catch`

**การแก้ไข**

- เพิ่ม `safeGetItem`, `safeParseJSON`, `readJSON`, `writeJSON`
- เมื่อข้อมูลเสีย ระบบใช้ค่าเริ่มต้นโดยไม่ลบหรือเขียนทับข้อมูลเดิม
- จำกัดชนิดและความยาวของข้อมูลที่นำมาใช้ใน runtime

**ผลทดสอบ**  
ค่า `{broken-json` ทำให้ระบบเดิมหยุดก่อนแสดง Prompt; รุ่น RC1 เปิดได้ครบ 12 Prompt และเก็บค่าที่เสียไว้เพื่อให้ผู้ดูแลตรวจสอบได้

---

### S1-003 — Import ไม่มี Validation

**อาการเดิม**  
ระบบรับ JSON ที่อ่านได้แล้วเขียนลง LocalStorage ทันที โดยไม่ตรวจ schema, data type, version หรือขนาดไฟล์

**การแก้ไข**

- จำกัดไฟล์นำเข้าไม่เกิน 5 MB
- รองรับ Backup ตระกูล v1.1 และ v1.2
- ตรวจ `settings`, `favorites`, `customPrompts`, `document`, `drafts`
- ตรวจชนิดข้อมูล ความยาว จำนวนรายการ ID ซ้ำ และ ID ที่ชนกับ Built-in Prompt
- Normalize Favorite ID เป็นจำนวนเต็มเพื่อรองรับข้อมูลเดิมที่เป็น numeric string
- ปฏิเสธไฟล์ทั้งชุดก่อนเขียน หากพบ field ไม่ถูกต้อง

**ผลทดสอบ**  
ไฟล์ที่กำหนด `favorites` เป็น string ถูกปฏิเสธ และไม่สร้าง/แก้ไข key ใน LocalStorage

---

### S1-004 — Import อาจเขียนข้อมูลครึ่งชุด

**อาการเดิม**  
หากเขียน LocalStorage สำเร็จบาง key แล้วล้มเหลวใน key ถัดไป ระบบจะเหลือข้อมูลเก่าและใหม่ปะปนกัน

**การแก้ไข**

- เพิ่ม transaction แบบ snapshot-and-rollback ฝั่ง Browser
- เตรียมและ validate ทุกค่าให้เสร็จก่อนเริ่มเขียน
- หากเขียนรายการใดล้มเหลว จะคืนค่า key ที่เกี่ยวข้องกลับสภาพเดิม

**ผลทดสอบ**  
จำลอง quota error ในการเขียนรายการที่สอง ระบบคืน `lg-settings` และ `lg-favorites` เป็นค่าเดิมครบ

---

### S1-005 — Draft Form และ Output คนละชุด

**อาการเดิม**  
ผู้ใช้สร้างเอกสาร A แก้ Form เป็น B แล้วกดบันทึกร่าง จะได้ Form B แต่ Output A

**การแก้ไข**

- สร้าง fingerprint จากค่าฟอร์มทุก field ที่เกี่ยวข้อง
- บันทึก Output ใน Draft/Autosave เฉพาะเมื่อ fingerprint ตรงกับข้อมูลที่ใช้สร้าง Output
- หาก Form ถูกแก้หลังสร้าง Output ระบบบันทึกเฉพาะ Form และไม่ผูก Output เก่าเข้า Draft
- เมื่อเปิด Draft ที่ไม่มี Output ปัจจุบัน ระบบแสดงข้อความเริ่มต้นแทน Output คนละชุด

**หมายเหตุข้อมูลเดิม**  
Draft รุ่นเก่าที่ไม่มี fingerprint ยังคงเปิดได้และไม่ถูกแก้ไขอัตโนมัติ เพื่อหลีกเลี่ยงการทำลายข้อมูลเดิม หาก Draft รุ่นเก่ามีความไม่สอดคล้องอยู่แล้ว ระบบไม่สามารถย้อนสร้าง Output ที่ถูกต้องจากอดีตได้

---

### S1-006 — Autosave ถูก Last Document บัง

**อาการเดิม**  
ระบบ Restore Autosave เฉพาะเมื่อไม่มี `lg-last-document` ทำให้ Form ล่าสุดหายหลัง reload

**การแก้ไข**

- ให้ Autosave เป็นแหล่งข้อมูลล่าสุดของ Form เสมอเมื่อมีอยู่
- แสดง Output จาก Autosave เฉพาะเมื่อ fingerprint ตรงกับ Form
- ใช้ Last Document เฉพาะเมื่อไม่มี Autosave

**ผลทดสอบ**  
หลังสร้าง “เรื่อง A” แล้วแก้เป็น “เรื่อง B ล่าสุด” และ reload รุ่น RC1 กู้ Form “เรื่อง B ล่าสุด” และไม่แสดง Output ของเรื่อง A

---

### S1-007 — New Draft มี State เก่ากลับมา

**การแก้ไข**

- เมื่อผู้ใช้ยืนยัน “ร่างใหม่” ให้ล้าง `lg-autosave-document` และ `lg-last-document`
- ไม่ลบร่างที่ผู้ใช้บันทึกไว้ใน `lg-document-drafts`
- อ่าน Settings ล่าสุดก่อนเติมชื่อหน่วยงานกลับเข้าฟอร์ม

---

### S1-008 ถึง S1-010 — PWA Cache และ Service Worker

**การแก้ไข**

- กำหนด Cache เป็น `lg-assistant-ready-v1-2`
- ลบเฉพาะ Cache เก่าของ SLDP และไม่ลบ Cache ของระบบอื่น
- ใช้ network-first เฉพาะ navigation และ fallback ไป `index.html` เฉพาะ navigation
- ไม่ intercept cross-origin request
- Cache เฉพาะ asset ที่กำหนดไว้ใน precache list
- ไม่ cache response ที่ `!response.ok` หรือไม่ใช่ `basic`
- ผูก cache write กับ `event.waitUntil()`
- เรียก `clients.claim()` หลัง activate

---

### S1-011 — Service Worker registration error

เพิ่ม `.catch()` เพื่อบันทึก error ใน Console หากลงทะเบียน Service Worker ไม่สำเร็จ โดยไม่ทำให้หน้าเว็บหยุดทำงาน

---

### S1-012 — Version Drift

ปรับให้เป็น `1.2` ตรงกันใน:

- `index.html`
- `assets/app.js` และไฟล์ Backup Export
- `service-worker.js` และชื่อ Cache
- `README.md`

ชื่อ RC (`RC1`) ใช้ในชื่อแพ็กเกจและเอกสาร release โดยไม่เปลี่ยนเลขผลิตภัณฑ์หลักจาก 1.2

## ปัญหาที่ยังไม่แก้ใน Sprint 1

รายการต่อไปนี้อยู่นอกขอบเขต Sprint 1 และยังคงอยู่:

- Template ของเอกสารทั้ง 5 ประเภทยังต้องตรวจความถูกต้องเชิงรูปแบบราชการ
- ข้อมูลยังเก็บแบบ plain text ใน LocalStorage ตามสถาปัตยกรรมเดิม
- Word export ยังเป็น HTML-compatible `.doc`
- ยังไม่มี CSP/Netlify security headers
- ยังไม่มี automated CI pipeline
- ยังไม่ได้ทดสอบจริงบน iOS Safari, Android Chrome และ Netlify production

## สถานะ Sprint 1

ปัญหา High ที่อยู่ในขอบเขต Sprint 1 ถูกแก้และผ่าน automated test แล้ว ไม่พบการย้าย schema หรือการลบข้อมูลเดิมอัตโนมัติ
