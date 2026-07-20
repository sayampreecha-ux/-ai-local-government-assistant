# TEST REPORT — SLDP v1.2 Stable RC1

วันที่ทดสอบ: 19 กรกฎาคม 2026  
ผลรวม: **ผ่านทุกกรณีทดสอบอัตโนมัติที่กำหนดใน Sprint 1**

## สภาพแวดล้อมทดสอบ

- Node.js `v22.16.0`
- Python Playwright + Chromium `/usr/bin/chromium`
- JavaScript syntax check ด้วย `node --check`
- Manifest validation ด้วย `python -m json.tool`
- Service Worker behavior test ด้วย Node VM และ mock Cache/Fetch API

### ข้อจำกัดของสภาพแวดล้อม

Chromium ในระบบทดสอบถูกนโยบายของ environment ปิดกั้นการ navigate ไป `localhost` และ `file://` จึงทดสอบ UI โดย:

1. โหลด DOM จริงจาก `index.html` ด้วย `page.set_content()`
2. Inject ไฟล์ `assets/app.js` จริงเข้า Chromium
3. ใช้ LocalStorage mock ที่มีพฤติกรรม `getItem/setItem/removeItem/clear`
4. ทดสอบ Service Worker แยกด้วย Node VM จากไฟล์ `service-worker.js` จริง

ดังนั้นผลนี้ยืนยัน logic และ DOM behavior ของ Sprint 1 แต่ยังไม่แทนการทดสอบ deployment จริงบน Netlify และอุปกรณ์มือถือ

## ผลทดสอบ Static

| Test | ผล |
|---|---|
| `node --check assets/app.js` | ผ่าน |
| `node --check service-worker.js` | ผ่าน |
| `manifest.webmanifest` เป็น JSON ถูกต้อง | ผ่าน |
| Version 1.2 ตรงกันใน UI/App/SW/README | ผ่าน |
| Service Worker มี origin/type/status guard | ผ่าน |

## Regression Before/After

| กรณี | ก่อนแก้ | หลังแก้ |
|---|---|---|
| Smoke load และ Built-in Prompt 12 รายการ | ผ่าน | ผ่าน |
| Stored XSS payload | **ทำงานได้** | **ถูกป้องกัน** |
| LocalStorage มี JSON เสีย | App หยุดโหลด | ใช้ safe fallback และไม่ลบค่าเดิม |
| Autosave ใหม่กว่าผลลัพธ์เดิม | ไม่ restore Form ล่าสุด | restore Form ล่าสุด |
| Draft หลังแก้ Form แต่ไม่สร้าง Output ใหม่ | Form/Output คนละชุด | ไม่ผูก Output เก่า |

## รายละเอียด Test หลังแก้

| ID | Test | Expected | Result |
|---|---|---|---|
| T-001 | Smoke load | ชื่อหน้าและ Prompt 12 รายการถูกต้อง ไม่มี page error | ผ่าน |
| T-002 | Custom Prompt XSS | Payload แสดงเป็นข้อความ ไม่มี script execution | ผ่าน |
| T-003 | Corrupt LocalStorage | App เปิดได้และค่าที่เสียไม่ถูกลบ | ผ่าน |
| T-004 | Autosave precedence | Form ล่าสุดถูก restore แม้มี Last Document | ผ่าน |
| T-005 | Draft output consistency | Form ใหม่ไม่ถูกจับคู่กับ Output เก่า | ผ่าน |
| T-006 | Import schema validation | `favorites` ที่ไม่ใช่ array ถูกปฏิเสธ | ผ่าน |
| T-007 | Imported HTML rendering | HTML จากข้อมูลนำเข้าไม่ทำงาน | ผ่าน |
| T-008 | Import atomic rollback | จำลอง write failure แล้วคืนค่าข้อมูลเดิมครบ | ผ่าน |
| T-009 | New Draft state reset | ล้าง Autosave/Last Document แต่คง Saved Draft | ผ่าน |

## Service Worker Behavior Test

ทดสอบทั้งหมด 7 รายการ:

| ID | Test | Result |
|---|---|---|
| SW-001 | Install เปิด Cache `lg-assistant-ready-v1-2` | ผ่าน |
| SW-002 | Activate ลบ Cache SLDP v1.1 เท่านั้น | ผ่าน |
| SW-003 | ไม่ intercept cross-origin request | ผ่าน |
| SW-004 | ไม่ intercept same-origin asset ที่ไม่อยู่ใน allowlist | ผ่าน |
| SW-005 | Navigation offline fallback ไป `index.html` | ผ่าน |
| SW-006 | Asset offline ไม่คืน HTML fallback | ผ่าน |
| SW-007 | Response 404 ไม่ถูก cache | ผ่าน |

## การตรวจความเข้ากันได้กับข้อมูลเดิม

- Built-in Prompt ID เดิมไม่เปลี่ยน
- LocalStorage key เดิมไม่เปลี่ยน
- Settings, Favorites, Custom Prompt และ Draft schema เดิมยังอ่านได้
- Favorite ID แบบ numeric string ถูก normalize ใน memory
- ไม่มี automatic migration หรือ automatic deletion
- Draft เก่าที่ไม่มี `outputFingerprint` ยังเปิดได้

## รายการที่ต้องทำ Manual/UAT ก่อน Production

- [ ] Deploy ZIP บน Netlify staging
- [ ] ทดสอบ Service Worker registration และ update จาก v1.1 จริง
- [ ] ทดสอบ Offline/Online บน Chrome/Edge จริง
- [ ] ทดสอบ iPhone Safari และ Add to Home Screen
- [ ] ทดสอบ iPad Safari แนวตั้ง/แนวนอน
- [ ] ทดสอบ Android Chrome
- [ ] ทดสอบ Import backup จริงจากผู้ใช้ v1.1 อย่างน้อย 2 ชุด
- [ ] ทดสอบ Storage quota เต็มบน browser จริง
- [ ] ทดสอบ Word/TXT/PDF regression
- [ ] ตรวจเอกสารทั้ง 5 ประเภทใน Sprint ถัดไป

## ข้อสรุป

RC1 ผ่าน automated regression ของ Sprint 1 แต่ยังควรผ่าน Netlify staging และ device UAT ก่อนประกาศเป็น Production Stable
