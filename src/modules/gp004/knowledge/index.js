const sources = [
  ["moi-regulations", "regulation", "ระเบียบกระทรวงมหาดไทย", "กระทรวงมหาดไทย", 90],
  ["finance-regulations", "regulation", "ระเบียบกระทรวงการคลัง", "กระทรวงการคลัง", 95],
  ["cgd-circulars", "circular", "หนังสือเวียนกรมบัญชีกลาง", "กรมบัญชีกลาง", 80],
  ["dla-letters", "circular", "หนังสือ สถ.", "กรมส่งเสริมการปกครองท้องถิ่น", 75],
  ["consultation-replies", "manual", "หนังสือตอบข้อหารือ", "หน่วยงานผู้มีอำนาจ", 65],
  ["finance-rulings", "manual", "แนววินิจฉัยด้านการเงิน", "คณะกรรมการวินิจฉัย", 80],
  ["sao-audit-guidance", "manual", "แนวตรวจ สตง.", "สำนักงานการตรวจเงินแผ่นดิน", 85],
];

export const GP004_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp004-${slug}`,
  type,
  title,
  reference: `govprompt://knowledge/gp004/${slug}`,
  metadata: {
    source: `${title} GP004 Finance Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01",
    category: slug, tags: ["public-finance", slug], language: "th",
    confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective",
  },
})));
