(() => {
  'use strict';

  const freezePreset = preset => Object.freeze({
    ...preset,
    structure: Object.freeze([...preset.structure])
  });

  const PRESETS = Object.freeze([
    freezePreset({
      id: 'easy-summary',
      label: 'สรุปเนื้อหาเข้าใจง่าย',
      shortLabel: 'สรุปง่าย',
      icon: '🧾',
      description: 'คัดเฉพาะสาระสำคัญ เรียงจากภาพรวมไปสู่รายละเอียด',
      structure: ['พาดหัวหลัก', 'สาระสำคัญ 3–5 ประเด็น', 'สิ่งที่ต้องดำเนินการ', 'แหล่งอ้างอิงและวันที่ข้อมูล']
    }),
    freezePreset({
      id: 'step-by-step',
      label: 'ขั้นตอน Step-by-Step',
      shortLabel: 'Step-by-Step',
      icon: '🔢',
      description: 'แปลงกระบวนการเป็นลำดับขั้นที่ทำตามได้',
      structure: ['ชื่อกระบวนการ', 'ขั้นตอนตามลำดับ', 'ผู้รับผิดชอบหรือผลลัพธ์แต่ละขั้น', 'จุดตรวจสอบก่อนจบ']
    }),
    freezePreset({
      id: 'timeline',
      label: 'Timeline ลำดับเวลา',
      shortLabel: 'Timeline',
      icon: '🗓️',
      description: 'เรียงเหตุการณ์ วัน เวลา หรือหมุดหมายสำคัญ',
      structure: ['จุดเริ่มต้น', 'เหตุการณ์ตามลำดับเวลา', 'สถานะปัจจุบัน', 'กำหนดการถัดไป']
    }),
    freezePreset({
      id: 'comparison',
      label: 'เปรียบเทียบ',
      shortLabel: 'เปรียบเทียบ',
      icon: '⚖️',
      description: 'เปรียบเทียบทางเลือกด้วยเกณฑ์เดียวกัน',
      structure: ['เกณฑ์เปรียบเทียบ', 'ข้อมูลแต่ละทางเลือก', 'ข้อดีและข้อจำกัด', 'ข้อสรุปแบบมีเงื่อนไข']
    }),
    freezePreset({
      id: 'workflow',
      label: 'Workflow กระบวนงาน',
      shortLabel: 'Workflow',
      icon: '🔄',
      description: 'แสดงข้อมูลนำเข้า กระบวนการ จุดตัดสินใจ การดำเนินการ และผลลัพธ์',
      structure: ['ข้อมูลนำเข้า', 'กระบวนการ', 'จุดตัดสินใจ', 'การดำเนินการ', 'ผลลัพธ์']
    }),
    freezePreset({
      id: 'checklist',
      label: 'Checklist ตรวจงาน',
      shortLabel: 'Checklist',
      icon: '✅',
      description: 'ทำรายการตรวจที่นำไปใช้หน้างานได้',
      structure: ['รายการตรวจ', 'หลักฐานที่ต้องมี', 'ผู้ตรวจหรือช่วงเวลาตรวจ', 'ผลผ่าน–ไม่ผ่าน']
    }),
    freezePreset({
      id: 'do-dont',
      label: 'Do & Don’t',
      shortLabel: 'Do & Don’t',
      icon: '🚦',
      description: 'แบ่งแนวปฏิบัติเป็นสิ่งที่ควรทำและไม่ควรทำ',
      structure: ['ควรทำ 3–5 ข้อ', 'ไม่ควรทำ 3–5 ข้อ', 'เหตุผลสั้น', 'ตัวอย่างที่ไม่เปิดเผยข้อมูลส่วนบุคคล']
    }),
    freezePreset({
      id: 'framework',
      label: 'Framework กรอบความคิด',
      shortLabel: 'Framework',
      icon: '🧩',
      description: 'จัดกลุ่มแนวคิดหลักและอธิบายความเชื่อมโยง',
      structure: ['หัวข้อหลัก', 'หมวดแนวคิด 4–6 หมวด', 'ความสัมพันธ์ระหว่างหมวด', 'แนวทางนำไปใช้']
    }),
    freezePreset({
      id: 'key-insights',
      label: 'ตัวเลขและ Key Insights',
      shortLabel: 'ตัวเลข/Insight',
      icon: '📊',
      description: 'เลือกตัวเลขจริง พร้อมความหมายและข้อสังเกตที่มีหลักฐานรองรับ',
      structure: ['ตัวเลขสำคัญ', 'หน่วยและช่วงเวลา', 'ความหมายของแต่ละค่า', 'Insight ที่มีหลักฐานรองรับ']
    }),
    freezePreset({
      id: 'quick-guide',
      label: 'คู่มือฉบับย่อ',
      shortLabel: 'คู่มือย่อ',
      icon: '📘',
      description: 'สรุปความหมาย วิธีใช้ ข้อควรระวัง และเคล็ดลับสำหรับใช้งานจริง',
      structure: ['สิ่งนี้คืออะไร', 'ใช้ทำอะไร', 'วิธีใช้งาน', 'สิ่งที่ควรระวัง', 'เคล็ดลับสำหรับใช้จริง']
    })
  ]);

  const AUTO_ID = 'auto';
  const DEFAULT_ID = 'easy-summary';
  const BY_ID = new Map(PRESETS.map(preset => [preset.id, preset]));

  function resolveOutputFormatPreset(id) {
    const normalized = String(id || AUTO_ID).trim();
    if (!normalized || normalized === AUTO_ID) return null;
    return BY_ID.get(normalized) || null;
  }

  function buildOutputFormatPresetBlock(id) {
    const preset = resolveOutputFormatPreset(id);
    if (!preset) return '';
    return [
      `รูปแบบการนำเสนอ: ${preset.label}`,
      `เป้าหมาย: ${preset.description}`,
      '',
      'โครงสร้างที่ต้องมี',
      ...preset.structure.map((item, index) => `${index + 1}. ${item}`),
      '',
      'ข้อกำกับสำหรับงานราชการและอินโฟกราฟิก',
      '- ใช้เฉพาะข้อเท็จจริง ตัวเลข วันที่ ชื่อบุคคล และชื่อหน่วยงานที่พบในข้อมูลต้นทาง',
      '- หากข้อมูลใดไม่มีหรือยืนยันไม่ได้ ให้ระบุ [ต้องตรวจสอบ/เพิ่มเติม] และห้ามแต่งเติม',
      '- ข้อความต้องสั้น อ่านง่ายบนโทรศัพท์ และเรียงสาระสำคัญก่อนรายละเอียด',
      '- งานกฎหมาย การเงิน และพัสดุต้องระบุแหล่งอ้างอิง ฉบับ และวันที่ตรวจสอบข้อมูล',
      '- ปกปิดข้อมูลส่วนบุคคล ข้อมูลสุขภาพ และข้อมูลลับที่ไม่จำเป็น',
      '- ส่งมอบทั้งข้อความพร้อมจัดวางและคำแนะนำโครงสร้างภาพ โดยไม่สร้างตราสัญลักษณ์หรือคำรับรองที่ไม่มีต้นฉบับ',
      '- ผลลัพธ์เป็นฉบับร่าง ผู้ใช้ต้องตรวจข้อเท็จจริงและอนุมัติก่อนเผยแพร่หรือใช้ดำเนินการ'
    ].join('\n');
  }

  function resolveCompatible(id) {
    return resolveOutputFormatPreset(id) || BY_ID.get(DEFAULT_ID);
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.OUTPUT_FORMAT_PRESETS = PRESETS;
  window.GovPromptCore.OUTPUT_FORMAT_AUTO_ID = AUTO_ID;
  window.GovPromptCore.OUTPUT_FORMAT_DEFAULT_ID = DEFAULT_ID;
  window.GovPromptCore.resolveOutputFormatPreset = resolveOutputFormatPreset;
  window.GovPromptCore.buildOutputFormatPresetBlock = buildOutputFormatPresetBlock;

  window.GOVPROMPT_OUTPUT_FORMATS = Object.freeze({
    formats: PRESETS,
    autoId: AUTO_ID,
    defaultId: DEFAULT_ID,
    resolve: resolveCompatible,
    buildPromptBlock: buildOutputFormatPresetBlock
  });
})();
