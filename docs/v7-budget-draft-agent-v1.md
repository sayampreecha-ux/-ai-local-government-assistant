# GovPrompt V7 — Budget Draft Agent v1

## Goal

ทำให้ผู้ใช้สั่งงานสั้น เช่น `ทำร่างงบปี 70 อบจ.พะเยา` แล้ว GovPrompt เดิน workflow งานงบประมาณแบบหลายขั้นต่อจาก Workflow Runtime Bridge v5 โดยไม่ต้องให้ผู้ใช้เขียน prompt ยาว และโดยไม่สร้าง orchestration ซ้ำอีกชุด

## Existing foundation

ฐานที่ต้องใช้ต่อจากระบบเดิม:

- Intent / workflow detection
- State machine
- Evidence gates
- Risk gates
- Deliverable contracts
- Case orchestrator
- Privacy-first runtime bridge v5
- Human approval gates

หลักการ: เพิ่ม `Budget Draft Agent` เป็น execution profile/workflow ของระบบเดิม ไม่สร้าง agent แยกที่ข้าม governance ของ V7

## User command examples

- `ทำร่างงบปี 70 อบจ.พะเยา`
- `ร่างงบประมาณรายจ่ายปี 2570`
- `ช่วยทำข้อบัญญัติงบประมาณปีหน้า`
- `ทำกรอบงบ 2570 ของ อบจ.`
- `สรุปคำของบทุกกองแล้วจัดร่างงบ`

## Budget workflow stages

1. `budget-context`
   - ระบุปีงบประมาณ
   - หน่วยงาน / ประเภท อปท.
   - งบปีฐาน
   - สถานะร่าง/เสนอ/ประกาศใช้

2. `baseline-budget`
   - โหลดข้อบัญญัติ/งบปีฐาน
   - แยกรายรับ/รายจ่าย/แผนงาน/งบ
   - เก็บ provenance ของเอกสารต้นทาง

3. `revenue-forecast`
   - รายได้จัดเก็บเอง
   - ภาษีจัดสรร
   - เงินอุดหนุน
   - รายรับอื่น
   - แยก `verified`, `estimated`, `pending-confirmation`

4. `plan-project-linkage`
   - ตรวจแผนพัฒนาท้องถิ่นฉบับที่มีผลใช้บังคับ
   - คัดเฉพาะโครงการปีเป้าหมาย
   - ห้ามแต่งชื่อโครงการหรือวงเงินที่ไม่มีหลักฐาน

5. `personnel-obligations`
   - ภาระบุคลากร
   - ภาระผูกพัน
   - รายจ่ายประจำจำเป็น
   - ใช้ข้อมูลรวมเท่าที่จำเป็น หลีกเลี่ยงข้อมูลส่วนบุคคลรายคน

6. `budget-allocation`
   - สำนัก/กอง
   - แผนงาน
   - งาน
   - งบ
   - หมวด/ประเภท
   - โครงการ/รายการ

7. `priority-readiness`
   - A = จำเป็น/พร้อม
   - B = สำคัญ
   - C = ทำเมื่อมีวงเงิน
   - Reserve = หลักฐานหรือความพร้อมยังไม่ครบ

8. `risk-review`
   - อำนาจหน้าที่
   - อยู่ในแผน
   - readiness
   - procurement risk
   - duplicate funding
   - privacy / PII

9. `budget-balance`
   - รายรับรวม = รายจ่ายรวม
   - ตรวจสูตร/ยอดรวม
   - ห้าม final หากยอดไม่สมดุล

10. `deliverables`
    - executive summary
    - baseline sheet
    - revenue forecast sheet
    - request register
    - priority matrix
    - risk register
    - balance check
    - structured export
    - Excel/Word artifact เมื่อ backend รองรับ

11. `human-approval`
    - AI ห้ามอนุมัติแทนผู้มีอำนาจ
    - final ต้องมี human gate

## Evidence model

ทุกตัวเลข/ข้อเท็จจริงที่ใช้ในร่างงบต้องมีสถานะอย่างใดอย่างหนึ่ง:

- `verified` — มีหลักฐานและผ่านการยืนยันแหล่งต้นฉบับ
- `estimated` — ประมาณการจากฐานที่ระบุชัด
- `pending-confirmation` — ยังรอหนังสือ/ข้อมูลจริง

ห้ามแสดง `estimated` หรือ `pending-confirmation` เสมือนเป็นข้อเท็จจริงที่ยืนยันแล้ว

## Tool registry target

### Phase A — orchestration profile

- workflow detection
- evidence requirements
- deliverable contracts
- balance validator
- risk gates

### Phase B — official retrieval

- `search_official_sources`
- `fetch_document`
- `extract_document`
- `verify_sources`

### Phase C — artifact execution

- `calculate_budget`
- `generate_file`

## Security and governance invariants

- Privacy Guard ต้องทำงานก่อน router/search/workflow/prompt/history
- ห้าม raw PII เข้า workflow state โดยไม่จำเป็น
- ห้ามสร้างเลขหนังสือ กฎหมาย ราคา ผู้มีอำนาจ ตัวเลขรายรับ หรือชื่อโครงการที่ไม่มี evidence
- current-law/current-budget facts ต้องผ่าน official-source + freshness gate
- final artifact ต้องมี provenance/evidence linkage
- human approval required ก่อน final
- fail closed เมื่อหลักฐานสำคัญขาด

## Acceptance tests

### Routing

คำสั่งต่อไปนี้ต้องเข้า Budget Draft profile และไม่จบแค่ `gov.finance` ทั่วไป:

1. `ทำร่างงบปี 70 อบจ.พะเยา`
2. `ร่างงบประมาณรายจ่ายปี 2570`
3. `ช่วยทำข้อบัญญัติงบประมาณปีหน้า`
4. `ทำกรอบงบ 2570 ของ อบจ.`
5. `สรุปคำของบทุกกองแล้วจัดร่างงบ`

### Evidence

- ไม่มีงบปีฐาน → stage ต้องขอ baseline evidence
- ไม่มีรายรับล่าสุด → ห้ามฟันธงประมาณการรายรับ
- ไม่มีแผนปีเป้าหมาย → ห้ามสร้าง project list
- ข้อมูล current แต่ไม่มี official/freshness verification → fail closed หรือระบุ pending-confirmation

### Calculation

- รายรับ != รายจ่าย → final blocked
- สูตรรวมผิด → validation failed
- `estimated` ต้องถูก label ชัดเจน

### Deliverables

- structured export ต้องมี source/evidence keys
- final deliverable ต้องผ่าน contract validation
- human sign-off required เมื่อเข้าสู่ final stage

## Implementation order

1. เพิ่ม Budget Draft detection/profile บน workflow suite เดิม
2. เพิ่ม stages + deliverable contracts
3. เพิ่ม budget balance validator และ risk rules
4. เพิ่ม unit/regression tests
5. ต่อ official-source tool execution
6. ต่อ Excel/Word artifact generation
7. production verification ก่อน merge main

## Branch

`feature/v7-budget-draft-agent-v1`

## Tracking

Issue #104
