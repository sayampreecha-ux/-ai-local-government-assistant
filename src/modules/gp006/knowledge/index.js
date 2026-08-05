const sources = [
  ["local-personnel-act", "law", "พระราชบัญญัติระเบียบข้าราชการท้องถิ่น", "รัฐสภา", 100],
  ["position-standards", "manual", "มาตรฐานกำหนดตำแหน่ง", "คณะกรรมการมาตรฐานการบริหารงานบุคคลส่วนท้องถิ่น", 90],
  ["provincial-committee", "regulation", "ประกาศ ก.จ.", "คณะกรรมการข้าราชการองค์การบริหารส่วนจังหวัด", 85],
  ["municipal-committee", "regulation", "ประกาศ ก.ท.", "คณะกรรมการพนักงานเทศบาล", 85],
  ["subdistrict-committee", "regulation", "ประกาศ ก.อบต.", "คณะกรรมการพนักงานส่วนตำบล", 85],
  ["dla-letters", "circular", "หนังสือ สถ.", "กรมส่งเสริมการปกครองท้องถิ่น", 75],
  ["consultation-replies", "manual", "หนังสือตอบข้อหารือ", "หน่วยงานผู้มีอำนาจ", 70],
  ["personnel-rulings", "manual", "แนวคำวินิจฉัย", "คณะกรรมการวินิจฉัย", 80],
  ["ocsc-practice", "manual", "แนวปฏิบัติสำนักงาน ก.พ.", "สำนักงาน ก.พ.", 80],
  ["related-regulations", "regulation", "ระเบียบที่เกี่ยวข้อง", "หน่วยงานผู้มีอำนาจ", 70],
];
export const GP006_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp006-${slug}`, type, title, reference: `govprompt://knowledge/gp006/${slug}`,
  metadata: { source: `${title} GP006 HR Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["local-government-hr", slug], language: "th", confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective" },
})));
