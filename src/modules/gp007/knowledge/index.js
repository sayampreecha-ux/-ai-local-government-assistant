const sources = [
  ["pao-act", "law", "พระราชบัญญัติองค์การบริหารส่วนจังหวัด", "รัฐสภา", 100],
  ["municipality-act", "law", "พระราชบัญญัติเทศบาล", "รัฐสภา", 100],
  ["tambon-act", "law", "พระราชบัญญัติสภาตำบลและองค์การบริหารส่วนตำบล", "รัฐสภา", 100],
  ["moi-council-meeting", "regulation", "ระเบียบกระทรวงมหาดไทยเกี่ยวกับการประชุมสภา", "กระทรวงมหาดไทย", 90],
  ["dla-directives", "circular", "หนังสือสั่งการกรมส่งเสริมการปกครองท้องถิ่น", "กรมส่งเสริมการปกครองท้องถิ่น", 75],
  ["rulings-consultations", "manual", "คำวินิจฉัยและข้อหารือที่เกี่ยวข้อง", "หน่วยงานผู้มีอำนาจ", 80],
  ["sao-guidance", "manual", "แนวตรวจ สตง.", "สำนักงานการตรวจเงินแผ่นดิน", 75],
  ["nacc-guidance", "manual", "แนวทาง ป.ป.ช.", "สำนักงาน ป.ป.ช.", 75],
];
export const GP007_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp007-${slug}`, type, title, reference: `govprompt://knowledge/gp007/${slug}`,
  metadata: { source: `${title} GP007 Council Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["local-council", slug], language: "th", confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective" },
})));
