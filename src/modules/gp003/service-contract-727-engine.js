const CONTROL_SIGNALS = [
  { code: "employee-like-title", pattern: /\b(?:ตำแหน่ง|พนักงาน|ลูกจ้าง|ผู้ใต้บังคับบัญชา)\b/i, label: "ถ้อยคำลักษณะตำแหน่ง/ลูกจ้าง" },
  { code: "fixed-working-hours", pattern: /(?:ลงเวลา(?:ปฏิบัติงาน)?|เข้า[-–]?ออกงาน|08\s*[:.]?\s*30|16\s*[:.]?\s*30|เต็มเวลา|เวลาราชการ|จันทร์ถึงศุกร์)/i, label: "กำหนดเวลาทำงานแบบควบคุมบุคลากร" },
  { code: "leave-control", pattern: /(?:ลาป่วย|ลากิจ|ลาพักผ่อน|วันลา)/i, label: "ระบบการลาแบบบุคลากร" },
  { code: "command-control", pattern: /(?:ผู้บังคับบัญชา|ผู้ใต้บังคับบัญชา|รับคำสั่ง|มอบหมาย(?:งาน)?(?:ประจำ|รายวัน)|ควบคุมการปฏิบัติงาน)/i, label: "การบังคับบัญชา/ควบคุมการทำงาน" },
  { code: "attendance-control", pattern: /(?:เช็กชื่อ|ลงชื่อเข้างาน|บัญชีลงเวลา|ขาดงาน|สาย|ตอกบัตร)/i, label: "การควบคุมการมาปฏิบัติงาน" },
];

const DELIVERABLE_SIGNALS = [
  /(?:ผลสำเร็จของงาน|ผลงาน|ผลผลิต|ชิ้นงาน|ส่งมอบ|งวดงาน|เกณฑ์ตรวจรับ|ตรวจรับงาน|deliverable|acceptance)/i,
  /(?:รายงาน|เอกสาร|ฐานข้อมูล|ระบบ|แบบ|รายการ|คู่มือ|ผลการดำเนินงาน)/i,
];

const SUBSTITUTE_SIGNALS = [
  /(?:จัดหาบุคคลอื่น|ผู้แทน|บุคคลอื่นปฏิบัติแทน|เปลี่ยนผู้ปฏิบัติงาน)/i,
];

function collectText(input) {
  const specs = Array.isArray(input?.specifications) ? input.specifications.map((x) => x?.requirement ?? "") : [];
  const terms = Array.isArray(input?.contractTerms) ? input.contractTerms : [];
  return [input?.objective ?? "", ...specs, ...terms].join(" ");
}

export function reviewServiceContract727(input) {
  const text = collectText(input);
  const signals = CONTROL_SIGNALS
    .filter(({ pattern }) => pattern.test(text))
    .map(({ code, label }) => ({ code, label }));
  const deliverableEvidence = DELIVERABLE_SIGNALS.filter((pattern) => pattern.test(text)).length;
  const substitutionEvidence = SUBSTITUTE_SIGNALS.some((pattern) => pattern.test(text));

  const strongControl =
    signals.some(({ code }) => ["command-control", "leave-control"].includes(code)) ||
    signals.filter(({ code }) => ["fixed-working-hours", "attendance-control"].includes(code)).length >= 2;

  const substanceRisk =
    strongControl ||
    (signals.length >= 2 && deliverableEvidence === 0) ||
    (signals.length >= 1 && deliverableEvidence === 0 && !substitutionEvidence);

  const status = substanceRisk ? "review-required" : "no-control-risk-detected";
  const decisionLock = substanceRisk;

  return {
    authority: {
      reference: "กค (กวจ) 0405.2/ว 727",
      date: "22 กันยายน 2569",
      title: "ซ้อมความเข้าใจงานจ้างเหมาบริการ (บุคคลธรรมดา) ตามพระราชบัญญัติการจัดซื้อจัดจ้างฯ พ.ศ. 2560",
      principle: "ตรวจสาระของความสัมพันธ์และผลสำเร็จของงาน ไม่ตัดสินจากคำคำเดียว",
    },
    status,
    decisionLock,
    riskSignals: signals,
    deliverableEvidence,
    substitutionEvidence,
    assessment:
      status === "review-required"
        ? "พบถ้อยคำหรือลักษณะที่อาจสื่อถึงการควบคุมบุคคลแบบลูกจ้าง ควรปรับ TOR ให้เน้นผลสำเร็จของงาน งวดส่งมอบ และเกณฑ์ตรวจรับ แล้วทบทวนความสัมพันธ์ระหว่างคู่สัญญา"
        : "ไม่พบสัญญาณควบคุมบุคคลที่เพียงพอจากข้อมูลที่ให้ แต่ยังต้องตรวจ TOR และสัญญาฉบับเต็มตามข้อเท็จจริง",
    prohibitedWordRule: false,
    note: "การพบคำ เช่น ลงเวลา ปฏิบัติงานด้วยตนเอง หรือตำแหน่ง ไม่ใช่เหตุให้สรุปว่าผิดโดยอัตโนมัติ ต้องพิจารณาบริบทและสาระของการจ้าง",
  };
}
