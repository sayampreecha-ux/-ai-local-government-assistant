const sources = [
  ["pdpa", "law", "พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล", "คณะกรรมการคุ้มครองข้อมูลส่วนบุคคล", 95],
  ["pdpc-notices", "regulation", "ประกาศคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล", "คณะกรรมการคุ้มครองข้อมูลส่วนบุคคล", 92],
  ["government-guidance", "manual", "แนวปฏิบัติหน่วยงานของรัฐ", "สำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล", 85],
  ["official-correspondence", "regulation", "ระเบียบงานสารบรรณ", "สำนักนายกรัฐมนตรี", 82],
  ["digital-government", "manual", "Digital Government Guideline", "สำนักงานพัฒนารัฐบาลดิจิทัล", 80],
  ["cybersecurity", "manual", "Cybersecurity Guideline", "สำนักงานคณะกรรมการการรักษาความมั่นคงปลอดภัยไซเบอร์แห่งชาติ", 82],
];
export const GP011_KNOWLEDGE = Object.freeze(sources.map(([slug, type, title, authority, hierarchy]) => ({ id: `gp011-${slug}`, type, title, reference: `govprompt://knowledge/gp011/${slug}`, metadata: { source: `${title} GP011 Controlled Corpus`, authority, version: "1.0", effectiveDate: "2026-01-01", category: slug, tags: ["pdpa", "government-privacy", slug], language: "th", confidence: Math.min(0.99, 0.77 + hierarchy / 500), hierarchy, status: "effective" } })));
