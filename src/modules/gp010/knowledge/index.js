const sources = [
  ["meeting-rules", "regulation", "ระเบียบการประชุม", "หน่วยงานผู้มีอำนาจ", 90],
  ["local-council", "manual", "งานสภาท้องถิ่น", "กรมส่งเสริมการปกครองท้องถิ่น", 85],
  ["official-correspondence", "regulation", "ระเบียบงานสารบรรณ", "สำนักนายกรัฐมนตรี", 90],
  ["dla-directives", "circular", "หนังสือสั่งการ สถ.", "กรมส่งเสริมการปกครองท้องถิ่น", 75],
  ["related-laws", "law", "กฎหมายที่เกี่ยวข้อง", "หน่วยงานผู้มีอำนาจ", 85],
];
export const GP010_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({ id: `gp010-${slug}`, type, title, reference: `govprompt://knowledge/gp010/${slug}`, metadata: { source: `${title} GP010 Meeting Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["government-meeting", slug], language: "th", confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective" } })));
