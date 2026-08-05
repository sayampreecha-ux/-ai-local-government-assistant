const sources = [
  ["government-pr-rules", "regulation", "ระเบียบประชาสัมพันธ์ภาครัฐ", "หน่วยงานกำกับการประชาสัมพันธ์ภาครัฐ", 90],
  ["ci-manual", "manual", "คู่มือ CI", "หน่วยงานเจ้าของอัตลักษณ์", 80],
  ["pdpa", "law", "PDPA", "คณะกรรมการคุ้มครองข้อมูลส่วนบุคคล", 100],
  ["digital-government", "manual", "Digital Government", "สำนักงานพัฒนารัฐบาลดิจิทัล", 85],
  ["dla-directives", "circular", "หนังสือสั่งการ สถ.", "กรมส่งเสริมการปกครองท้องถิ่น", 75],
  ["government-communication", "manual", "คู่มือการสื่อสารภาครัฐ", "หน่วยงานสื่อสารภาครัฐ", 85],
  ["social-media-guideline", "manual", "Social Media Guideline", "หน่วยงานสื่อสารภาครัฐ", 80],
];
export const GP009_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({
  id: `gp009-${slug}`, type, title, reference: `govprompt://knowledge/gp009/${slug}`,
  metadata: { source: `${title} GP009 PR Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["government-pr", slug], language: "th", confidence: Math.min(0.99, 0.76 + hierarchy / 500), hierarchy, status: "effective" },
})));
