# Approval Data Schema v1.0

## 1. Purpose

กำหนดโครงสร้างข้อมูลกลางสำหรับกระบวนงานตั้งแต่รับคำขอจนถึงพร้อมเสนอผู้มีอำนาจอนุมัติ โดยใช้ข้อมูลชุดเดียวร่วมกันระหว่าง Smart Saraban, การจำแนกวัสดุ/ครุภัณฑ์, งานพัสดุ, การตรวจฐานอำนาจ และ Quality Gates

หลักสำคัญ:

- เก็บข้อเท็จจริงแยกจากข้อสันนิษฐานและข้อมูลที่ยังขาด
- ไม่ให้ AI เติมเลขที่หนังสือ วันที่ วงเงิน ผู้มีอำนาจ หรือสถานะอนุมัติเอง
- รองรับกรณีข้อมูลขัดแย้งและการแก้ไขย้อนหลังโดยมี audit trail
- แยก `ค้นหาได้` ออกจาก `ตัดสินใจได้`
- การสร้างร่างเอกสารต้องขึ้นกับสถานะและหลักฐาน ไม่ใช่เพียงคำสั่งของผู้ใช้

## 2. Canonical object: `ApprovalCase`

```yaml
ApprovalCase:
  caseId: string
  schemaVersion: string
  createdAt: datetime
  updatedAt: datetime
  sourceChannel: enum[smart_saraban, manual, import, api]
  requester:
    name: string|null
    position: string|null
    unit: string|null
    contact: string|null
  owningUnit: string|null
  requestText: string
  requestObjective: string|null
  facts:
    - id: string
      statement: string
      source: enum[user, document, system, verified_external]
      evidenceRef: string|null
      confidence: enum[confirmed, probable, unverified]
  assumptions:
    - id: string
      statement: string
      impact: string
  missingInformation:
    - field: string
      reason: string
      blocking: boolean
  items:
    - itemId: string
      description: string
      quantity: number|null
      unit: string|null
      specification: string|null
      intendedUse: string|null
      expectedUsefulLife: string|null
      movableOrFixed: enum[movable, fixed, unknown]
      classification: enum[confirmed_material, confirmed_asset, other, pending_evidence, conflicting]
      classificationBasis: string|null
      classificationEvidence: string[]
  estimatedAmount:
    value: number|null
    currency: string
    source: string|null
    status: enum[not_provided, estimated, verified]
  fundingSource:
    type: string|null
    fiscalYear: string|null
    budgetLine: string|null
    balanceVerified: boolean
  budgetCategory: string|null
  expenditureClassification: string|null
  procurementIntent:
    type: enum[purchase, hire, construction, service, repair, other, unknown]
    methodCandidate: string|null
    aggregationRisk: enum[not_checked, low, medium, high]
  approvalStage: enum[principle, procurement_initiation, tor_spec, purchase_report, award_order, acceptance_payment, unknown]
  candidateDocumentTypes: string[]
  authorityQuestions:
    - question: string
      status: enum[open, researched, resolved, conflicting]
      applicableTime: string|null
      responsibleAuthority: string|null
  evidenceReferences:
    - id: string
      title: string
      issuer: string|null
      documentDate: string|null
      effectiveDate: string|null
      versionStatus: enum[current, amended, repealed, unknown]
      sourceUrl: string|null
      excerpt: string|null
      relevance: string
  requiredAttachments:
    - name: string
      status: enum[missing, supplied, verified, not_applicable]
      blocking: boolean
  riskFlags:
    - code: string
      severity: enum[low, medium, high, critical]
      description: string
      mitigation: string|null
  qualityGateResult:
    overall: enum[not_run, pass, conditional_pass, fail]
    checks:
      - code: string
        result: enum[pass, fail, not_applicable, pending]
        evidence: string|null
        remediation: string|null
  decisionLock:
    enabled: boolean
    reasons: string[]
    unlockConditions: string[]
  humanReviewStatus: enum[not_started, required, in_review, returned, approved_for_submission]
  auditTrail:
    - timestamp: datetime
      actor: string
      action: string
      before: string|null
      after: string|null
      evidenceRef: string|null
```

