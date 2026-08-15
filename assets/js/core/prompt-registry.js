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
      'เรื่องกฎหมาย สิทธิ อำนาจ การเงิน พัสดุ บุคคล และข้อมูลที่เปลี่ยนตามเวลา ต้องตรวจแหล่งราชการ/ต้นฉบับและสถานะฉบับล่าสุดก่อนฟันธง',
      'ถ้ายังยืนยันหลักฐานปัจจุบันไม่ได้ ต้องระบุว่า “ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง”',
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
      legal: ['วิเคราะห์กฎหมาย: ตรวจลำดับศักดิ์ วันมีผล ฉบับแก้ไข การยกเลิก บทเฉพาะกาล และข้อเท็จจริงตามช่วงเวลา', 'หากแหล่งข้อมูลขัดกัน ให้ยึดต้นฉบับที่มีศักดิ์สูงกว่า/ใหม่กว่าและอธิบายเหตุผล'],
      health: ['สาธารณสุข/รพ.สต.: ตรวจฐานอำนาจ แหล่งเงิน ระเบียบเฉพาะ และถือข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว ห้ามใช้ข้อมูลผู้ป่วยจริงที่ไม่จำเป็น'],
      engineering: ['งานช่าง: แยกมาตรฐานทางเทคนิค แบบ รายการคำนวณ การตรวจรับ ความปลอดภัย และฐานอำนาจ/งบประมาณที่เกี่ยวข้อง'],
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
    if (/(?:เบิก|การเงิน|คลัง|ฎีกา|ค่าใช้จ่าย|เงินสะสม|เงินบำรุง|โบนัส|งบประมาณ)/i.test(source)) domains.push('finance');
    if (/(?:พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|สัญญา|ผู้รับจ้าง|ผู้ยื่น|ตรวจรับ|e-bidding)/i.test(source)) domains.push('procurement');
    if (/(?:บุคคล|บรรจุ|แต่งตั้ง|เลื่อนเงินเดือน|เลื่อนระดับ|ทดลองงาน|คุณสมบัติปลัด|วินัย|พนักงาน|ข้าราชการ|อัตรากำลัง)/i.test(source)) domains.push('hr');
    if (/(?:หนังสือราชการ|หนังสือ|บันทึกข้อความ|บันทึก|สารบรรณ|ร่างหนังสือ|คำสั่ง|ประกาศ)/i.test(source)) domains.push('records');
    if (/(?:กฎหมาย|ระเบียบ|อำนาจ|ข้อหารือ|คำพิพากษา|มาตรา|สิทธิ|หนังสือเวียน|บทเฉพาะกาล|หลักเกณฑ์)/i.test(source)) domains.push('legal');
    if (/(?:รพ\.สต|รพสต|สาธารณสุข|สุขภาพ|เงินบำรุง|ผู้ป่วย|อสม\.?|ยา|เวชภัณฑ์|เบาหวาน)/i.test(source)) domains.push('health');
    if (/(?:ถนน|สะพาน|ก่อสร้าง|งานช่าง|วิศวกรรม|แบบ|ประมาณราคา|ผู้รับจ้าง|หน้างาน|ความหนาแน่นดิน)/i.test(source)) domains.push('engineering');
    if (/(?:ประชาสัมพันธ์|โพสต์|ข่าว|อินโฟกราฟิก|แคปชัน|โปสเตอร์)/i.test(source)) domains.push('pr');
    return Object.freeze([...new Set(domains)]);
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
    installPromptQualityStandard
  });

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installPromptQualityStandard, { once: true });
    else installPromptQualityStandard();
  }
})();