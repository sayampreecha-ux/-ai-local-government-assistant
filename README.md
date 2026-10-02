# GovPrompt Thailand — Release 2.0

Government AI Copilot สำหรับช่วยงานราชการไทย โดยยึดหลัก “AI ช่วยร่าง ข้าราชการช่วยตัดสินใจ”

## ขอบเขตที่เปิดใช้

- ผู้ช่วย 13 ด้าน ตั้งแต่สารบรรณ กฎหมาย พัสดุ การเงิน บุคคล งานช่าง สาธารณสุข การศึกษา ตรวจสอบภายใน ผู้บริหาร ประชาสัมพันธ์ และงานสภาท้องถิ่น
- สร้าง Prompt ในเบราว์เซอร์ ไม่มี Login, Database, Payment หรือ AI API
- ค้นหางาน พิมพ์ด้วยเสียง บันทึกร่างอัตโนมัติ และคัดลอก Prompt
- PDPA checkpoint เบื้องต้น พร้อมคำเตือนให้ตรวจข้อเท็จจริงและกฎหมายก่อนใช้จริง

## ตรวจสอบก่อนเผยแพร่

```bash
npm test
```

เว็บไซต์เผยแพร่ผ่าน GitHub Pages จากสาขา `main` โฟลเดอร์รากของรีโพ

ดูรายละเอียดที่ `RELEASE_NOTES_V2.0.md`

## GovPrompt v7 Sprint 1 Core

The repository also contains the centralized Context Manager, Transaction Router,
Prompt Registry, Knowledge Registry, Governance Layer, Observability, and standalone
GP001–GP012 modules. See `docs/architecture/sprint-1-acceptance.md` and
`docs/modules/` for architecture, integration, and acceptance documentation.

Run the complete website and Sprint 1 verification with `pnpm test` on Node.js 20
or newer. Core architecture is documented in
[`docs/architecture/shared-context-foundation.md`](docs/architecture/shared-context-foundation.md).

Transaction routing is documented in
[`docs/architecture/transaction-router.md`](docs/architecture/transaction-router.md).

Versioned prompt registration is documented in
[`docs/architecture/prompt-registry.md`](docs/architecture/prompt-registry.md).

Government knowledge registration and search are documented in
[`docs/architecture/knowledge-registry.md`](docs/architecture/knowledge-registry.md).

Policy, safety, authorization, and approval controls are documented in
[`docs/architecture/governance-layer.md`](docs/architecture/governance-layer.md).

Operational signals and Sprint 1 acceptance evidence are documented in
[`docs/architecture/observability.md`](docs/architecture/observability.md) and
[`docs/architecture/sprint-1-acceptance.md`](docs/architecture/sprint-1-acceptance.md).

Sprint 2 GP001 migration is documented in
[`docs/modules/gp001.md`](docs/modules/gp001.md). Run the executable example with
`node demo/gp001-demo.js`.

## Organization Workspace

เมนูองค์กรในหน้า GovPrompt ใช้ทางเข้าเดียวคือ **Workspace องค์กร** สำหรับ Work Tracking, Command Center และงานอัตโนมัติ โดยข้อมูลภายในยังคงควบคุมสิทธิ์ด้วยบัญชีองค์กรและ RLS แยกจากเครื่องมือสาธารณะของ GP.
