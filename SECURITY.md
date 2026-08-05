# Security Policy — GovPrompt Thailand

## สถานะระบบปัจจุบัน
เว็บไซต์หลักเผยแพร่ผ่าน GitHub Pages และทำงานแบบ Static จึงไม่มีระบบอัปโหลดไฟล์ ฐานข้อมูล หรือการเก็บ API Key ในหน้าเว็บ

## มาตรการที่ต้องใช้กับระบบปัจจุบัน
- บังคับใช้ HTTPS สำหรับ GitHub Pages
- เปิด Two-factor authentication (2FA) สำหรับบัญชีผู้ดูแล GitHub
- เปิด Dependency graph, Dependabot alerts และ Dependabot security updates เมื่อ Repository มีแพ็กเกจที่รองรับ
- เปิด Secret scanning และ Push protection เมื่อบัญชีและ Repository รองรับ
- ห้ามบันทึก API Key, Access Token, Password, Secret หรือข้อมูลรับรองใด ๆ ลงใน HTML, CSS, JavaScript หรือประวัติ Git
- ตรวจสอบ Commit และไฟล์ที่เปลี่ยนแปลงก่อนเผยแพร่ทุกครั้ง
- ไม่ใช้หน้าเว็บเป็นที่เก็บเอกสารราชการ ข้อมูลส่วนบุคคล หรือข้อมูลอ่อนไหว

## ระบบที่อาจเพิ่มในอนาคต
หากภายหลังมี Server Functions, Supabase, ระบบสมาชิก ระบบชำระเงิน หรือระบบอัปโหลดไฟล์ ให้ใช้มาตรการต่อไปนี้เพิ่มเติม

- Prompt หลักและ API Key ต้องอยู่ใน Server Functions เท่านั้น
- Access Code ต้องเก็บเป็นค่า hash ไม่เก็บรหัสเต็ม
- Member, Admin และ Payment Proof ต้องใช้ Session แยกชนิดและมีวันหมดอายุ
- Supabase Secret key ห้ามส่งลง Browser
- Storage bucket สำหรับหลักฐานหรือเอกสารต้องเป็น Private และอ่านผ่าน Signed URL ชั่วคราว
- จำกัดขนาดไฟล์ ตรวจ MIME type และสแกนมัลแวร์ก่อนจัดเก็บ
- Rate Limit ควรใช้ IP hash และไม่เก็บ IP ดิบเกินความจำเป็น
- ไม่บันทึกเนื้อหางานหรือผล AI ฉบับเต็มโดยไม่จำเป็น
- Audit log เก็บเฉพาะกิจกรรมระบบและ metadata ที่จำเป็น
- ใช้ CSP, HSTS, X-Frame-Options และป้องกันการเข้าถึงหน้า Admin/API

## การแจ้งช่องโหว่
หากพบช่องโหว่ โปรดอย่าเผยแพร่รายละเอียดสู่สาธารณะทันที ให้แจ้งผู้ดูแล GovPrompt Thailand เพื่อให้ตรวจสอบและแก้ไขก่อน

## Incident Response
1. ระงับบัญชี รหัส หรือ Token ที่สงสัยทันที
2. เพิกถอนและออก ADMIN_SECRET, SESSION_SECRET และ API Key ใหม่
3. ตรวจประวัติ Commit, GitHub Actions logs และ Log ของระบบที่เชื่อมต่อ
4. ลบข้อมูลหรือหลักฐานที่ไม่จำเป็นตามนโยบายเก็บรักษา
5. แจ้งผู้ได้รับผลกระทบเมื่อกฎหมายหรือระดับความเสี่ยงกำหนด

## ข้อจำกัดการใช้งาน
GovPrompt Thailand เป็นเครื่องมือช่วยร่างและวิเคราะห์เบื้องต้น ผู้ใช้งานต้องตรวจสอบข้อเท็จจริง กฎหมาย ระเบียบ อำนาจอนุมัติ และข้อมูลส่วนบุคคลก่อนนำผลลัพธ์ไปใช้จริง