## 3. Required invariants

1. `caseId` และ `schemaVersion` ต้องมีทุกกรณี
2. ทุกข้อสรุปด้านกฎหมาย การเงิน พัสดุ และอำนาจอนุมัติต้องมี `evidenceReferences` หรือถูกระบุว่าเป็นข้อเสนอเพื่อค้นต่อ
3. ถ้า `facts` ยังไม่ยืนยัน หรือมี `conflicting` classification ห้ามเปลี่ยนเป็น `DRAFT_ALLOWED` โดยอัตโนมัติ
4. ถ้า `decisionLock.enabled = true` ห้ามแสดงผลเป็นคำตอบสุดท้ายหรือสร้างเอกสารพร้อมลงนาม
5. `estimatedAmount.status = verified` ต้องมีแหล่งที่มาและผู้ตรวจสอบ ไม่ใช่ค่าที่ AI คำนวณขึ้นโดยไม่มีหลักฐาน
6. การจำแนกวัสดุ/ครุภัณฑ์ต้องเก็บเหตุผลและหลักฐานรายรายการ ไม่ใช้ชื่อรายการเพียงอย่างเดียว
7. การเปลี่ยนข้อมูลสำคัญต้องเพิ่มรายการใน `auditTrail` และไม่ลบประวัติเดิม
8. ข้อมูลที่ไม่ทราบต้องเป็น `null`, `unknown`, `pending` หรือ `missing` ตามชนิดข้อมูล ห้ามเดาเติม

## 4. Decision-lock triggers

ให้เปิด `decisionLock` เมื่อเกิดอย่างน้อยหนึ่งกรณี:

- ไม่ทราบหรือไม่ยืนยันผู้มีอำนาจ/หน่วยงานเจ้าของเรื่อง
- พบกฎหมายหรือหนังสือสั่งการหลายฉบับที่อาจใช้ต่างช่วงเวลา
- พบหลักฐานขัดแย้งกัน
- ไม่สามารถยืนยันการมีผลใช้บังคับ ฉบับแก้ไข หรือการยกเลิกของแหล่งอ้างอิง
- วงเงิน แหล่งเงิน ประเภทพัสดุ หรือวิธีจัดซื้อจัดจ้างมีผลต่อคำตอบแต่ยังไม่ครบ
- มีความเสี่ยงแบ่งซื้อแบ่งจ้าง ผลประโยชน์ทับซ้อน หรือการกำหนดคุณลักษณะเฉพาะแบบล็อกยี่ห้อ
- มีการขอให้สร้างเอกสารขั้นที่ยังไม่มีการอนุมัติในขั้นก่อนหน้า

## 5. Output projections

จาก `ApprovalCase` ระบบอาจสร้างมุมมองต่อไปนี้โดยไม่สร้างข้อมูลใหม่:

- `FactSummary`: ข้อเท็จจริง/ข้อสันนิษฐาน/ข้อมูลที่ขาด
- `ClassificationReport`: วัสดุ/ครุภัณฑ์/อื่น/รอตรวจ พร้อมเหตุผลและหลักฐาน
- `ApprovalPath`: ขั้นตอนที่เหมาะสมและเงื่อนไขก่อนขยับขั้น
- `EvidenceRequest`: รายการกฎหมาย หนังสือสั่งการ และเอกสารที่ต้องค้นหรือแนบ
- `DraftPackage`: ร่างเอกสารเฉพาะเมื่อผ่านเงื่อนไขของสถานะ
- `RiskReport`: ความเสี่ยงและแนวทางลดความเสี่ยง

## 6. Privacy and data minimization

เก็บเฉพาะข้อมูลที่จำเป็นต่อการปฏิบัติงาน จำกัดการแสดงข้อมูลส่วนบุคคลตามบทบาทผู้ใช้งาน และบันทึกการเข้าถึง/แก้ไขข้อมูลสำคัญใน audit trail
