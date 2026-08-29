(() => {
  'use strict';

  const FRESHNESS_TERMS = Object.freeze([
    'ล่าสุด', 'ปัจจุบัน', 'ตอนนี้', 'วันนี้', 'ฉบับใหม่', 'ฉบับล่าสุด', 'อัปเดต',
    'ยังใช้', 'ยังมีผล', 'มีผลใช้บังคับ', 'ยกเลิก', 'แก้ไขล่าสุด', 'latest', 'current'
  ]);

  const PRIMARY_SOURCE_TERMS = Object.freeze([
    'กฎหมาย', 'ระเบียบ', 'หนังสือเวียน', 'หนังสือสั่งการ', 'ข้อหารือ', 'ซักซ้อม',
    'คำพิพากษา', 'ประกาศ', 'กฎกระทรวง', 'พระราชบัญญัติ', 'คำสั่งทางปกครอง',
    'พัสดุ', 'จัดซื้อ', 'จัดจ้าง', 'tor', 'ทีโออาร์', 'ที โอ อาร์', 'ขอบเขตของงาน',
    'ราคากลาง', 'e-bidding', 'แบ่งซื้อแบ่งจ้าง', 'ผู้รับจ้าง', 'ตรวจรับ',
    'เบิก', 'เบิกจ่าย', 'งบประมาณ', 'เงินสะสม', 'เงินสำรองจ่าย', 'เงินบำรุง',
    'เดินทางไปราชการ', 'ค่าเดินทาง', 'ลาป่วย', 'ใบรับรองแพทย์', 'วินัย', 'ขาดราชการ',
    'โอนย้าย', 'เลื่อนเงินเดือน', 'สอบแข่งขัน', 'บรรจุ', 'สภาท้องถิ่น', 'สมาชิกสภา',
    'องค์ประชุม', 'มีส่วนได้เสีย', 'ญัตติ', 'ข้อบัญญัติ', 'pdpa', 'ข้อมูลผู้ป่วย',
    'ผู้ร้องเรียน', 'รพ.สต.', 'รพสต'
  ]);

  const GMAIL_SOURCE_TERMS = Object.freeze([
    'gmail', 'อีเมล', 'email', 'กล่องจดหมาย', 'inbox', 'เมล'
  ]);

  const DRIVE_SOURCE_TERMS = Object.freeze([
    'google drive', 'drive', 'ไดรฟ์', 'ไฟล์', 'เอกสาร'
  ]);

  const USER_DATA_LOOKUP_TERMS = Object.freeze([
    'เคยส่ง', 'เคยได้รับ', 'ที่ส่ง', 'ที่ได้รับ', 'ส่งไปแล้ว', 'ได้รับมา',
    'ย้อนหลัง', 'เดิม', 'ของฉัน', 'ของผม', 'ของเรา'
  ]);

  const STABLE_CREATION_PATTERNS = Object.freeze([
    /(?:ร่าง|ทำ|เขียน|จัดทำ).{0,28}(?:หนังสือราชการ|หนังสือ|บันทึกข้อความ|บันทึก|คำสั่ง|ประกาศ|คำกล่าว|โพสต์|ข้อความประชาสัมพันธ์)/i,
    /(?:ทำ|ร่าง).{0,20}(?:executive summary|สรุปผู้บริหาร)/i,
    /(?:สรุป|ย่อ|เรียบเรียง|ปรับข้อความ).{0,80}(?:ญัตติ|รายงาน|เอกสาร|คำพิพากษา|ผลการดำเนินงาน|สาระสำคัญ|เสนอผู้บริหาร)/i
  ]);

  const NO_WEB_PATTERNS = Object.freeze([
    /(?:ไม่ต้อง|ไม่จำเป็นต้อง|ยังไม่ต้อง|ห้าม).{0,20}(?:ค้นเว็บ|ค้นข้อมูลเพิ่ม|ค้นข้อมูลภายนอก|ค้นภายนอก|web)/i,
    /(?:ไม่|ห้าม)(?:ต้อง|จำเป็นต้อง|ต้องการ)?\s*(?:ค้นเว็บ|ค้นข้อมูลเพิ่ม|ค้นข้อมูลภายนอก|ค้นภายนอก|ค้นภายนอกเพิ่ม|web)/i,
    /(?:ใช้|จาก).{0,24}(?:ข้อมูลที่ให้|ข้อมูลนี้|เอกสารแนบ|เอกสารนี้|ไฟล์แนบ|ไฟล์นี้).{0,40}(?:เท่านั้น|อย่างเดียว)(?:.{0,40}(?:ไม่ต้องค้น|ห้ามค้น|ไม่ค้น))?/i
  ]);

  const GOVERNMENT_DECISION_PATTERNS = Object.freeze([
    /(?:เบิก|จ่าย|ใช้เงิน|เงินสะสม|เงินสำรองจ่าย|เงินบำรุง|งบประมาณ|จัดซื้อ|จัดจ้าง|พัสดุ|มีอำนาจ|อำนาจหน้าที่|ผิดกฎหมาย|ถูกกฎหมาย|ชอบด้วยกฎหมาย).{0,60}(?:ได้ไหม|ได้หรือไม่|หรือไม่|ทำอย่างไร|ทำไง|ควร)/i,
    /(?:ได้ไหม|ได้หรือไม่).{0,40}(?:เบิก|จ่าย|ใช้เงิน|เงินสะสม|เงินสำรองจ่าย|เงินบำรุง|จัดซื้อ|จัดจ้าง|พัสดุ)/i,
    /(?:ทำ|จัดทำ|ลงนาม).{0,20}(?:mou|บันทึกข้อตกลง).{0,40}(?:ได้ไหม|ได้หรือไม่|หรือไม่)/i,
    /(?:คำสั่งทางปกครอง|เปิดเผย|ผู้ร้องเรียน|ลาป่วย|ใบรับรองแพทย์|e-bidding|แบ่งซื้อแบ่งจ้าง|ผู้รับจ้าง|ตรวจรับ|ประกัน|เปลี่ยนวัสดุ|pdpa|ข้อมูลผู้ป่วย|ภารกิจ).{0,60}(?:ได้ไหม|ได้หรือไม่|หรือไม่|ต้อง|ควร|เสี่ยง|ทำอย่างไร|ทำไง|พิจารณาอะไร|ใครรับผิดชอบ|รับผิดชอบ)/i
  ]);

  const CAREER_VERIFICATION_PATTERNS = Object.freeze([
    /(?:ปลัดต้น|ระดับต้น).{0,50}(?:ปลัดกลาง|ระดับกลาง|กี่ปี|ได้ไหม|ได้ยัง|ขึ้น|เลื่อน)/i,
    /(?:ชก|ชำนาญการ).{0,50}(?:ชพ|ชำนาญการพิเศษ|กี่ปี|ได้ไหม|ได้ยัง|ขึ้น|เลื่อน)/i,
    /(?:ครองตำแหน่ง|ดำรงตำแหน่ง|เลื่อนระดับ|เลื่อนตำแหน่ง|สอบคัดเลือก).{0,60}(?:กี่ปี|คุณสมบัติ|เกณฑ์|ได้ไหม|ได้ยัง|ขึ้น)/i
  ]);

  const EXTERNAL_VERIFICATION_PATTERNS = Object.freeze([
    /(?:ตรวจ|เช็ก|เช็ค|ทบทวน|วิเคราะห์|พิจารณา|เทียบ).{0,70}(?:ถูกต้อง|กฎหมาย|ระเบียบ|หลักเกณฑ์|ฐานอำนาจ|ภารกิจ|แหล่งงบ|ความเสี่ยง|ล็อกสเปก|การแข่งขัน|เบิก|จัดซื้อ|จัดจ้าง|พัสดุ|tor|ที\s*โอ\s*อาร์|ขอบเขตของงาน)/i,
    /(?:ยังใช้|ยังมีผล|มีผลใช้บังคับ|ฉบับล่าสุด|ฉบับใหม่|แก้ไขล่าสุด|ยกเลิก).{0,70}(?:กฎหมาย|ระเบียบ|ประกาศ|หนังสือ|อัตรา|สิทธิ|หลักเกณฑ์|tor|ที\s*โอ\s*อาร์|เบิก|พัสดุ|จัดซื้อ|จัดจ้าง)/i,
    /(?:กฎหมาย|ระเบียบ|ประกาศ|หนังสือ|อัตรา|สิทธิ|หลักเกณฑ์|tor|ที\s*โอ\s*อาร์|เบิก|พัสดุ|จัดซื้อ|จัดจ้าง).{0,70}(?:ยังใช้|ยังมีผล|ฉบับล่าสุด|ฉบับใหม่|แก้ไขล่าสุด|ยกเลิก)/i,
    /(?:ขอ|หา|ค้น|ต้องการ).{0,28}(?:หลักฐาน|แหล่ง|ต้นฉบับ|อ้างอิง).{0,24}(?:ราชการ|ทางการ|กฎหมาย|ระเบียบ)/i,
    /(?:หลักฐานราชการ|แหล่งราชการ|ต้นฉบับราชการ|อ้างอิงราชการ).{0,60}(?:ตอบตรง|ยืนยัน|ประกอบ|ตรวจสอบ|เรื่อง)/i
  ]);

  const USER_DATA_VERIFICATION_PATTERNS = Object.freeze([
    /(?:แล้ว|จากนั้น|พร้อมทั้ง|พร้อม|และ).{0,30}(?:ตรวจ|เช็ก|เช็ค|ทบทวน|วิเคราะห์|เทียบ).{0,80}(?:กฎหมาย|ระเบียบ|หลักเกณฑ์|ปัจจุบัน|ล่าสุด|ถูกต้อง|ความเสี่ยง|ล็อกสเปก|เบิกได้|ทำได้)/i,
    /(?:หา|ค้น|เปิด|ดู).{0,100}(?:gmail|อีเมล|email|เมล|drive|ไดรฟ์|ไฟล์|เอกสาร).{0,100}(?:แล้ว|จากนั้น|พร้อมทั้ง|พร้อม|และ).{0,30}(?:ตรวจ|เช็ก|เช็ค|ทบทวน|วิเคราะห์|เทียบ)/i
  ]);

  function normalize(value) {
    return String(value ?? '')
      .normalize('NFC')
      .toLocaleLowerCase()
      .replace(/มั้ย|มั๊ย/g, 'ไหม')
      .replace(/เท่าไหร่/g, 'เท่าไร')
      .replace(/ไช้/g, 'ใช้')
      .replace(/อยุ่|อยุ/g, 'อยู่')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function includesAny(text, terms) {
    return terms.some(term => text.includes(String(term).toLocaleLowerCase()));
  }

  function isUserDataLookup(text, sourceTerms) {
    if (!includesAny(text, sourceTerms)) return false;
    const isDriveSource = sourceTerms === DRIVE_SOURCE_TERMS;
    const isGmailSource = sourceTerms === GMAIL_SOURCE_TERMS;
    const explicitDrive = /(?:google\s*drive|\bdrive\b|ไดรฟ์)/i.test(text);
    const attachmentReference = /(?:ไฟล์|เอกสาร)\s*แนบ|แนบ(?:ไฟล์|เอกสาร)/i.test(text);
    if (isDriveSource && attachmentReference && !explicitDrive && !includesAny(text, USER_DATA_LOOKUP_TERMS)) return false;

    const directGmailLookup = /(?:หา|ค้น|เปิด|ดู)(?:\s*(?:ใน|จาก))?\s*(?:gmail|อีเมล|email|กล่องจดหมาย|inbox|เมล)/i.test(text);
    const directDriveLookup = /(?:หา|ค้น|เปิด|ดู)\s*(?:ไฟล์|เอกสาร).{0,120}(?:google\s*drive|\bdrive\b|ไดรฟ์)|(?:หา|ค้น|เปิด|ดู).{0,60}(?:google\s*drive|\bdrive\b|ไดรฟ์)|(?:google\s*drive|\bdrive\b|ไดรฟ์).{0,60}(?:หา|ค้น|เปิด|ดู)/i.test(text);

    if (isGmailSource && directGmailLookup) return true;
    if (isDriveSource && directDriveLookup) return true;
    if (includesAny(text, USER_DATA_LOOKUP_TERMS)) {
      if (isGmailSource) return directGmailLookup || !explicitDrive;
      return true;
    }

    const lookupVerb = /(?:หา|ค้น|เปิด|ดู)/i;
    if (!lookupVerb.test(text)) return false;

    if (isGmailSource) return false;

    const naturalPrefixLookup = /^(?:ช่วย|กรุณา|ขอ|รบกวน)?\s*(?:หา|ค้น|เปิด|ดู)/i.test(text)
      || /^(?:งานนี้|เอาแบบใช้งานจริง|ขอสั้นๆก่อน|เจ้าหน้าที่ถามว่า|ผู้บริหารถามว่า)\s*(?:ช่วย|กรุณา|ขอ|รบกวน)?\s*(?:หา|ค้น|เปิด|ดู)/i.test(text)
      || /(?:^|\s)(?:ช่วย|กรุณา|ขอ|รบกวน)\s*(?:หา|ค้น|เปิด|ดู)/i.test(text);

    if (naturalPrefixLookup) return true;
    if (explicitDrive && /(?:หา|ค้น|เปิด|ดู).{0,120}(?:google\s*drive|\bdrive\b|ไดรฟ์)|(?:google\s*drive|\bdrive\b|ไดรฟ์).{0,120}(?:หา|ค้น|เปิด|ดู)/i.test(text)) return true;
    return false;
  }

  function isStableCreation(text) {
    const intentText = text.replace(/(?:เจ้าหน้าที่|ผู้ใช้|ผม|เรา)?\s*(?:จะ)?\s*ทำต่อจาก(?:คำตอบ|ข้อมูล|เรื่อง|เอกสาร)(?:นี้)?/gi, ' ');
    return STABLE_CREATION_PATTERNS.some(pattern => pattern.test(intentText));
  }

  function explicitlyDisablesWeb(text) {
    return NO_WEB_PATTERNS.some(pattern => pattern.test(text));
  }

  function needsGovernmentVerification(text) {
    return includesAny(text, PRIMARY_SOURCE_TERMS)
      || GOVERNMENT_DECISION_PATTERNS.some(pattern => pattern.test(text))
      || CAREER_VERIFICATION_PATTERNS.some(pattern => pattern.test(text));
  }

  function explicitlyRequestsExternalVerification(text) {
    return GOVERNMENT_DECISION_PATTERNS.some(pattern => pattern.test(text)) || EXTERNAL_VERIFICATION_PATTERNS.some(pattern => pattern.test(text));
  }

  function userDataRequestsVerification(text) {
    return USER_DATA_VERIFICATION_PATTERNS.some(pattern => pattern.test(text));
  }

  function createQualityGuidance(text) {
    const isPrIntent = /(?:ประชาสัมพันธ์|ข่าวประชาสัมพันธ์|โพสต์(?:โซเชียล)?|อินโฟกราฟิก|สคริปต์|คำกล่าว|วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์|แนะนำองค์กร|แนะนำหน่วยงาน)/i.test(text);
    if (isPrIntent) {
      return Object.freeze([
        'จัดทำชิ้นงานประชาสัมพันธ์พร้อมใช้ก่อน ไม่อธิบายกฎงานราชการที่ไม่เกี่ยวข้อง',
        'ยึดข้อเท็จจริงจากข้อมูลต้นฉบับ ห้ามแต่งชื่อ ตำแหน่ง วันที่ ตัวเลข หรือเหตุการณ์',
        'ถ้าเป็นวิดีโอ ให้จัด Storyboard บทพากย์ ข้อความขึ้นจอ รายการภาพ/คลิป และ Prompt สำหรับ AI Video ตามความเหมาะสม',
        'ตรวจ PDPA สิทธิการใช้ภาพ/สื่อ และข้อมูลสำคัญก่อนเผยแพร่',
        'ถามเพิ่มเฉพาะข้อมูลที่จำเป็นต่อชิ้นงานจริง'
      ]);
    }

    const guidance = [
      'ตอบแบบ Answer First: สรุปคำตอบที่ใช้ตัดสินใจได้ก่อน แล้วจึงให้เหตุผลที่จำเป็น',
      'ใช้ภาษาไทยกระชับ อ่านง่าย แต่คงถ้อยคำราชการเมื่อเป็นเอกสารพร้อมใช้',
      'ถามข้อมูลเพิ่มเฉพาะกรณีที่ข้อมูลนั้นเปลี่ยนคำตอบหรือจำเป็นต่อการจัดทำเอกสารจริง'
    ];

    if (/(?:ร่าง|ทำ|เขียน).{0,12}(?:หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|หนังสือภายใน|คำสั่ง|หนังสือเชิญ)/i.test(text)) {
      guidance.push('ถ้าเป็นงานร่างหนังสือ ให้ร่างฉบับพร้อมใช้ก่อน โดยใช้ [ระบุ...] เฉพาะช่องข้อมูลสำคัญที่ผู้ใช้ยังไม่ได้ให้ และไม่ถามข้อมูลจุกจิกก่อนร่าง');
    }

    if (/(?:tor|ที\s*โอ\s*อาร์|ทีโออาร์|ขอบเขตของงาน|คุณลักษณะเฉพาะ|ล็อกสเปก)/i.test(text)) {
      guidance.push('ถ้าเป็น TOR ให้แยกอย่างน้อย: วัตถุประสงค์ ขอบเขต/คุณลักษณะ เกณฑ์ตรวจรับ เงื่อนไขส่งมอบ และความเสี่ยงต่อการแข่งขัน/ล็อกสเปก พร้อมเสนอถ้อยคำแก้เมื่อพบจุดเสี่ยง');
    }

    if (/(?:เบิก|เบิกจ่าย|ค่าเดินทาง|ค่าแท็กซี่|เงินบำรุง|เงินสะสม|เงินสำรองจ่าย|ใช้เงิน|งบประมาณ)/i.test(text)) {
      guidance.push('ถ้าเป็นการเงิน/เบิกจ่าย ให้ตอบให้ชัดก่อนว่า “เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข” แล้วสรุปฐานอำนาจ เงื่อนไข เอกสารประกอบ และจุดที่ต้องอนุมัติหรือใช้ดุลพินิจ');
    }

    if (/(?:กฎหมาย|ระเบียบ|ข้อกฎหมาย|อำนาจ|ชอบด้วยกฎหมาย|ผิดกฎหมาย|คำพิพากษา)/i.test(text)) {
      guidance.push('ถ้าเป็นกฎหมาย ให้แยก “ข้อเท็จจริงที่ยืนยันแล้ว / ประเด็นกฎหมาย / ฐานอำนาจ / การวิเคราะห์ / ความเสี่ยง / ข้อเสนอแนะ” และห้ามใส่เลขมาตราหรือเลขหนังสือที่ยังตรวจไม่พบต้นฉบับ');
    }

    if (/(?:จัดซื้อ|จัดจ้าง|พัสดุ|tor|ที\s*โอ\s*อาร์|ทีโออาร์|ขอบเขตของงาน|วิธีเฉพาะเจาะจง|e-bidding|คัดเลือก|ราคากลาง)/i.test(text)) {
      guidance.push('ถ้าเป็นจัดซื้อจัดจ้าง ให้ตอบเป็นลำดับขั้นปฏิบัติ ระบุวิธี/เงื่อนไขที่เป็นไปได้ เอกสารสำคัญ จุดควบคุม และความเสี่ยงต่อการร้องเรียนหรือไม่เป็นการแข่งขันอย่างเป็นธรรม');
    }

    return Object.freeze(guidance);
  }

  function createToolRoutingPlan({ question, attachments = [] } = {}) {
    const text = normalize(question);
    const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
    const hasAttachments = files.length > 0;
    const wantsGmail = isUserDataLookup(text, GMAIL_SOURCE_TERMS);
    const wantsDriveFiles = isUserDataLookup(text, DRIVE_SOURCE_TERMS);
    const userDataFirst = wantsGmail || wantsDriveFiles;
    const sourceFirstTask = hasAttachments || userDataFirst;
    const stableCreation = isStableCreation(text);
    const explicitNoWeb = explicitlyDisablesWeb(text);
    const rawNeedsPrimarySource = needsGovernmentVerification(text);
    const rawExternalVerificationRequested = explicitlyRequestsExternalVerification(text);
    const userDataVerificationRequested = userDataRequestsVerification(text);
    const externalVerificationRequested = rawExternalVerificationRequested
      && !explicitNoWeb
      && (!userDataFirst || userDataVerificationRequested);
    const needsPrimarySource = !explicitNoWeb
      && (rawNeedsPrimarySource || externalVerificationRequested)
      && (!sourceFirstTask || externalVerificationRequested)
      && (!stableCreation || externalVerificationRequested);
    const freshnessRequested = includesAny(text, FRESHNESS_TERMS);
    const needsCurrentWeb = !explicitNoWeb
      && freshnessRequested
      && !userDataFirst
      && !hasAttachments
      && (!stableCreation || externalVerificationRequested);

    const tools = [];
    const instructions = [];

    if (hasAttachments) {
      tools.push('attached-files');
      instructions.push('อ่านและใช้เอกสารที่ผู้ใช้แนบมาก่อน ห้ามถามซ้ำข้อมูลที่พบในเอกสาร');
    }

    if (wantsGmail) {
      tools.push('gmail');
      instructions.push('หากสภาพแวดล้อมรองรับ ให้ค้น Gmail ของบัญชีผู้ใช้เองเท่านั้น และใช้เฉพาะข้อมูลที่จำเป็นต่อคำถาม');
    }

    if (wantsDriveFiles) {
      tools.push('drive-files');
      instructions.push('หากสภาพแวดล้อมรองรับ ให้ค้น Drive/Files ของบัญชีผู้ใช้เองก่อน และอย่าสมมติว่าได้เปิดเอกสารที่ยังไม่ได้อ่าน');
    }

    if (needsCurrentWeb || needsPrimarySource) {
      tools.push('web-search');
      instructions.push('ค้นเว็บเมื่อจำเป็น โดยยึดแหล่งราชการ/ต้นฉบับก่อน ตรวจสถานะฉบับล่าสุด และห้ามฟันธงจากข้อมูลเก่าหรือแหล่งสรุปเพียงอย่างเดียว');
    }

    if (!tools.length) {
      tools.push('ai-reasoning');
      instructions.push('ใช้การวิเคราะห์/ร่าง/สรุปจากข้อมูลที่ผู้ใช้ให้ก่อน ไม่ต้องค้นเว็บโดยอัตโนมัติหากข้อมูลปัจจุบันไม่จำเป็น');
    } else {
      tools.push('ai-reasoning');
      instructions.push('หลังรวบรวมข้อมูลจากเครื่องมือที่จำเป็นแล้ว ให้ AI วิเคราะห์ สรุป หรือจัดทำผลลัพธ์พร้อมใช้ตามคำขอ');
    }

    instructions.push(...createQualityGuidance(text));

    const uniqueTools = Object.freeze([...new Set(tools)]);
    const mode = hasAttachments
      ? 'attachment-first'
      : (userDataFirst
        ? 'user-data-first'
        : (needsCurrentWeb || needsPrimarySource ? 'web-when-needed' : 'ai-only'));

    const reasons = [];
    if (hasAttachments) reasons.push('มีเอกสารแนบ');
    if (wantsGmail) reasons.push('คำถามต้องการค้นอีเมลของผู้ใช้');
    if (wantsDriveFiles) reasons.push('คำถามต้องการค้นไฟล์/เอกสารของผู้ใช้');
    if (explicitNoWeb) reasons.push('ผู้ใช้ระบุชัดว่าไม่ต้องค้นเว็บหรือข้อมูลภายนอกเพิ่ม');
    if (needsCurrentWeb) reasons.push('ต้องตรวจข้อมูลปัจจุบันจากภายนอก');
    if (needsPrimarySource) reasons.push('เป็นงานราชการที่ควรตรวจแหล่งปฐมภูมิ');
    if (sourceFirstTask && rawNeedsPrimarySource && !externalVerificationRequested) reasons.push('ใช้ข้อมูลจากเอกสาร/บัญชีผู้ใช้ก่อน และไม่ค้นเว็บเกินความจำเป็น');
    if (stableCreation && rawNeedsPrimarySource && !externalVerificationRequested) reasons.push('เป็นงานร่าง/สรุป/สร้างเนื้อหาที่ตอบจากข้อมูลผู้ใช้ได้โดยไม่ค้นเว็บอัตโนมัติ');
    if (!reasons.length) reasons.push('ตอบได้จากข้อมูลที่ผู้ใช้ให้และการวิเคราะห์ทั่วไป');

    return Object.freeze({
      mode,
      tools: uniqueTools,
      instructions: Object.freeze(instructions),
      reasons: Object.freeze(reasons),
      flags: Object.freeze({ hasAttachments, wantsGmail, wantsDriveFiles, needsCurrentWeb, needsPrimarySource, externalVerificationRequested, userDataVerificationRequested, explicitNoWeb, stableCreation })
    });
  }

  function formatToolRoutingInstructions(plan) {
    if (!plan?.tools?.length) return '';
    return [
      `- โหมดแนะนำ: ${plan.mode}`,
      `- ลำดับเครื่องมือ: ${plan.tools.join(' → ')}`,
      ...plan.instructions.map(item => `- ${item}`),
      '- หากเครื่องมือที่แนะนำไม่มีในสภาพแวดล้อมนี้ ให้บอกผู้ใช้ตรง ๆ และทำเฉพาะส่วนที่ทำได้ ห้ามอ้างว่าได้ค้นหรือเปิดข้อมูลแล้ว'
    ].join('\n');
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.createPromptQualityGuidance = createQualityGuidance;
  window.GovPromptCore.createToolRoutingPlan = createToolRoutingPlan;
  window.GovPromptCore.formatToolRoutingInstructions = formatToolRoutingInstructions;
})();
