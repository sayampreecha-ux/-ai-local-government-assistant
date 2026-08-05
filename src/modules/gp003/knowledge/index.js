const sources = [
  ["procurement-act", "law", "พ.ร.บ.การจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ", "รัฐสภา", 100],
  ["finance-regulation", "regulation", "ระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้าง", "กระทรวงการคลัง", 90],
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
    source: `${title} Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01",
    category: slug, tags: ["procurement", slug], language: "th",
    confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective",
  },
})));
