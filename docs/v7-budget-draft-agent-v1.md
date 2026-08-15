# GovPrompt V7 — Budget Draft Agent v1

## Goal

ให้ผู้ใช้พิมพ์คำสั่งสั้น เช่น `ทำร่างงบปี 70 อบจ.พะเยา` แล้ว GovPrompt เดินงานร่างงบประมาณแบบหลายขั้นเอง โดยใช้ Workflow Runtime V5 เดิม ไม่สร้าง orchestration ซ้ำ และไม่แต่งตัวเลข/โครงการ/กฎหมายที่ไม่มีหลักฐาน

## Runtime

`gov.budget-draft` มี 11 stages:

1. `budget-context`
2. `baseline-budget`
3. `revenue-forecast`
4. `plan-project-linkage`
5. `personnel-obligations`
6. `budget-allocation`
7. `priority-readiness`
8. `risk-review`
9. `budget-balance`
10. `deliverables`
11. `human-approval`

## Implemented

- short-command routing เข้า `gov.budget-draft` เป็น primary workflow
- official-source-first + freshness/current gate
- ค้นหลักเกณฑ์ปัจจุบัน งบปีฐาน รายรับจริงล่าสุด และแผนปีเป้าหมาย
- Worker v2 ค้นแหล่งราชการไทย `.go.th` และอ่านเอกสารต้นฉบับผ่าน governed document endpoint
- deterministic parser สำหรับข้อบัญญัติงบปีฐาน รายรับจริง และแผนพัฒนาท้องถิ่น
- search metadata เป็นเพียง source pointer; ห้ามยกระดับเป็นข้อมูลบัญชีจนอ่านเอกสารจริง
- content hash + source URL binding + read timestamp + provenance
- browser file intake แบบ privacy-first; raw filename ไม่เข้า evidence
- deterministic JSON/CSV/XLSX/DOCX parsing; PDF upload ที่อ่านไม่ได้ใน browser จะ fail closed ส่วน PDF ราชการจาก URL ใช้ official document reader
- parser output ต้องผ่าน human confirmation ก่อน promotion เป็น internal evidence
- purpose picker/review gate สำหรับข้อมูลไฟล์ที่จำแนกไม่ชัด
- `verified` / `estimated` / `pending-confirmation` status contract
- conservative Working Draft planner: ไม่ขยายเพดานรวมเหนือปีฐานโดยอัตโนมัติ
- โครงการจากแผน default เป็น `Reserve / unverified` จนหลักฐาน readiness ครบ
- personnel placeholder จากปีฐานต้องติด `estimated`
- balance validator ตรวจทั้งรายรับ=รายจ่าย, declared total, line-item formula และ breakdown reconciliation
- Phayao 2570 real-case regression: จับ investment breakdown ที่คลาด 2,495,700 บาทได้และ fail closed
- governed deliverable artifacts `budget-draft` + `budget-structured-export`
- real XLSX และ DOCX Office Open XML export จาก governed structured artifact
- Home แสดง Budget Draft Agent status และดาวน์โหลด Excel/Word เมื่อ artifact พร้อม
- privacy guard ทำงานก่อน workflow/search/document execution
- human approval ยังเป็น final gate; AI ไม่อนุมัติงบแทนมนุษย์
- cache-busted production assets + exact-byte production verifier
- production security verifier สำหรับ Worker search/document endpoints
- Playwright production E2E สำหรับคำสั่งสั้น Budget Draft Agent

## Phayao 2570 regression fixture

ข้อมูลจากอินโฟกราฟิกผู้ใช้ถูกเก็บเป็น `pending-confirmation` จนเทียบต้นฉบับราชการ:

- รายรับ/รายจ่ายรวม 592,782,700 บาท
- รายรับ: 19,712,500 + 301,700,000 + 271,370,200
- รายจ่าย: 60,682,445 + 262,162,810 + 134,866,725 + 134,470,720 + 600,000
- investment set A: 22,770,000 + 111,700,720 = 134,470,720
- investment set B: 20,774,020 + 111,201,000 = 131,975,020 → ต่าง 2,495,700 บาท → `budget-breakdown-mismatch`
- personnel: 8,964,120 + 253,198,690 = 262,162,810
- permanent personnel: 113,960,390 + 139,238,300 = 253,198,690

## Governance invariants

- no fabrication
- PII/data minimization
- raw evidence values ไม่ออกจาก Workflow Runtime V5 safe projection
- official source + freshness required where current facts matter
- search snippet ≠ document content
- parser output ≠ trusted evidence until human confirmation
- uploaded-document hash binding
- audit trail + provenance
- fail closed on critical blockers
- final human sign-off required

## Merge gate

ห้าม merge เข้า `main` จนกว่า P0 verification, Security Release Gate และ Cloudflare credentials check ผ่านครบ

หลัง merge ต้องรอ deployment แล้วให้ `Verify Production Surface` ผ่านครบ:

- GitHub Pages exact asset verification
- Cloudflare Worker production security
- Issue #73 real-browser privacy E2E
- Budget Draft Agent short-command real-browser E2E

Issue #104 ปิดได้เมื่อ production verification ผ่านเท่านั้น
