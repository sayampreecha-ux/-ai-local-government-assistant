(() => {
  'use strict';

  const VERSION = '7.2';
  const STANDARD = Object.freeze({
    version: VERSION,
    name: 'GovPrompt Prompt Quality Standard v7.2',
    universal: Object.freeze([
      'Answer First: เริ่มด้วยคำตอบ/ชิ้นงานที่ผู้ใช้ใช้ตัดสินใจหรือใช้งานต่อได้ทันที',
      'ห้ามแต่งเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา อัตรา ชื่อบุคคล URL หรือข้อเท็จจริงที่ไม่มีหลักฐานรองรับ',
      'ประเด็นกฎหมาย สิทธิ อำนาจ การเงิน พัสดุ บุคคล และข้อมูลที่เปลี่ยนตามเวลา ต้องตรวจแหล่งราชการ/ต้นฉบับและสถานะฉบับล่าสุดก่อนฟันธง',
      'ถ้ายังยืนยันหลักฐานปัจจุบันไม่ได้ ให้ระบุชัดว่า “ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง”',
      'แยกข้อเท็จจริงที่ยืนยันแล้ว ประเด็นวิเคราะห์ ความเสี่ยง และข้อเสนอแนะเมื่อมีผลต่อการตัดสินใจ',
      'ถามข้อมูลเพิ่มเฉพาะช่องว่างที่สามารถเปลี่ยนคำตอบหรือจำเป็นต่อชิ้นงานจริง',
      'ตรวจ PDPA ข้อมูลอ่อนไหว ข้อมูลลับ และหลัก data minimization ก่อนใช้ข้อมูล',
      'AI ช่วยค้น วิเคราะห์ และร่าง แต่การอนุมัติ ลงนาม สั่งจ่าย ลงมติ หรือใช้อำนาจจริงต้องเป็น Human Approval'
    ]),
    domainRules: Object.freeze({
      finance: Object.freeze([
        'การเงิน/เบิกจ่าย: ตอบให้ชัดก่อนว่า “เบิกได้ / เบิกไม่ได้ / มีเงื่อนไข / หลักฐานยังไม่พอฟันธง”',
        'สรุปฐานอำนาจ เงื่อนไข แหล่งเงิน เอกสารประกอบ ผู้อนุมัติ/ผู้มีอำนาจ และจุดใช้ดุลพินิจ'
      ]),
      procurement: Object.freeze([
        'พัสดุ/TOR: ตรวจอำนาจ วิธีจัดซื้อจัดจ้าง การแบ่งซื้อแบ่งจ้าง ราคากลาง TOR/สเปก การแข่งขันอย่างเป็นธรรม คุณสมบัติ และความเสี่ยงร้องเรียน/ตรวจสอบ',
        'ห้ามเสนอเงื่อนไขล็อกสเปกหรือจำกัดการแข่งขันโดยไม่มีเหตุผลทางเทคนิคที่ตรวจสอบได้'
      ]),
      hr: Object.freeze([
        'งานบุคคล: แยกคุณสมบัติ สิทธิ เงื่อนไข ระยะเวลา วันที่มีผล ผู้มีอำนาจ และผลเมื่อเงื่อนไขใดไม่ครบ',
        'ห้ามสรุปสิทธิจากเงื่อนไขเพียงข้อเดียวเมื่อหลักเกณฑ์มีหลายองค์ประกอบ'
      ]),
      records: Object.freeze([
        'งานสารบรรณ: เมื่อผู้ใช้ขอร่าง ให้ส่งฉบับพร้อมใช้ก่อน ใช้ [ระบุ...] เฉพาะข้อมูลสำคัญที่ยังขาด',
        'คงรูปแบบและถ้อยคำราชการให้เหมาะกับประเภทหนังสือ โดยไม่ถามจุกจิกก่อนร่าง'
      ]),
      legal: Object.freeze([
        'วิเคราะห์กฎหมาย: ตรวจลำดับศักดิ์ วันมีผล ฉบับแก้ไข การยกเลิก บทเฉพาะกาล และข้อเท็จจริงตามช่วงเวลา',
        'หากแหล่งข้อมูลขัดกัน ให้ยึดต้นฉบับที่มีศักดิ์สูงกว่า/ใหม่กว่าและอธิบายเหตุผล'
      ]),
      health: Object.freeze([
        'สาธารณสุข/รพ.สต.: ตรวจฐานอำนาจ แหล่งเงิน ระเบียบเฉพาะ และข้อมูลสุขภาพเป็นข้อมูลอ่อนไหว ห้ามใช้ข้อมูลผู้ป่วยจริงที่ไม่จำเป็น'
      ]),
      engineering: Object.freeze([
        'งานช่าง: แยกมาตรฐานทางเทคนิค แบบ รายการคำนวณ การตรวจรับ ความปลอดภัย และฐานอำนาจ/งบประมาณที่เกี่ยวข้อง'
      ]),
      pr: Object.freeze([
        'ประชาสัมพันธ์: ให้ข้อความพร้อมเผยแพร่ กระชับ ตรวจชื่อ ตัวเลข วันที่ ลิงก์ และข้อมูลส่วนบุคคลก่อนโพสต์'
      ])
    })
  });

  function detectDomains(question = '') {
    const source = String(question).toLocaleLowerCase();
    const domains = [];
    if (/(?:เบิก|การเงิน|คลัง|ฎีกา|ค่าใช้จ่าย|เงินสะสม|โบนัส|งบประมาณ)/i.test(source)) domains.push('finance');
    if (/(?:พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|สัญญา|ผู้รับจ้าง|e-bidding)/i.test(source)) domains.push('procurement');
    if (/(?:บุคคล|บรรจุ|แต่งตั้ง|เลื่อนเงินเดือน|วินัย|พนักงาน|ข้าราชการ|อัตรากำลัง)/i.test(source)) domains.push('hr');
    if (/(?:หนังสือราชการ|บันทึกข้อความ|สารบรรณ|ร่างหนังสือ|คำสั่ง|ประกาศ)/i.test(source)) domains.push('records');
    if (/(?:กฎหมาย|ระเบียบ|อำนาจ|ข้อหารือ|คำพิพากษา|มาตรา|สิทธิ)/i.test(source)) domains.push('legal');
    if (/(?:รพ\.สต|สาธารณสุข|สุขภาพ|เงินบำรุง|ผู้ป่วย|ยา|เวชภัณฑ์)/i.test(source)) domains.push('health');
    if (/(?:ถนน|สะพาน|ก่อสร้าง|งานช่าง|วิศวกรรม|แบบ|ประมาณราคา)/i.test(source)) domains.push('engineering');
    if (/(?:ประชาสัมพันธ์|โพสต์|ข่าว|อินโฟกราฟิก|แคปชัน|โปสเตอร์)/i.test(source)) domains.push('pr');
    return Object.freeze([...new Set(domains)]);
  }

  function buildQualityInstructions(question = '') {
    const domains = detectDomains(question);
    const lines = [
      '',
      `GovPrompt Prompt Quality Standard v${VERSION} — Mandatory Response Contract`,
      ...STANDARD.universal.map((item, index) => `${index + 1}. ${item}`)
    ];
    domains.forEach(domain => {
      const rules = STANDARD.domainRules[domain] || [];
      if (!rules.length) return;
      lines.push('', `มาตรฐานเฉพาะงาน: ${domain}`);
      rules.forEach(rule => lines.push(`- ${rule}`));
    });
    lines.push('', 'Final Quality Check', '- คำตอบต้องตรงคำถาม ใช้ต่อได้จริง และไม่สร้างความมั่นใจเกินหลักฐาน', '- ถ้าคำตอบเปลี่ยนได้ตามข้อเท็จจริงที่ยังขาด ให้ระบุเงื่อนไขนั้นชัดเจนแทนการเดา');
    return Object.freeze({ version: VERSION, domains, lines: Object.freeze(lines) });
  }

  const core = window.GovPromptCore = window.GovPromptCore || {};
  const baseCreateGovernmentPrompt = core.createGovernmentPrompt;
  if (typeof baseCreateGovernmentPrompt === 'function' && !baseCreateGovernmentPrompt.__qualityStandardV72) {
    const wrapped = function createGovernmentPromptWithQualityStandard(input = {}) {
      const result = baseCreateGovernmentPrompt(input);
      const quality = buildQualityInstructions(input?.question || '');
      return Object.freeze({
        ...result,
        prompt: `${result.prompt}\n${quality.lines.join('\n')}`,
        qualityStandard: quality
      });
    };
    Object.defineProperty(wrapped, '__qualityStandardV72', { value: true });
    core.createGovernmentPrompt = wrapped;
  }

  core.PROMPT_QUALITY_STANDARD = STANDARD;
  core.PROMPT_QUALITY_STANDARD_VERSION = VERSION;
  core.detectPromptQualityDomains = detectDomains;
  core.buildPromptQualityInstructions = buildQualityInstructions;
})();
