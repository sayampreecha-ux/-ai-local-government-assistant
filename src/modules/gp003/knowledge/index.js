const sources = [
  ["procurement-act", "law", "พ.ร.บ.การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ", "รัฐสภา", 100],
  ["finance-regulation", "regulation", "ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้าง", "กระทรวงการคลัง", 90],
  ["cgd-v727-service-contract", "circular", "กค (กวจ) 0405.2/ว 727 ลงวันที่ 22 กันยายน 2569 เรื่อง ซ้อมความเข้าใจงานจ้างเหมาบริการ (บุคคลธรรมดา)", "กรมบัญชีกลาง/คณะกรรมการวินิจฉัยปัญหาการจัดซื้อจัดจ้างฯ", 98],
  ["dla-v9636-service-contract", "circular", "มท 0808.2/ว 9636 ลงวันที่ 10 กันยายน 2567 หลักเกณฑ์การจ้างเหมาบริการขององค์กรปกครองส่วนท้องถิ่น", "กระทรวงมหาดไทย", 96],
  ["cgd-circulars", "circular", "หนังสือเวียนกรมบัญชีกลาง", "กรมบัญชีกลาง", 75],
  ["legal-rulings", "manual", "แนววินิจฉัยด้านการจัดซื้อจัดจ้าง", "คณะกรรมการวินิจฉัย", 80],
  ["court-precedents", "law", "แนวคำพิพากษาที่เกี่ยวข้อง", "ศาลที่มีเขตอำนาจ", 85],
  ["nacc-guidance", "manual", "แนวทาง ป.ป.ช.", "สำนักงาน ป.ป.ช.", 70],
  ["sao-guidance", "manual", "แนวทาง สตง.", "สำนักงานการตรวจเงินแผ่นดิน", 70],
];

export const GP003_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp003-${slug}`,
  type,
  title,
  reference: `govprompt://knowledge/gp003/${slug}`,
  metadata: {
    source: `${title} Controlled Corpus`,
    authority,
    version: slug === "cgd-v727-service-contract" ? "2569-09-22" : "1.0",
    effectiveDate: slug === "cgd-v727-service-contract" ? "2026-09-22" : "2026-01-01",
    category: slug, tags: ["procurement", slug], language: "th",
    confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective",
  },
})));
