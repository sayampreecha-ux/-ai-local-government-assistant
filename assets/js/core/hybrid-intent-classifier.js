(() => {
  'use strict';

  const core = window.GovPromptCore;
  if (!core || typeof core.routeRequest !== 'function' || typeof core.routeTransaction !== 'function') return;

  const baseRouteRequest = core.routeRequest;
  const baseRouteTransaction = core.routeTransaction;
  const MODULE_TYPE = Object.freeze({
    GP001: 'records', GP002: 'legal', GP003: 'procurement', GP004: 'planning-budget',
    GP005: 'finance', GP006: 'human-resources', GP007: 'engineering', GP008: 'public-health',
    GP009: 'education', GP010: 'internal-audit', GP011: 'executive', GP012: 'public-relations', GP013: 'council'
  });

  const TRAINING = Object.freeze({
    GP001: Object.freeze([
      'ร่างหนังสือราชการ', 'ทำบันทึกข้อความเสนอผู้บริหาร', 'หนังสือเชิญประชุม', 'หนังสือขออนุเคราะห์',
      'หนังสือขอความร่วมมือ', 'เขียนหนังสือถึงผู้ว่าราชการจังหวัด', 'ร่างคำสั่ง', 'ร่างประกาศ',
      'หนังสือตอบข้อหารือ', 'ทำหนังสือแจ้งหน่วยงาน', 'บันทึกเสนอหัวหน้าส่วน'
    ]),
    GP002: Object.freeze([
      'วิเคราะห์ข้อกฎหมาย', 'หน่วยงานมีอำนาจทำได้หรือไม่', 'เรื่องนี้ผิดกฎหมายไหม', 'ฐานอำนาจตามกฎหมาย',
      'กฎหมายที่เกี่ยวข้อง', 'ระเบียบนี้ยังใช้บังคับหรือไม่', 'หารือข้อกฎหมาย', 'ตีความกฎหมายท้องถิ่น'
    ]),
    GP003: Object.freeze([
      'จัดซื้อคอมพิวเตอร์', 'ซื้อครุภัณฑ์', 'ซื้อของให้หน่วยงาน', 'จัดจ้างผู้รับเหมา', 'จ้างทำถนน', 'จ้างที่ปรึกษา', 'ตรวจ TOR',
      'กำหนดราคากลาง', 'วิธีเฉพาะเจาะจง', 'e-bidding', 'ตรวจรับพัสดุ', 'ล็อกสเปกหรือไม่',
      'จัดซื้อครุภัณฑ์ รพ.สต.', 'จัดซื้ออาหารโรงเรียน', 'จ้างที่ปรึกษาตรวจสอบภายใน'
    ]),
    GP004: Object.freeze([
      'เขียนโครงการ', 'จัดทำแผนพัฒนาท้องถิ่น', 'จัดทำงบประมาณ', 'โอนงบประมาณ', 'โอนงบทำยังไง', 'แก้ไขแผนพัฒนา',
      'ตั้งงบประมาณโครงการ', 'ตัวชี้วัดโครงการ', 'งบกลาง', 'งบลงทุน', 'ข้อบัญญัติงบประมาณ'
    ]),
    GP005: Object.freeze([
      'เบิกค่าเดินทางไปราชการ', 'เบิกค่าตั๋วเครื่องบิน', 'เบิกค่าโรงแรม', 'เบิกค่าแท็กซี่', 'เบิกค่าที่พัก',
      'เบิกค่าอาหาร', 'รถเสียระหว่างไปราชการ', 'รถเสียเบิกได้ไหม', 'เงินยืมไปราชการ', 'ฎีกาเบิกจ่าย', 'จ่ายเงินได้ไหม'
    ]),
    GP006: Object.freeze([
      'ขาดราชการเกิน 15 วัน', 'เลื่อนเงินเดือน', 'เลื่อนขั้น', 'แต่งตั้งข้าราชการ', 'โอนย้าย',
      'สอบแข่งขัน', 'บรรจุแต่งตั้ง', 'ผิดวินัย', 'สอบสวนวินัย', 'การลา', 'อัตรากำลัง'
    ]),
    GP007: Object.freeze([
      'ตรวจความหนาแน่นชั้นทาง', 'ถนนชำรุด', 'ตรวจงานก่อสร้าง', 'แบบแปลน', 'ผู้ควบคุมงาน',
      'ทดสอบคอนกรีต', 'ตรวจแอสฟัลต์', 'งานสะพาน', 'ระบบระบายน้ำ', 'มาตรฐานงานทาง'
    ]),
    GP008: Object.freeze([
      'เงินบำรุง รพ.สต. ใช้ได้ไหม', 'เงินบำรุงเบิกค่าอาหารได้ไหม', 'รพ.สต. ทำโครงการสุขภาพ',
      'บริการสาธารณสุข', 'ส่งเสริมสุขภาพประชาชน', 'ถ่ายโอน รพ.สต.', 'โครงการสุขภาพ', 'งานสาธารณสุข'
    ]),
    GP009: Object.freeze([
      'ศูนย์พัฒนาเด็กเล็กทำกิจกรรม', 'ศพดทำกิจกรรมวันเด็ก', 'โรงเรียนทำโครงการอาหารกลางวัน',
      'ครูเบิกค่าอาหารเด็ก', 'ค่าอาหารเด็กนักเรียน', 'การศึกษาท้องถิ่น', 'ทุนการศึกษา', 'นักเรียน', 'ครู', 'เด็กปฐมวัย', 'อาหารกลางวันโรงเรียน'
    ]),
    GP010: Object.freeze([
      'ตรวจสอบภายใน', 'ตรวจการเงิน', 'ตรวจการเบิกจ่าย', 'ตรวจสอบพัสดุประจำปี', 'สอบทานโครงการ',
      'ควบคุมภายใน', 'บริหารความเสี่ยง', 'ตรวจติดตาม', 'audit พัสดุ', 'ประเมินระบบควบคุม'
    ]),
    GP011: Object.freeze([
      'ร่างคำกล่าวเปิดงาน', 'ร่างคำกล่าวปิดงาน', 'กล่าวเปิดการแข่งขันกีฬา', 'กล่าวปิดงานยาเสพติด',
      'กล่าวต้อนรับคณะศึกษาดูงาน', 'คำกล่าววันเด็ก', 'เปิดงานวันเด็กพูดว่าไง', 'สุนทรพจน์', 'โอวาท', 'สรุปผู้บริหาร',
      'ข้อสั่งการผู้บริหาร', 'นโยบายผู้บริหาร'
    ]),
    GP012: Object.freeze([
      'ทำข่าวประชาสัมพันธ์', 'ทำโพสต์เฟซบุ๊ก', 'โพสต์ข่าวให้หน่อย', 'ทำอินโฟกราฟิก', 'ทำอินโฟสรุปกฎหมาย', 'เขียนแคปชัน',
      'ประชาสัมพันธ์โครงการ', 'ทำภาพข่าว', 'สื่อประชาสัมพันธ์'
    ]),
    GP013: Object.freeze([
      'ประชุมสภาท้องถิ่น', 'เสนอญัตติ', 'ญัตติงบประมาณ', 'มติสภา', 'สมัยประชุม', 'องค์ประชุม',
      'สภาอนุมัติโครงการ', 'มติสภาเรื่องเงินบำรุง', 'ประธานสภา', 'สมาชิกสภา', 'ร่างข้อบัญญัติ'
    ])
  });

  // Order matters: specific requested action/process wins over the subject mentioned inside that process.
  const PROCESS_RULES = Object.freeze([
    Object.freeze({ moduleId: 'GP001', confidence: 0.995, patterns: Object.freeze([
      /(?:ร่าง|เขียน|ทำ|จัดทำ|ขอทำ|ช่วยทำ).{0,18}(?:หนังสือ|บันทึกข้อความ|บันทึก|คำสั่ง|ประกาศ)/,
      /(?:หนังสือ|บันทึกข้อความ).{0,18}(?:เชิญ|ขออนุเคราะห์|ขอความร่วมมือ|แจ้ง|ตอบ|เสนอ|เรียน|ถึง|ส่ง)/,
      /(?:หนังสือเชิญ|หนังสือขออนุเคราะห์|หนังสือขอความร่วมมือ)/
    ]) }),
    Object.freeze({ moduleId: 'GP011', confidence: 0.995, patterns: Object.freeze([
      /(?:ร่าง|เขียน|ทำ|จัดทำ|ช่วย)?.{0,12}(?:คำกล่าว|กล่าว)(?:เปิด|ปิด|ต้อนรับ|รายงาน)/,
      /(?:คำกล่าวเปิด|คำกล่าวปิด|กล่าวเปิด|กล่าวปิด|กล่าวต้อนรับ|คำกล่าวต้อนรับ|สุนทรพจน์|โอวาท|พิธีเปิด|พิธีปิด)/,
      /(?:เปิด|ปิด)งาน.{0,24}(?:พูด|กล่าว|ว่าไง|พูดยังไง|พูดอย่างไร|คำพูด)/
    ]) }),
    Object.freeze({ moduleId: 'GP012', confidence: 0.995, patterns: Object.freeze([
      /(?:ทำ|สร้าง|ร่าง|เขียน|ออกแบบ).{0,20}(?:วิดีโอ|วีดีโอ|คลิป|video).{0,30}(?:ประชาสัมพันธ์|แนะนำองค์กร|แนะนำหน่วยงาน|องค์กร|หน่วยงาน)?/i,
      /(?:วิดีโอ|วีดีโอ|คลิป|video).{0,30}(?:ประชาสัมพันธ์|แนะนำองค์กร|แนะนำหน่วยงาน|องค์กร|หน่วยงาน)/i,
      /(?:ทำ|สร้าง|ร่าง|เขียน|ออกแบบ).{0,12}(?:อินโฟ|อินโฟกราฟิก|โพสต์|ข่าวประชาสัมพันธ์|ภาพข่าว|แคปชัน)/,
      /(?:ประชาสัมพันธ์|โพสต์เฟซบุ๊ก|โพสต์facebook|อินโฟกราฟิก|อินโฟ)/i,
      /(?:โพสต์|ลง).{0,12}(?:ข่าว|ข่าวสาร|ประชาสัมพันธ์)|(?:ข่าว|ข่าวสาร).{0,12}(?:โพสต์|ลง)/
    ]) }),
    Object.freeze({ moduleId: 'GP013', confidence: 0.99, patterns: Object.freeze([
      /(?:ญัตติ|มติสภา|ประชุมสภา|สมัยประชุม|องค์ประชุม|ประธานสภา|สมาชิกสภา|สภาท้องถิ่น)/,
      /(?:สภา).{0,20}(?:อนุมัติ|เห็นชอบ|พิจารณา|ลงมติ|โครงการ|งบประมาณ|เงินบำรุง)/
    ]) }),
    // Explicit procurement verbs/processes outrank the subject being purchased for.
    Object.freeze({ moduleId: 'GP003', confidence: 0.99, patterns: Object.freeze([
      /(?:จัดซื้อ|จัดจ้าง|ประกวดราคา|e-?bidding|วิธีเฉพาะเจาะจง|วิธีคัดเลือก|ราคากลาง|ตรวจรับพัสดุ|ตรวจ\s*tor|จัดทำ\s*tor|กำหนด\s*tor|ล็อกสเปก)/i,
      /(?:^|\s)(?:ซื้อ|จ้าง|เช่า|จัดหา).{0,30}(?:ของ|ครุภัณฑ์|วัสดุ|อุปกรณ์|คอม|คอมพิวเตอร์|โน้ตบุ๊ก|เครื่องพิมพ์|รถ|อาหาร|ถนน|งานก่อสร้าง|งานโยธา|ผู้รับเหมา|ที่ปรึกษา|บริการ)/,
      /(?:จ้างที่ปรึกษา|จ้างเหมาบริการ|จ้างผู้รับเหมา|จ้างทำถนน|จ้างก่อสร้าง)/
    ]) }),
    // Education-specific expenditure questions outrank generic finance verbs, but not explicit procurement processes above.
    Object.freeze({ moduleId: 'GP009', confidence: 0.988, patterns: Object.freeze([
      /(?:ครู|โรงเรียน|ศพด\.?|ศูนย์เด็กเล็ก|ศูนย์พัฒนาเด็กเล็ก|นักเรียน|เด็กปฐมวัย).{0,28}(?:เบิก|จ่าย|ค่าอาหาร|อาหารกลางวัน|ค่าใช้จ่าย)/,
      /(?:เบิก|จ่าย|ค่าอาหาร|อาหารกลางวัน|ค่าใช้จ่าย).{0,28}(?:ครู|โรงเรียน|ศพด\.?|ศูนย์เด็กเล็ก|ศูนย์พัฒนาเด็กเล็ก|นักเรียน|เด็กปฐมวัย|เด็ก)/
    ]) }),
    Object.freeze({ moduleId: 'GP010', confidence: 0.985, patterns: Object.freeze([
      /(?:ตรวจสอบภายใน|audit|สอบทาน|ตรวจติดตาม|ประเมินการควบคุมภายใน)/i,
      /(?:ตรวจสอบ|ตรวจการ).{0,22}(?:การเงิน|การเบิกจ่าย|เบิกเงิน|พัสดุ|ครุภัณฑ์|ทรัพย์สิน|โครงการ|งบประมาณ)/
    ]) }),
    Object.freeze({ moduleId: 'GP006', confidence: 0.985, patterns: Object.freeze([
      /(?:ขาดราชการ|ขาดงาน|ละทิ้งหน้าที่|ไม่มาปฏิบัติราชการ|ผิดวินัย|สอบสวนวินัย|เลื่อนเงินเดือน|เลื่อนขั้น|เลื่อนระดับ|โอนย้าย|บรรจุ|สอบแข่งขัน|อัตรากำลัง|การลา)/,
      /(?:แต่งตั้ง).{0,25}(?:ข้าราชการ|พนักงาน|บุคลากร|ตำแหน่ง)/
    ]) }),
    Object.freeze({ moduleId: 'GP005', confidence: 0.98, patterns: Object.freeze([
      /(?:เบิก|ขอเบิก|จ่าย|เบิกจ่าย).{0,25}(?:ค่าเดินทาง|ค่าพาหนะ|ค่ารถ|ค่าแท็กซี่|ค่าที่พัก|ค่าโรงแรม|ค่าตั๋ว|ตั๋วเครื่องบิน|ค่าเครื่องบิน|ค่าอาหาร|เงินยืม)/,
      /(?:เดินทางไปราชการ|ค่าเดินทาง|รถเสีย.{0,20}ราชการ|ราชการ.{0,20}รถเสีย|ฎีกาเบิกจ่าย)/,
      /(?:รถเสีย).{0,25}(?:เบิก|ค่าใช้จ่าย|ค่าซ่อม|ทำไง|ทำอย่างไร|อย่างไร|ได้ไหม|ได้หรือไม่)/,
      /^(?:ค่าโรงแรม|ค่าที่พัก|ค่าพาหนะ|ค่าแท็กซี่|ค่าตั๋วเครื่องบิน)$/
    ]) }),
    Object.freeze({ moduleId: 'GP007', confidence: 0.98, patterns: Object.freeze([
      /(?:ตรวจ|ทดสอบ|ควบคุม).{0,22}(?:ความหนาแน่น|ชั้นทาง|ชั้นพื้นทาง|ชั้นรองพื้นทาง|คอนกรีต|แอสฟัลต์|งานก่อสร้าง|ถนน|สะพาน)/,
      /(?:ถนนพัง|ถนนชำรุด|แบบแปลน|ผู้ควบคุมงาน|มาตรฐานงานทาง)/
    ]) })
  ]);

  // Subject eligibility questions are deliberately evaluated after governance/process actions.
  const SUBJECT_RULES = Object.freeze([
    Object.freeze({ moduleId: 'GP008', confidence: 0.97, patterns: Object.freeze([
      /(?:เงินบำรุง|รพ\.?สต\.?|โรงพยาบาลส่งเสริมสุขภาพตำบล|สาธารณสุข|ส่งเสริมสุขภาพ|บริการสุขภาพ)/,
      /(?:เงินบำรุง).{0,35}(?:ใช้|ซื้อ|เบิก|จ่าย|ทำโครงการ).{0,20}(?:ได้ไหม|ได้หรือไม่|ได้หรือเปล่า)?/
    ]) }),
    Object.freeze({ moduleId: 'GP009', confidence: 0.965, patterns: Object.freeze([
      /(?:ศูนย์เด็กเล็ก|ศพด\.?|ศูนย์พัฒนาเด็กเล็ก|โรงเรียน|เด็กปฐมวัย|นักเรียน|ครู|การศึกษาท้องถิ่น|อาหารกลางวันโรงเรียน)/
    ]) }),
    Object.freeze({ moduleId: 'GP004', confidence: 0.955, patterns: Object.freeze([
      /(?:จัดทำ|ทำ|เขียน).{0,12}(?:โครงการ|แผนพัฒนา|แผนงาน|งบประมาณ)/,
      /(?:โอนง(?:ประมาณ)?|งบกลาง|งบลงทุน|งบดำเนินงาน|ข้อบัญญัติงบประมาณ|ตัวชี้วัด|แผนพัฒนา)/
    ]) }),
    Object.freeze({ moduleId: 'GP002', confidence: 0.95, patterns: Object.freeze([
      /(?:วิเคราะห์|หารือ|ตีความ).{0,15}(?:ข้อกฎหมาย|กฎหมาย|ระเบียบ|ฐานอำนาจ)/,
      /(?:มีอำนาจ|ไม่มีอำนาจ|ผิดกฎหมาย|ถูกกฎหมาย|ชอบด้วยกฎหมาย|ฐานอำนาจ|ข้อกฎหมาย|ทำได้ตามกฎหมาย)/
    ]) }),
    Object.freeze({ moduleId: 'GP011', confidence: 0.90, patterns: Object.freeze([
      /(?:สรุปผู้บริหาร|ข้อสั่งการ|นโยบายผู้บริหาร|ประชุมผู้บริหาร|นายก|ปลัด|ผู้บริหาร)/
    ]) })
  ]);

  function normalize(value) {
    return String(value ?? '').normalize('NFC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function ngrams(text, n = 3) {
    const compact = ` ${normalize(text).replace(/\s+/g, ' ')} `;
    const out = new Set();
    for (let i = 0; i <= compact.length - n; i += 1) out.add(compact.slice(i, i + n));
    return out;
  }

  function dice(a, b) {
    if (!a.size || !b.size) return 0;
    let overlap = 0;
    for (const token of a) if (b.has(token)) overlap += 1;
    return (2 * overlap) / (a.size + b.size);
  }

  const TRAINING_VECTORS = Object.freeze(Object.fromEntries(Object.entries(TRAINING).map(([moduleId, examples]) => [
    moduleId,
    Object.freeze(examples.map(text => Object.freeze({ text, grams3: ngrams(text, 3), grams4: ngrams(text, 4) })))
  ])));

  function matchRule(source, rules) {
    for (const rule of rules) {
      const matched = rule.patterns.filter(pattern => pattern.test(source));
      if (matched.length) return Object.freeze({ moduleId: rule.moduleId, confidence: rule.confidence, matched: Object.freeze(matched.map(item => item.source)) });
    }
    return null;
  }

  function semanticRanking(source) {
    const q3 = ngrams(source, 3);
    const q4 = ngrams(source, 4);
    return Object.freeze(Object.entries(TRAINING_VECTORS).map(([moduleId, vectors]) => {
      let best = 0;
      let bestExample = '';
      for (const vector of vectors) {
        const score = (dice(q3, vector.grams3) * 0.62) + (dice(q4, vector.grams4) * 0.38);
        if (score > best) { best = score; bestExample = vector.text; }
      }
      return Object.freeze({ moduleId, score: best, bestExample });
    }).sort((a, b) => b.score - a.score));
  }

  function inferSecondary(source, primaryModule) {
    const candidates = [];
    const add = (moduleId, pattern) => { if (moduleId !== primaryModule && pattern.test(source)) candidates.push(moduleId); };
    add('GP008', /เงินบำรุง|รพ\.?สต\.?|สาธารณสุข|สุขภาพ/);
    add('GP009', /ศูนย์เด็กเล็ก|ศพด\.?|โรงเรียน|เด็กปฐมวัย|นักเรียน|ครู|การศึกษา/);
    add('GP007', /ก่อสร้าง|ถนน|ชั้นทาง|คอนกรีต|แอสฟัลต์|สะพาน/);
    add('GP003', /พัสดุ|จัดซื้อ|จัดจ้าง|tor|ครุภัณฑ์|วัสดุ|ซื้อ|จ้าง/i);
    add('GP005', /เบิก|จ่าย|ค่าใช้จ่าย|เดินทาง|การเงิน/);
    add('GP006', /ข้าราชการ|พนักงาน|บุคลากร|วินัย|เงินเดือน|แต่งตั้ง/);
    add('GP013', /สภา|ญัตติ|มติสภา/);
    add('GP002', /กฎหมาย|ระเบียบ|ฐานอำนาจ|ชอบด้วยกฎหมาย/);
    return Object.freeze([...new Set(candidates)].slice(0, 2));
  }

  function classifyIntent(request) {
    const source = normalize(request);
    if (!source) return null;

    // Eligibility about a ring-fenced subject fund is a subject decision, unless an explicit procurement process is requested.
    const healthEligibility = /เงินบำรุง/.test(source)
      && /(?:ใช้|เบิก|จ่าย|ซื้อ|ค่า|โครงการ)/.test(source)
      && /(?:ได้ไหม|ได้หรือไม่|ได้หรือเปล่า|สามารถ|หลักเกณฑ์|แนวทาง)/.test(source)
      && !/(?:จัดซื้อ|จัดจ้าง|tor|วิธีเฉพาะเจาะจง|ประกวดราคา|ราคากลาง|ตรวจรับ)/i.test(source);
    if (healthEligibility) return Object.freeze({ moduleId: 'GP008', confidence: 0.995, reason: 'subject-eligibility', secondary: inferSecondary(source, 'GP008') });

    const process = matchRule(source, PROCESS_RULES);
    if (process) return Object.freeze({ ...process, reason: 'specific-action-process', secondary: inferSecondary(source, process.moduleId) });

    const subject = matchRule(source, SUBJECT_RULES);
    if (subject) return Object.freeze({ ...subject, reason: 'subject-domain', secondary: inferSecondary(source, subject.moduleId) });

    const ranking = semanticRanking(source);
    const top = ranking[0];
    const second = ranking[1];
    const margin = (top?.score || 0) - (second?.score || 0);
    if (top && top.score >= 0.27 && margin >= 0.02) {
      return Object.freeze({ moduleId: top.moduleId, confidence: Math.min(0.91, 0.55 + top.score * 0.55), reason: 'semantic-example-match', semantic: Object.freeze({ score: top.score, margin, example: top.bestExample, ranking: ranking.slice(0, 3) }), secondary: inferSecondary(source, top.moduleId) });
    }
    return Object.freeze({ moduleId: 'GP011', confidence: 0.35, reason: 'general-government-fallback', semantic: Object.freeze({ score: top?.score || 0, margin, example: top?.bestExample || '', ranking: ranking.slice(0, 3) }), secondary: inferSecondary(source, 'GP011') });
  }

  function mergeRoute(base, classified) {
    if (!classified) return base;
    if (classified.reason === 'general-government-fallback' && base?.fallback === false) return base;
    const moduleId = classified.moduleId;
    const modules = Object.freeze([...new Set([moduleId, ...(classified.secondary || []), ...(base?.modules || [])])].slice(0, 3));
    const assistant = core.PROMPT_REGISTRY?.find(item => item.moduleId === moduleId);
    return Object.freeze({
      ...base,
      primaryModule: moduleId,
      moduleId,
      transactionType: MODULE_TYPE[moduleId] || base?.transactionType || 'general',
      assistant: assistant || base?.assistant,
      modules,
      confidence: classified.confidence,
      fallback: classified.reason === 'general-government-fallback',
      ambiguous: classified.reason === 'general-government-fallback',
      reason: `hybrid:${classified.reason}`,
      hybridClassification: classified
    });
  }

  core.routeRequest = function hybridRouteRequest(request, options = {}) {
    const base = baseRouteRequest(request, options);
    return mergeRoute(base, classifyIntent(request));
  };

  core.routeTransaction = function hybridRouteTransaction(sharedContext, options = {}) {
    const base = baseRouteTransaction(sharedContext, options);
    const context = base?.context || sharedContext || {};
    const source = [context.transactionType, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput]
      .concat(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      .filter(Boolean).join(' ');
    return mergeRoute(base, classifyIntent(source));
  };

  core.classifyGovernmentIntent = classifyIntent;
  core.semanticIntentRanking = semanticRanking;
  core.HYBRID_INTENT_TRAINING = TRAINING;
})();
