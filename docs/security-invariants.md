# GovPrompt Security Invariants

สถานะ: Mandatory release policy

หลักถาวรของ GovPrompt: **Security before convenience.** ความปลอดภัยและการคุ้มครองข้อมูลต้องทำงานก่อน UI, Router, Search, Prompt Engine, History และ external handoff ทุกครั้ง

## Invariant 1 — Privacy First
ข้อความจากผู้ใช้ต้องผ่าน Privacy Guard ก่อนกระบวนการอื่นทั้งหมด ห้าม render ข้อมูลต้นฉบับที่ตรวจพบว่าเป็น PII/ข้อมูลเสี่ยงลง conversation หลัง submit และห้ามส่งข้อมูลต้นฉบับดังกล่าวไป Router, live search, Prompt, History หรือบริการภายนอก

## Invariant 2 — Sensitive Data Fail Closed
ข้อมูลอ่อนไหวหรือข้อมูลลับที่ตรวจพบต้องหยุด workflow ทั้งคำขอ (fail closed) ไม่อนุญาตให้ bypass เพื่อความสะดวก ครอบคลุมอย่างน้อยข้อมูลสุขภาพ/ความพิการ พันธุกรรม ชีวมิติ เชื้อชาติ/ชาติพันธุ์ ความคิดเห็นทางการเมือง ศาสนา/ความเชื่อ พฤติกรรมหรือรสนิยมทางเพศ ประวัติอาชญากรรม สหภาพแรงงาน ข้อมูลลับราชการ credentials, API keys, tokens และ private keys

## Invariant 3 — PII Redaction Before Processing
เลขประจำตัวประชาชน 13 หลัก ชื่อบุคคล อีเมล โทรศัพท์ เลขบัญชี/พร้อมเพย์ รหัสผู้ป่วย HN/AN วันเกิด ที่อยู่ ทะเบียนรถ และตัวระบุอื่นที่รองรับ ต้องถูกปกปิดก่อนประมวลผลต่อ และข้อความที่ผ่านไปยัง workflow ต้องไม่มีค่า PII เดิมหลงเหลือ

## Invariant 4 — No External Request on Block
เมื่อ Privacy Guard ตัดสินเป็น blocked ต้องไม่มี external request เกิดขึ้น และต้องไม่มี raw query echo ใน response/log ที่แอปควบคุมได้

## Invariant 5 — Regression Lock
บั๊กด้าน privacy/security ที่เคยเกิดขึ้นต้องมี regression test ถาวร การแก้ test ให้ผ่านโดยลดมาตรการความปลอดภัยถือเป็น release blocker

## Invariant 6 — Release Gate
ทุก Pull Request และการ deploy production ต้องผ่าน Security Invariant Test, full test suite และ build ก่อน release หาก Security Invariant Test ล้มเหลว ห้าม merge/deploy

## Incident rule
เมื่อพบข้อมูลจริงหลุดผ่าน UI/Router/Search/Prompt/History/external handoff ให้จัดระดับ P0, แก้ที่ต้นเหตุ, เพิ่ม regression test และห้าม merge จน CI ผ่านครบ
