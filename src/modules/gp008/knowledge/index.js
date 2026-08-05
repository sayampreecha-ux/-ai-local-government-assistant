const sources = [
  ["moi-regulations", "regulation", "ระเบียบ มท.", "กระทรวงมหาดไทย", 90],
  ["dla-directives", "circular", "หนังสือสั่งการ สถ.", "กรมส่งเสริมการปกครองท้องถิ่น", 75],
  ["budget-regulations", "regulation", "ระเบียบงบประมาณ", "หน่วยงานด้านงบประมาณ", 90],
  ["procurement-regulations", "regulation", "ระเบียบพัสดุ", "กระทรวงการคลัง", 90],
  ["local-development-plan", "manual", "แผนพัฒนาท้องถิ่น", "องค์กรปกครองส่วนท้องถิ่น", 85],
  ["budget-plan", "manual", "แผนงบประมาณ", "องค์กรปกครองส่วนท้องถิ่น", 80],
  ["sao-guidance", "manual", "แนวตรวจ สตง.", "สำนักงานการตรวจเงินแผ่นดิน", 80],
  ["nacc-guidance", "manual", "แนว ป.ป.ช.", "สำนักงาน ป.ป.ช.", 80],
];
export const GP008_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp008-${slug}`, type, title, reference: `govprompt://knowledge/gp008/${slug}`,
  metadata: { source: `${title} GP008 Project Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["local-project", slug], language: "th", confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective" },
})));
