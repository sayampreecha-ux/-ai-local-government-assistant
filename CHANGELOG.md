# CHANGELOG

การเปลี่ยนแปลงทั้งหมดของ SLDP บันทึกในไฟล์นี้

## [1.2 Stable RC1] — 2026-07-19

### Security

- ป้องกัน Stored XSS ใน Prompt Card, Favorite และ Draft List โดยเลิก render ข้อมูลผู้ใช้ผ่าน `innerHTML`
- เพิ่ม validation สำหรับไฟล์ Backup: version, schema, type, length, count และ duplicate ID
- จำกัดขนาดไฟล์ Import ที่ 5 MB
- เพิ่ม transaction และ rollback เมื่อ Import เขียน LocalStorage ไม่ครบ
- ไม่ intercept หรือ cache cross-origin request ใน Service Worker

### Fixed

- แก้ App ล่มเมื่อ JSON ใน LocalStorage เสีย
- แก้ Favorite ID แบบ string/number ไม่ตรงกันหลัง Import
- แก้ Draft ที่ Form และ Output อาจเป็นคนละชุด
- แก้ Autosave ไม่ restore เมื่อมี Last Document
- แก้ New Draft ไม่ล้าง Autosave/Last Document
- แก้ Settings ที่ใช้ตอน New Draft ให้เป็นค่าล่าสุด
- แก้ Service Worker คืน `index.html` ให้ resource ที่ไม่ใช่ navigation
- แก้ Service Worker cache response ที่ผิดสถานะ
- เพิ่ม error handling ตอน register Service Worker
- แก้ Version Drift ให้เป็น 1.2 ตรงกัน

### Changed

- Cache name เปลี่ยนจาก `lg-assistant-ready-v1-1` เป็น `lg-assistant-ready-v1-2`
- Navigation ใช้ network-first และ offline fallback เฉพาะ `index.html`
- Static asset cache จำกัดเฉพาะรายการที่กำหนดไว้
- Draft/Autosave เก็บ `outputFingerprint` เพื่อยืนยันว่า Output ตรงกับ Form

### Compatibility

- ไม่เปลี่ยน LocalStorage key เดิม
- ไม่ลบหรือ migrate ข้อมูลเดิมอัตโนมัติ
- รองรับ Backup v1.1 และ v1.2
- Draft เก่าที่ยังไม่มี fingerprint ยังคงเปิดได้

### Documentation

- เพิ่ม `BUG_REPORT.md`
- เพิ่ม `TEST_REPORT.md`
- อัปเดต `README.md` เป็น V1.2

### Not Included

ไม่มีการเพิ่ม AI Chat, Login, Database, Backend, API หรือฟีเจอร์ใหม่
