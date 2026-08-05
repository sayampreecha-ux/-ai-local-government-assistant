# GovPrompt Thailand v7 Roadmap

## เป้าหมาย
ยกระดับ GovPrompt จากระบบที่พึ่ง Prompt รายโมดูล ไปสู่ Government AI Copilot แบบ Knowledge-driven โดยคง GP001–GP013 และ UI เดิมไว้ระหว่างการพัฒนา

## หลักการพัฒนา
- ไม่รื้อระบบเดิมพร้อมกันทั้งหมด
- แยกงานเป็น Sprint และ Branch
- ใช้ Master Prompt กลางร่วมกัน
- ให้ Search, Evidence, Reasoning และ Quality Gate เป็น Engine กลาง
- Merge เมื่อ Sprint เสร็จ และทดสอบใหญ่ก่อนเปิด v7 Beta

## Roadmap

### Sprint 1 — Master Prompt Engine
สถานะ: ดำเนินการแล้ว
- Master Prompt กลาง
- Prompt Registry สำหรับ GP001–GP013
- Shared Context
- Smoke Test

### Sprint 2 — Intent Router
- จำแนกคำถามเข้าสู่ GP001–GP013
- รองรับคำถามหลายโดเมน
- มี fallback เป็น General Government Assistant
- ส่งคืน confidence และเหตุผลการ route

### Sprint 3 — Knowledge Search Engine
- ค้นเอกสารผู้ใช้อัปโหลดก่อน
- ค้นฐานความรู้ภายใน
- รองรับ keyword, phrase และ semantic search
- ส่งคืน evidence chunks พร้อม metadata

### Sprint 4 — Search Ranking
- ให้คะแนน relevance
- ให้คะแนน authority ของแหล่งข้อมูล
- ตรวจวันที่และสถานะการใช้บังคับ
- ลดคะแนนเอกสารเก่า ยกเลิก หรือซ้ำ

### Sprint 5 — Evidence & Reasoning Engine
- แยกข้อเท็จจริง ฐานอำนาจ เงื่อนไข ข้อยกเว้น และความเสี่ยง
- เชื่อมข้อสรุปกับหลักฐาน
- ห้ามฟันธงเมื่อ evidence ไม่พอ

### Sprint 6 — Quality Gate
- PDPA checkpoint
- Citation completeness
- Hallucination risk
- Conflict detection
- Confidence score

### Sprint 7 — Integration GP001–GP013
- ให้ทุกโมดูลเรียก Engine กลาง
- เก็บ Prompt เดิมเป็น module-specific rules
- ตรวจ backward compatibility

### Sprint 8 — v7 Beta
- Regression test ทุกโมดูล
- ทดสอบเคสจริงงาน อปท.
- ตรวจ Mobile/Desktop
- เปิด Beta และเก็บ feedback

## Definition of Done ของ v7 Beta
- GP001–GP013 ใช้งานได้ครบ
- คำถามทั่วไป route ถูกต้อง
- ผลค้นหาแสดงแหล่งอ้างอิง
- มี PDPA และ confidence ในคำตอบเสี่ยง
- ไม่มี JavaScript error ที่ทำให้หน้าใช้งานไม่ได้
- มีชุดทดสอบขั้นต่ำ 100 เคส
