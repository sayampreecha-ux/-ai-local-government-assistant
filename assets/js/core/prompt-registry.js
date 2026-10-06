(() => {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  const definitions = [
    ['GP001', 'ผู้ช่วยงานสารบรรณ', 'records'],
    ['GP002', 'ผู้ช่วยกฎหมาย', 'legal'],
    ['GP003', 'ผู้ช่วยพัสดุและ TOR', 'procurement'],
    ['GP004', 'ผู้ช่วยแผน โครงการ และงบประมาณ', 'planning-budget'],
    ['GP005', 'ผู้ช่วยการเงินและการคลัง', 'finance'],
    ['GP006', 'ผู้ช่วยงานบุคคล', 'human-resources'],
    ['GP007', 'ผู้ช่วยงานช่างและวิศวกรรม', 'engineering'],
    ['GP008', 'ผู้ช่วยสาธารณสุขและ รพ.สต.', 'public-health'],
    ['GP009', 'ผู้ช่วยการศึกษา', 'education'],
    ['GP010', 'ผู้ช่วยตรวจสอบภายใน', 'internal-audit'],
    ['GP011', 'ผู้ช่วยผู้บริหาร', 'executive'],
    ['GP012', 'ผู้ช่วยประชาสัมพันธ์', 'public-relations'],
    ['GP013', 'ผู้ช่วยงานสภาท้องถิ่น', 'council']
  ];

  const PROMPT_REGISTRY = deepFreeze(definitions.map(([moduleId, title, transactionType]) => ({
    moduleId,
    title,
    path: `${moduleId.toLowerCase()}.html`,
    transactionTypes: [transactionType],
    promptSource: 'legacy-inline',
    promptVersion: '2.0',
    status: 'active'
  })));

  const PROMPT_REGISTRY_BY_ID = deepFreeze(Object.fromEntries(
    PROMPT_REGISTRY.map(definition => [definition.moduleId, definition])
  ));

  const PROMPT_QUALITY_STANDARD = deepFreeze({
    version: '7.2',
    name: 'GovPrompt Prompt Quality Standard v7.2',
    universal: [
      'Answer First: เริ่มด้วยคำตอบหรือชิ้นงานที่ผู้ใช้ใช้ตัดสินใจ/ใช้งานต่อได้ทันที',
      'ห้ามแต่งเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา อัตรา ชื่อบุคคล URL หรือข้อเท็จจริงที่ไม่มีหลักฐานรองรับ',
      'เรื่องกฎหมาย สิทธิ อำนาจ การเงิน พัสดุ บุคคล และข้อมูลที่เปลี่ยนตามเวลา ต้องให้ AI ที่กำลังตอบใช้ความสามารถค้นเว็บสดของบัญชีหรือแพลตฟอร์มผู้ใช้เอง เพื่อตรวจแหล่งราชการ/ต้นฉบับที่ใช้กับบุคคล เหตุการณ์ และช่วงเวลาที่วินิจฉัย พร้อมฉบับปัจจุบันและบทเฉพาะกาลประกอบก่อนฟันธง',
      'ถ้า AI ฝั่งผู้ใช้ไม่มีความสามารถค้นเว็บ หรือยังยืนยันหลักฐานที่ใช้กับกรณีไม่ได้ ต้องระบุว่า “ยังยืนยันหลักฐานที่ใช้บังคับกับกรณีไม่ได้ — ยังไม่ควรฟันธง” และห้ามทำเหมือนค้นสดสำเร็จ',
      'แยกข้อเท็จจริงที่ยืนยันแล้ว ประเด็นวิเคราะห์ ความเสี่ยง และข้อเสนอแนะเมื่อมีผลต่อการตัดสินใจ',
      'ถามข้อมูลเพิ่มเฉพาะช่องว่างที่สามารถเปลี่ยนคำตอบหรือจำเป็นต่อชิ้นงานจริง',
      'ตรวจ PDPA ข้อมูลอ่อนไหว ข้อมูลลับ และ data minimization ก่อนใช้ข้อมูล',
      'การอนุมัติ ลงนาม สั่งจ่าย ลงมติ หรือใช้อำนาจจริงต้องเป็น Human Approval'
    ],
    domainRules: {
      finance: ['การเงิน/เบิกจ่าย: ตอบให้ชัดก่อนว่า “เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข / หลักฐานยังไม่พอฟันธง”', 'สรุปฐานอำนาจ เงื่อนไข แหล่งเงิน เอกสารประกอบ ผู้อนุมัติ/ผู้มีอำนาจ และจุดใช้ดุลพินิจ'],
      procurement: ['พัสดุ/TOR: ตรวจอำนาจ วิธีจัดซื้อจัดจ้าง การแบ่งซื้อแบ่งจ้าง ราคากลาง TOR/สเปก การแข่งขันอย่างเป็นธรรม คุณสมบัติ และความเสี่ยงร้องเรียน/ตรวจสอบ', 'ห้ามเสนอเงื่อนไขล็อกสเปกหรือจำกัดการแข่งขันโดยไม่มีเหตุผลทางเทคนิคที่ตรวจสอบได้'],
      hr: ['งานบุคคล: แยกคุณสมบัติ สิทธิ เงื่อนไข ระยะเวลา วันที่มีผล ผู้มีอำนาจ และผลเมื่อเงื่อนไขใดไม่ครบ', 'ห้ามสรุปสิทธิจากเงื่อนไขเพียงข้อเดียวเมื่อหลักเกณฑ์มีหลายองค์ประกอบ'],
      records: ['งานสารบรรณ: เมื่อผู้ใช้ขอร่าง ให้ส่งฉบับพร้อมใช้ก่อน ใช้ [ระบุ...] เฉพาะข้อมูลสำคัญที่ยังขาด', 'คงรูปแบบและถ้อยคำราชการให้เหมาะกับประเภทหนังสือ โดยไม่ถามจุกจิกก่อนร่าง'],
      legal: ['วิเคราะห์กฎหมาย: ตรวจลำดับศักดิ์ วันมีผล ฉบับแก้ไข การยกเลิก บทเฉพาะกาล และข้อเท็จจริงตามช่วงเวลา', 'หากแหล่งข้อมูลขัดกัน ให้เทียบฐานอำนาจ วันมีผล ขอบเขต และบทเฉพาะกาลก่อนเลือกฉบับที่ใช้กับกรณี พร้อมอธิบายเหตุผล'],
      health: ['สาธารณสุข/รพ.สต.: ตรวจฐานอำนาจ แหล่งเงิน ระเบียบเฉพาะ และถือข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว ห้ามใช้ข้อมูลผู้ป่วยจริงที่ไม่จำเป็น'],
      engineering: ['งานช่าง: แยกมาตรฐานทางเทคนิค แบบ รายการคำนวณ การตรวจรับ ความปลอดภัย และฐานอำนาจ/งบประมาณที่เกี่ยวข้อง'],
      council: ['รายงานประชุม: แยกการบันทึกข้อเท็จจริงออกจากการวินิจฉัยความชอบด้วยกฎหมาย ร่างจากข้อมูลที่มีได้ก่อนโดยไม่ต้องรอ councilAuthority', 'ห้ามแต่งชื่อผู้พูด มติ หรือคะแนนเสียง; มติใช้ VERIFIED / PARTIAL / UNVERIFIED และให้ Human Review ก่อนรับรอง'],
      pr: ['ประชาสัมพันธ์: ให้ข้อความพร้อมเผยแพร่ กระชับ ตรวจชื่อ ตัวเลข วันที่ ลิงก์ และข้อมูลส่วนบุคคลก่อนโพสต์']
    }
  });

  function getPromptDefinition(moduleId) {
    const normalized = String(moduleId ?? '').trim().toUpperCase();
    return PROMPT_REGISTRY_BY_ID[normalized];
  }

  function createPromptContext(moduleId, input = {}) {
    const definition = getPromptDefinition(moduleId);
    const createSharedContext = window.GovPromptCore?.createSharedContext;
    if (!definition || typeof createSharedContext !== 'function') return undefined;
    return createSharedContext({ domain: definition.transactionTypes[0], ...input });
  }

  function detectPromptQualityDomains(question = '') {
    const source = String(question).toLocaleLowerCase();
    const domains = [];
    const meetingMinutes = /(?:ทำ|จัดทำ|ร่าง).{0,18}รายงาน(?:การ)?ประชุม|(?:^|\s)สรุป(?:การ)?ประชุม(?:\s|$)|ถอด(?:เสียง)?ประชุม|จัดรายงาน(?:การ)?ประชุม|ทำรายงานจากไฟล์เสียง/i.test(source);
    const councilMeeting = /(?:สภาท้องถิ่น|ประชุมสภา|รายงาน(?:การ)?ประชุม\s*สภา|มติสภา|ญัตติ|ประธานสภา|สมาชิกสภา|องค์ประชุม|สมัยประชุม)/i.test(source);
    if (/(?:เบิก|การเงิน|คลัง|ฎีกา|ค่าใช้จ่าย|เงินสะสม|เงินบำรุง|โบนัส|งบประมาณ)/i.test(source)) domains.push('finance');
    if (/(?:พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|สัญญา|ผู้รับจ้าง|ผู้ยื่น|ตรวจรับ|e-bidding)/i.test(source)) domains.push('procurement');
    if (/(?:บุคคล|บรรจุ|แต่งตั้ง|เลื่อนเงินเดือน|เลื่อนระดับ|ทดลองงาน|คุณสมบัติปลัด|วินัย|พนักงาน|ข้าราชการ|อัตรากำลัง)/i.test(source)) domains.push('hr');
    if (/(?:หนังสือราชการ|หนังสือ|บันทึกข้อความ|บันทึก|สารบรรณ|ร่างหนังสือ|คำสั่ง|ประกาศ)/i.test(source) || (meetingMinutes && !councilMeeting)) domains.push('records');
    if (/(?:กฎหมาย|ระเบียบ|อำนาจ|ข้อหารือ|คำพิพากษา|มาตรา|สิทธิ|หนังสือเวียน|บทเฉพาะกาล|หลักเกณฑ์)/i.test(source)) domains.push('legal');
    if (/(?:รพ\.สต|รพสต|สอน\.(?:เฉลิมพระเกียรติ(?:ฯ)?)?|สถานีอนามัย|สาธารณสุข|สุขภาพ|เงินบำรุง|ผู้ป่วย|อสม\.?|ยา|เวชภัณฑ์|เบาหวาน)/i.test(source)) domains.push('health');
    if (/(?:ถนน|สะพาน|ก่อสร้าง|งานช่าง|วิศวกรรม|แบบ|ประมาณราคา|ผู้รับจ้าง|หน้างาน|ความหนาแน่นดิน)/i.test(source)) domains.push('engineering');
    if (councilMeeting) domains.push('council');
    if (/(?:ประชาสัมพันธ์|โพสต์|ข่าว|อินโฟกราฟิก|แคปชัน|โปสเตอร์|เชิญใช้)/i.test(source)) domains.push('pr');
    return Object.freeze([...new Set(domains)]);
  }

  // Instruction policy, not a verified legal ruling or an authorization to spend.
  function extractHealthFundingContext(question = '', { healthContext = false } = {}) {
    const text = String(question).normalize('NFC');
    const isHealth = healthContext || /(?:เงินบำรุง|โรงพยาบาล|รพ\.?สต\.?|รพสต|โรงพยาบาลส่งเสริมสุขภาพตำบล|สอน\.(?:เฉลิมพระเกียรติ(?:ฯ)?)?|สถานีอนามัย|หน่วยบริการ(?:สาธารณสุข)?|สาธารณสุข|ส่งเสริมสุขภาพ|อาหารปลอดภัย)/i.test(text);
    if (!isHealth) return Object.freeze({ healthContext: false, sourceOfFunds: 'not-applicable', facilityType: 'unknown', projectIntent: false });
    let sourceOfFunds = 'unknown';
    if (/เงินบำรุง/i.test(text)) sourceOfFunds = 'maintenanceFund';
    else if (/(?:งบประมาณ(?:รายจ่าย)?|งบ)(?:\s*ของ)?\s*(?:อปท\.?|อบจ\.?|อบต\.?|เทศบาล|องค์กรปกครองส่วนท้องถิ่น)/i.test(text)) sourceOfFunds = 'localGovernmentBudget';
    else if (/เงินอุดหนุน/i.test(text)) sourceOfFunds = 'grant';
    else if (/กองทุน/i.test(text)) sourceOfFunds = 'fund';
    else if (/เงินเฉพาะ(?:กิจ)?|เงินอื่น|แหล่งเงินอื่น/i.test(text)) sourceOfFunds = 'other';
    const facilityType = /รพ\.?สต\.?|รพสต|โรงพยาบาลส่งเสริมสุขภาพตำบล|สอน\.(?:เฉลิมพระเกียรติ(?:ฯ)?)?|สถานีอนามัย|หน่วยบริการ(?:สาธารณสุข)?/i.test(text)
      ? 'healthServiceUnit'
      : /โรงพยาบาล/i.test(text) ? 'hospital' : 'unknown';
    const projectIntent = /(?:ทำ|ร่าง|เขียน|จัดทำ|ขอแบบ|ขอร่าง)\s*โค(?:รงการ|รการ)/i.test(text) || /^\s*โครงการ\s*(?:สถานีอนามัย|รพ\.?สต\.?|รพสต|สอน\.)/i.test(text);
    return Object.freeze({ healthContext: true, sourceOfFunds, facilityType, projectIntent });
  }

  function buildHealthFundingInstructions(question = '', options = {}) {
    const ctx = extractHealthFundingContext(question, options);
    if (!ctx.healthContext) return '';
    const sourceLine = ctx.sourceOfFunds === 'maintenanceFund'
      ? 'SOURCE STATE: sourceOfFunds=maintenanceFund (VERIFIED FROM USER TEXT) — ห้ามแสดงว่าแหล่งเงินยังไม่ระบุและห้ามถามแหล่งเงินซ้ำ'
      : ctx.sourceOfFunds === 'localGovernmentBudget'
        ? 'SOURCE STATE: sourceOfFunds=localGovernmentBudget (VERIFIED FROM USER TEXT) — หยุด Maintenance Fund Workflow'
        : ctx.sourceOfFunds === 'unknown'
          ? 'SOURCE STATE: sourceOfFunds=unknown — ถ้าข้อมูลนี้เปลี่ยนผลทางกฎหมาย ให้ถามเพียงครั้งเดียวว่า “รายการนี้ใช้เงินบำรุงของหน่วยบริการ งบประมาณของ อปท. หรือเงินจากแหล่งอื่น?” และยังร่างส่วนที่ไม่ขึ้นกับแหล่งเงินได้'
          : `SOURCE STATE: sourceOfFunds=${ctx.sourceOfFunds} — ตรวจเงื่อนไขเฉพาะของแหล่งเงินนั้น ห้ามยืมกฎเงินบำรุง/งบประมาณปกติมาใช้โดยอัตโนมัติ`;
    const projectLine = ctx.projectIntent
      ? 'DELIVERABLE OVERRIDE: intent=create_project; deliverable=project. Explicit user intent ชนะ module-default analysis. ต้องส่ง “ร่างโครงการพร้อมใช้” ก่อนบทวิเคราะห์ ใช้ [ระบุ…] สำหรับข้อมูลที่ขาด และ Decision Lock ได้เฉพาะ legal decision ที่ยังยืนยันไม่ได้ ห้ามล็อก projectDraft ทั้งงาน'
      : '';
    return `SOURCE OF FUNDS FIRST — งานโรงพยาบาล รพ.สต. สอน. และหน่วยบริการสาธารณสุข
ใช้กับองค์กรปกครองส่วนท้องถิ่นทุกประเภทที่อยู่ภายใต้กฎหมาย/ระเบียบที่ใช้บังคับ ห้าม hard-code เฉพาะ อบจ.; ใช้ semantic roles: localGovernmentOrganization / localExecutive / localCouncil / localGovernmentBudget / healthServiceUnit แล้วจึง render ชื่อตำแหน่งตามบริบทจริง
${sourceLine}
${projectLine}
CORE: แหล่งเงินเป็นจุดเริ่ม ไม่ใช่คำตอบทั้งหมด. ห้ามใช้ชื่อหน่วยงาน ชื่อเมนู คำว่า “โครงการ” หรือหมวด Router เป็นตัวตัดสินเรื่องแผน/สิทธิ/อำนาจ
ตรวจตามลำดับ: 1) แหล่งเงิน 2) อำนาจหน้าที่/วัตถุประสงค์ 3) ประเภทรายจ่าย 4) แผนที่กฎของแหล่งเงินกำหนด 5) เงื่อนไขใช้เงิน 6) ผู้มีอำนาจ 7) ค่าใช้จ่ายเฉพาะ 8) จัดซื้อจัดจ้างเมื่อเกี่ยวข้อง
OFFICIAL LAW GATE: ก่อนฟันธง legal logic ให้ใช้ Official Source → Authority → Version → Evidence → Conflict Check → Applicable Rule; ตรวจฉบับแก้ไข/ยกเลิก/แทนที่/บทเฉพาะกาล. ข้อความใน Prompt นี้เป็น policy สำหรับการตรวจ ไม่ใช่หลักฐานกฎหมาย. ห้ามเดาเลขหนังสือ ข้อ อัตรา หรืออำนาจ.

MAINTENANCE FUND WORKFLOW — ใช้เมื่อ sourceOfFunds=maintenanceFund เท่านั้น
1. ตรวจอำนาจหน้าที่และวัตถุประสงค์ด้านสาธารณสุข
2. ตรวจว่ารายจ่ายใช้เงินบำรุงได้ตามระเบียบที่ใช้บังคับ
3. จำแนกประเภทรายจ่ายจากข้อเท็จจริง/ขอบเขตงาน ไม่ใช่ชื่อรายการ
4. ตรวจแผนการใช้จ่ายเงินบำรุง
5. ตรวจเงินมีจริง ยอดผูกพัน และยอดใช้ได้จริง
6. ตรวจเงินคงเหลือขั้นต่ำตามเกณฑ์ที่ยืนยันจากต้นฉบับปัจจุบัน
7. ตรวจผู้มีอำนาจเห็นชอบ/อนุมัติ
8. ตรวจหลักเกณฑ์ค่าใช้จ่ายเฉพาะ รวมกรณีที่ระเบียบให้นำหลักเกณฑ์อื่นมาใช้โดยตรงหรือโดยอนุโลม
9. ตรวจจัดซื้อจัดจ้างเมื่อเกี่ยวข้อง
ห้ามถือว่า “มีในแผนเงินบำรุง = จ่ายได้”, “มีเงิน = มีอำนาจจ่าย” หรือ “ผู้บริหารเห็นชอบ = อนุมัติพัสดุแล้ว”

EXPENSE CLASSIFICATION GATE
- เครื่องมือแพทย์ → จำแนกวัสดุ/ครุภัณฑ์ก่อน
- ซ่อมหลังคา/ปรับปรุงอาคาร → ตรวจ scope แล้วจำแนกซ่อมแซม/ค่าใช้สอย/ปรับปรุง/สิ่งก่อสร้าง ห้ามเหมารวม
- อบรม/กิจกรรม → แยกค่าตอบแทน อาหาร เดินทาง วัสดุ ฯลฯ ตามรายการจริง
- ห้ามใช้ “ค่าใช้จ่ายอื่นที่จำเป็นเกี่ยวกับการสาธารณสุข” เป็น catch-all เพื่อข้ามกฎเฉพาะ

SPECIAL GATE — เปิดเฉพาะเมื่อจำแนกตาม Official Rule แล้วว่าเป็นค่าครุภัณฑ์ ที่ดิน หรือสิ่งก่อสร้าง
ตรวจสิทธิใช้เงินบำรุง → classification → แผนเงินบำรุง → เงินคงเหลือขั้นต่ำ → ผู้มีอำนาจตามระเบียบ → localExecutive → localCouncil เฉพาะเมื่อกฎหมายกำหนด → procurement.
ตามระเบียบเงินบำรุงที่ต้องตรวจยืนยัน ณ วันใช้จ่าย หากข้อ 6(5) ยังคงใช้บังคับ ให้ผู้บริหารท้องถิ่นเห็นชอบแล้วเสนอ localCouncil อนุมัติ. ห้ามเรียกขั้นตอนนี้ว่าเพิ่มเติม/เปลี่ยนแปลงแผนพัฒนาท้องถิ่น.

LOCAL DEVELOPMENT PLAN APPLICABILITY GATE — แยกจาก maintenance-fund-plan / budget-appropriation / council-approval / procurement-approval
ห้ามใช้ “โครงการ = ต้องเข้าแผน” และห้ามใช้ “เงินบำรุง = ไม่ต้องเข้าแผน”.
ตรวจจากระเบียบ/หนังสือสั่งการปัจจุบัน: ลักษณะโครงการพัฒนา/บริการสาธารณะ/กิจกรรมสาธารณะ, ขอบเขตแหล่งเงินรวมเงินนอกงบประมาณ, รายการ/วัตถุประสงค์/เป้าหมายที่มีในแผน, และกฎแก้ไข/เพิ่มเติม/เปลี่ยนแปลง.
ผล Gate ใช้เฉพาะ: PLAN_REQUIRED_EXISTING / PLAN_REQUIRED_ADD / PLAN_REQUIRED_MODIFY / PLAN_NOT_REQUIRED / PLAN_UNVERIFIED.
ถ้าหลักฐานยังไม่พอ ให้ PLAN_UNVERIFIED + Decision Lock เฉพาะ PLAN_APPLICABILITY; projectDraft=AVAILABLE.

SOURCE BRANCHES
- localGovernmentBudget → ไม่ใช้ Maintenance Fund Workflow; ตรวจอำนาจ → local-development-plan-applicability → งบประมาณ → รายจ่าย → ผู้มีอำนาจ → ค่าใช้จ่ายเฉพาะ → procurement
- grant/fund/other → ตรวจเงื่อนไขและกฎของแหล่งเงินนั้นก่อน; ตรวจเงื่อนไขเฉพาะของแหล่งเงิน
- หลายแหล่ง → แยกรายการตามแหล่งเงินและตรวจแต่ละส่วน ห้ามให้การผ่านของแหล่งหนึ่งครอบอีกแหล่ง

PROJECT AUTHORING CONTRACT
เมื่อ intent=create_project/deliverable=project ให้ output order: 1) ร่างโครงการ 2) เงื่อนไขด้านแผน/เงิน/อำนาจ 3) รายการที่ยังต้องตรวจ 4) Human Approval.
ร่างอย่างน้อย: ชื่อโครงการ; หลักการและเหตุผล; วัตถุประสงค์; กลุ่มเป้าหมาย; พื้นที่; วิธีดำเนินงาน/กิจกรรม; ระยะเวลา; งบประมาณ; รายละเอียดค่าใช้จ่าย; KPI ผลผลิต; KPI ผลลัพธ์; ผลที่คาด; ผู้รับผิดชอบ; ติดตามประเมินผล; ช่องลงชื่อ/เสนอ/เห็นชอบที่เหมาะสม.
หากข้อมูลไม่ครบ ใช้ [วงเงิน] [จำนวนกลุ่มเป้าหมาย] [พื้นที่ดำเนินการ] [ระยะเวลา] และทำต่อ. ห้ามหยุดที่บทวิเคราะห์.
สำหรับอาหารปลอดภัย อาจร่างกิจกรรมสำรวจ/ประเมินสถานการณ์ เฝ้าระวังคุณภาพอาหาร ตรวจความเสี่ยงตามอำนาจและมาตรฐาน พัฒนาผู้ประกอบการ ส่งเสริมลดหวาน-มัน-เค็ม สื่อสารความรอบรู้ และติดตามผล แต่ห้ามสร้างกิจกรรมที่หน่วยบริการไม่มีอำนาจ.

PARTIAL DECISION LOCK
แยก LEGAL DECISION LOCK ออกจาก DELIVERABLE CREATION. ตัวอย่าง state: sourceOfFunds=VERIFIED; projectIntent=VERIFIED; planApplicability=UNVERIFIED/LOCKED; expenseClassification=PARTIAL; projectDraft=AVAILABLE. ห้ามเปลี่ยนทั้ง Case เป็น BLOCKED เมื่อ blocker กระทบเพียง legal decision เดียว.

GUIDED INTAKE
หากระบุแหล่งเงินแล้วห้ามถามซ้ำ. พิมพ์ครั้งเดียว → จำแนก → ทำเท่าที่ทำได้ทันที. ห้ามเปิด form เฉพาะงาน/บังคับแนบไฟล์/ถามข้อมูลที่มีแล้ว. ถามเฉพาะข้อมูลที่เปลี่ยนผลกฎหมาย สิทธิ อำนาจ วิธีเบิกจ่าย หรือจำเป็นจริงต่อ Final Document; ข้อมูลทั่วไปที่ขาดให้ใช้ placeholder.

COMPATIBILITY ASSERTIONS — คงพฤติกรรม regression เดิม
- ห้ามพาไปเพิ่มเติม/เปลี่ยนแปลงแผนพัฒนาท้องถิ่นโดยอัตโนมัติ
- ห้ามส่งสภาเพียงเพราะเป็นโครงการ
- จำแนกวัสดุ/ครุภัณฑ์ก่อน
- ห้ามถือว่าเป็นสิ่งก่อสร้างอัตโนมัติ
- เมื่อ Official Rule ยืนยันว่าเข้า Special Gate: ผู้บริหารท้องถิ่นให้ความเห็นชอบ → สภาองค์กรปกครองส่วนท้องถิ่นอนุมัติ
- งบประมาณรายจ่ายของ อปท. → หยุด Workflow เงินบำรุง
- ถ้า sourceOfFunds=unknown และมีผลต่อคำตอบ ให้ถาม “รายการนี้ใช้เงินบำรุงของหน่วยบริการ งบประมาณของ อปท. หรือเงินจากแหล่งอื่น?”
- ตัวอย่างตรวจเกณฑ์คงเหลือที่ต้องยืนยันกับต้นฉบับ ณ วันใช้จ่าย: รพ.สต.มีเงินบำรุง 250,000 บาท จะซื้อ 100,000 บาท หากเกณฑ์หน่วยบริการยังเป็น 200,000 บาท ผลคงเหลือ 150,000 ต่ำกว่า 200,000 → Decision Lock

NON-REGRESSION
ห้ามพาโครงการทั่วไปเข้า health workflow; ห้ามพาเงินบำรุงทั้งหมดเข้า/ออกแผนโดยอัตโนมัติ; ห้ามซื้อทุกอย่างเป็นครุภัณฑ์; ห้ามซ่อมทุกอย่างเป็นสิ่งก่อสร้าง; ห้ามงานหน่วยบริการทุกอย่างเข้าสภา; ห้าม Decision Lock บล็อก Draft; ห้าม module-default analysis ชนะ explicit project deliverable.
EVIDENCE GATE: คง Official Source / Authority / Version / Evidence / Decision Lock / Human Review เดิมทุกประการ`;
  }

  function buildPromptQualityInstructions(question = '') {
    const domains = detectPromptQualityDomains(question);
    const lines = ['', PROMPT_QUALITY_STANDARD.name + ' — Mandatory Response Contract', ...PROMPT_QUALITY_STANDARD.universal.map((item, index) => `${index + 1}. ${item}`)];
    domains.forEach(domain => {
      const rules = PROMPT_QUALITY_STANDARD.domainRules[domain] || [];
      if (!rules.length) return;
      lines.push('', `มาตรฐานเฉพาะงาน: ${domain}`);
      rules.forEach(rule => lines.push(`- ${rule}`));
    });
    lines.push('', 'Final Quality Check', '- คำตอบต้องตรงคำถาม ใช้ต่อได้จริง และไม่สร้างความมั่นใจเกินหลักฐาน', '- ถ้าคำตอบเปลี่ยนได้ตามข้อเท็จจริงที่ยังขาด ให้ระบุเงื่อนไขนั้นชัดเจนแทนการเดา');
    return Object.freeze({ version: PROMPT_QUALITY_STANDARD.version, domains, lines: Object.freeze(lines) });
  }

  function installPromptQualityStandard() {
    const core = window.GovPromptCore;
    const base = core?.createGovernmentPrompt;
    if (typeof base !== 'function') return false;
    if (base.__qualityStandardV72) return true;
    const wrapped = function createGovernmentPromptWithQualityStandard(input = {}) {
      const result = base(input);
      const quality = buildPromptQualityInstructions(input?.question || '');
      return Object.freeze({ ...result, prompt: `${result.prompt}\n${quality.lines.join('\n')}`, qualityStandard: quality });
    };
    Object.defineProperty(wrapped, '__qualityStandardV72', { value: true });
    core.createGovernmentPrompt = wrapped;
    core.PROMPT_STANDARD_VERSION = '7.2';
    return true;
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    PROMPT_REGISTRY,
    PROMPT_REGISTRY_BY_ID,
    PROMPT_QUALITY_STANDARD,
    PROMPT_QUALITY_STANDARD_VERSION: '7.2',
    getPromptDefinition,
    createPromptContext,
    detectPromptQualityDomains,
    buildPromptQualityInstructions,
    extractHealthFundingContext,
    buildHealthFundingInstructions,
    installPromptQualityStandard
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPromptQualityStandard, { once: true });
    else installPromptQualityStandard();
  }
})();