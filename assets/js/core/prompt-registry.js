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
    if (/(?:รพ\.สต|รพสต|สาธารณสุข|สุขภาพ|เงินบำรุง|ผู้ป่วย|อสม\.?|ยา|เวชภัณฑ์|เบาหวาน)/i.test(source)) domains.push('health');
    if (/(?:ถนน|สะพาน|ก่อสร้าง|งานช่าง|วิศวกรรม|แบบ|ประมาณราคา|ผู้รับจ้าง|หน้างาน|ความหนาแน่นดิน)/i.test(source)) domains.push('engineering');
    if (councilMeeting) domains.push('council');
    if (/(?:ประชาสัมพันธ์|โพสต์|ข่าว|อินโฟกราฟิก|แคปชัน|โปสเตอร์|เชิญใช้)/i.test(source)) domains.push('pr');
    return Object.freeze([...new Set(domains)]);
  }

  // Instruction policy, not a verified legal ruling or an authorization to spend.
  function buildHealthFundingInstructions(question = '', { healthContext = false } = {}) {
    const text = String(question);
    if (!healthContext && !/(?:เงินบำรุง|โรงพยาบาล|รพ\.?สต\.?|สอน\.|หน่วยบริการ|สาธารณสุข|ส่งเสริมสุขภาพ|อาหารปลอดภัย)/i.test(text)) return '';
    return `SOURCE OF FUNDS FIRST — งานโรงพยาบาล รพ.สต. สอน. และหน่วยบริการสาธารณสุข
ใช้กับ อปท. ทุกประเภทที่อยู่ภายใต้ระเบียบที่ใช้บังคับ ห้ามจำกัดเฉพาะ อบจ.
ห้ามใช้คำว่า “โครงการ” หรือชื่อหน่วยงานตัดสินว่าต้องเข้าแผนพัฒนาท้องถิ่นหรือไม่ และห้ามเหมารวมว่าทุกโครงการต้องเข้าหรือไม่ต้องเข้าแผน
ตรวจตามลำดับ: 1. แหล่งเงิน → 2. อำนาจหน้าที่/วัตถุประสงค์การใช้เงิน → 3. ประเภทรายจ่าย → 4. แผนที่ระเบียบของแหล่งเงินกำหนด → 5. เงื่อนไขการใช้เงิน → 6. ผู้มีอำนาจเห็นชอบ/อนุมัติ → 7. ระเบียบค่าใช้จ่ายเฉพาะ → 8. กฎหมายจัดซื้อจัดจ้างเมื่อเกี่ยวข้อง
GUIDED INTAKE: อ่านข้อเท็จจริงและคำตอบก่อนหน้าก่อน หากระบุแหล่งเงินแล้วห้ามถามซ้ำ หากยังไม่ระบุและจำเป็น ถามในช่องหลักทีละประเด็นเพียง “รายการนี้ใช้เงินบำรุงของหน่วยบริการ งบประมาณของ อปท. หรือเงินจากแหล่งอื่น?” ห้ามเปิดฟอร์มเฉพาะงานหรือบังคับแนบไฟล์ ห้ามถือว่าชื่อเมนูเป็นคำยืนยันแหล่งเงินของผู้ใช้ หากหลายแหล่งหรือขัดกันให้แยกตรวจแต่ละส่วนก่อน
A. เงินบำรุง → Workflow เงินบำรุงโรงพยาบาลและหน่วยบริการสาธารณสุขของ อปท. ห้ามพาไปเพิ่มเติม/เปลี่ยนแปลงแผนพัฒนาท้องถิ่นโดยอัตโนมัติเพียงเพราะเป็นโครงการหรือไม่พบในแผนพัฒนาท้องถิ่น
ตรวจวัตถุประสงค์เพื่อการสาธารณสุข/บริหารจัดการที่ระเบียบอนุญาต ประเภทตามข้อ 6 แผนการใช้จ่ายเงินบำรุงที่ชอบด้วยระเบียบ เงินเพียงพอ เงินคงเหลือข้อ 6/1 หลักเกณฑ์เฉพาะ ผู้มีอำนาจ และจัดซื้อจัดจ้าง ห้ามถือว่า “มีในแผนเงินบำรุง = จ่ายได้ทันที”
B. ตรวจประเภทข้อ 6 กับต้นฉบับที่ใช้บังคับ: (1) ค่ายาและเวชภัณฑ์ (2) ค่าวัสดุทางการแพทย์และวัสดุอื่น (3) ค่าตอบแทนทางการแพทย์และฝ่ายสนับสนุนตามเงื่อนไข (4) ค่าบริการทางการแพทย์ให้แก่หน่วยบริการอื่น (5) ค่าครุภัณฑ์ ที่ดินและสิ่งก่อสร้าง (6) ค่าใช้สอย (7) ค่าสาธารณูปโภค (8) ค่าจ้างลูกจ้างชั่วคราว (9) ค่าตอบแทนการปฏิบัติงานนอกเวลาราชการ (10) ค่าเดินทางไปราชการและการเข้ารับการฝึกอบรม (11) ค่าใช้จ่ายอื่นที่จำเป็นเกี่ยวกับการสาธารณสุข
รายจ่ายที่ให้นำหลักเกณฑ์กระทรวงสาธารณสุขมาใช้โดยอนุโลม ต้องตรวจหลักเกณฑ์นั้นด้วย ห้ามใช้ (11) เป็นสิทธิครอบจักรวาล
C. SPECIAL GATE ข้อ 6 (5): จำแนกประเภทรายจ่ายจากหลักเกณฑ์และข้อเท็จจริงก่อน → ตรวจสิทธิใช้เงินบำรุง → ตรวจแผนเงินบำรุง → ตรวจเงินคงเหลือข้อ 6/1 → ผู้บริหารท้องถิ่นให้ความเห็นชอบ → สภาองค์กรปกครองส่วนท้องถิ่นอนุมัติ → ดำเนินการตามกฎหมาย/ระเบียบอื่นรวมจัดซื้อจัดจ้าง
ห้ามเรียกการอนุมัติของสภาตามข้อ 6 (5) ว่า “การเพิ่มเติม/เปลี่ยนแปลงแผนพัฒนาท้องถิ่น” ห้ามส่งสภาเพียงเพราะเป็นโครงการ
ซื้อเครื่องมือแพทย์: จำแนกวัสดุ/ครุภัณฑ์ก่อน ถ้าเป็นครุภัณฑ์จึงใช้ Special Gate; ซ่อมหลังคา: จำแนกค่าใช้สอย/สิ่งก่อสร้างจากขอบเขตงานก่อน ห้ามถือว่าเป็นสิ่งก่อสร้างอัตโนมัติ; ก่อสร้างอาคารใหม่: ตรวจข้อ 6 (5)
D. ก่อนอนุมัติรายจ่ายตามข้อ 6 ตรวจข้อ 6/1 และสถานะหน่วยบริการตามกฎหมาย: โรงพยาบาลคงเหลือไม่น้อยกว่า 500,000 บาท; หน่วยบริการสาธารณสุขคงเหลือไม่น้อยกว่า 200,000 บาท โดยต้องยืนยันเกณฑ์กับต้นฉบับที่ใช้บังคับ ณ วันที่ใช้จ่าย
คำนวณเงินหลังจ่ายและตรวจภาระผูกพัน/ยอดใช้ได้จริง ห้ามเดาตัวเลข หากต่ำกว่าเกณฑ์ให้ Decision Lock ระบุเงื่อนไขที่ไม่ผ่าน ห้ามแนะนำให้ดำเนินการต่อเสมือนชอบด้วยระเบียบ ตัวอย่าง รพ.สต. มี 250,000 ซื้อครุภัณฑ์ 100,000 → เหลือ 150,000 ต่ำกว่า 200,000 → Decision Lock
E. งบประมาณรายจ่ายของ อปท. → หยุด Workflow เงินบำรุง ตรวจอำนาจหน้าที่ → แผนพัฒนาท้องถิ่นตามระเบียบที่ใช้บังคับ → งบประมาณรายจ่าย → ประเภทรายจ่าย → อำนาจอนุมัติ → ระเบียบค่าใช้จ่ายเฉพาะ → จัดซื้อจัดจ้าง ห้ามนำกฎเงินบำรุงไปใช้กับงบประมาณ อปท.
F. เงินอุดหนุน กองทุน หรือเงินเฉพาะอื่น → ตรวจเงื่อนไขและกฎของแหล่งเงินนั้นก่อน ห้ามสันนิษฐานว่าเหมือนเงินบำรุงหรืองบประมาณ อปท.
EVIDENCE GATE: ข้อกำหนดนี้เป็นแนวทางตรวจ ไม่ใช่หลักฐานทางกฎหมาย ต้องตรวจ Official Source / Authority / Version / Evidence รวมขอบเขตใช้บังคับและฉบับแก้ไข หากยังไม่ครบ ให้ Decision Lock เฉพาะประเด็นที่ยืนยันไม่ได้ ห้ามเดากฎหมาย เลขหนังสือ หรืออำนาจอนุมัติ ให้ AI ปลายทางตรวจแหล่งทางการตามระบบเดิม`;
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
    buildHealthFundingInstructions,
    installPromptQualityStandard
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPromptQualityStandard, { once: true });
    else installPromptQualityStandard();
  }
})();