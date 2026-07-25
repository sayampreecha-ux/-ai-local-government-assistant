# GovPrompt Thailand Starter Kit v1.0

ระบบรหัสเข้าใช้งานแบบง่ายสำหรับ **GovPrompt Thailand Professional**

## โครงสร้าง

```text
access-system/
├── index.html      หน้าสำหรับลูกค้ากรอกรหัส
├── admin.html      หน้าผู้ดูแลสำหรับสร้างและจัดการรหัส
├── members.json    ไฟล์สำรองโครงสร้างข้อมูลสำหรับการพัฒนาในอนาคต
├── assets/         พื้นที่เก็บรูปภาพและโลโก้
├── css/            พื้นที่แยกไฟล์ CSS ในอนาคต
└── js/             พื้นที่แยกไฟล์ JavaScript ในอนาคต
```

## รหัสผ่านผู้ดูแลเริ่มต้น

```text
GPADMIN-2569!
```

## วิธีติดตั้งใน Repository เดิม

1. แตกไฟล์ ZIP
2. เปิดโฟลเดอร์ `access-system`
3. คัดลอกไฟล์และโฟลเดอร์ทั้งหมดไปยังโฟลเดอร์ `access-system` ใน Repository
4. เปิด GitHub Desktop
5. ใส่ Summary ว่า `Add GovPrompt access system v1.0`
6. กด **Commit to main**
7. กด **Push origin**

## URL หลัง Deploy

- หน้าลูกค้า: `/access-system/`
- หน้าผู้ดูแล: `/access-system/admin.html`

## ข้อจำกัดสำคัญ

เวอร์ชันนี้เป็นระบบฝั่งเบราว์เซอร์ ข้อมูลลูกค้าที่ออกจากหน้า Admin จะเก็บใน `localStorage` ของเครื่องผู้ดูแล ควรส่งออก CSV สำรองเป็นระยะ และไม่ควรใช้เป็นระบบความปลอดภัยระดับสูงโดยไม่มี Backend
