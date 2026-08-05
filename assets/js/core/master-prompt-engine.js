(() => {
  'use strict';

  const MASTER_PROMPT_VERSION = '7.0.0-alpha.1';

  const CORE_RULES = Object.freeze([
    'ใช้ข้อเท็จจริงและเอกสารที่ผู้ใช้ให้เป็นหลัก',
    'ห้ามสมมติชื่อบุคคล วันที่ เลขหนังสือ วงเงิน เลขมาตรา หรือข้อกฎหมาย',
    'อ่านเอกสารแนบและผลการค้นหาที่เกี่ยวข้องก่อนวิเคราะห์',
    'แยกข้อเท็จจริง ข้อมูลที่ขาด ฐานอำนาจ การวิเคราะห์ ความเสี่ยง และข้อเสนอแนะ',
    'ตรวจข้อมูลส่วนบุคคลและข้อมูลอ่อนไหวก่อนสร้างคำตอบ',
    'เมื่อหลักฐานไม่พอ ให้ระบุว่า ต้องตรวจสอบหรือเพิ่มเติม โดยไม่ฟันธงเกินหลักฐาน',
    'เมื่อพบข้อมูลหลายฉบับ ให้พิจารณาความใหม่ สถานะการใช้บังคับ และความน่าเชื่อถือของแหล่งข้อมูล',
    'ทุกข้อสรุปสำคัญต้องเชื่อมโยงกับหลักฐานหรือแหล่งอ้างอิงที่ตรวจสอบได้'
  ]);

  const OUTPUT_SECTIONS = Object.freeze([
    'คำตอบเบื้องต้น',
    'ข้อเท็จจริงที่ใช้',
    'ข้อมูลที่ยังขาด',
    'ฐานอำนาจหรือแหล่งอ้างอิง',
    'การวิเคราะห์',
    'ความเสี่ยง',
    'ข้อเสนอแนะ',
    'ระดับความมั่นใจ'
  ]);

  function normalizeList(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map(item => String(item ?? '').trim())
      .filter(Boolean);
  }

  function formatSection(title, items) {
    const normalized = normalizeList(items);
    if (!normalized.length) return '';
    return `${title}\n${normalized.map(item => `- ${item}`).join('\n')}`;
  }

  function buildMasterPrompt(options = {}) {
    const {
      role = 'Government AI Copilot ผู้เชี่ยวชาญงานราชการไทยและองค์กรปกครองส่วนท้องถิ่น',
      mission = '',
      domain = 'general',
      userFacts = [],
      requiredSearchSources = [],
      moduleRules = [],
      outputSections = OUTPUT_SECTIONS
    } = options;

    const blocks = [
      `บทบาท\n${role}`,
      mission ? `ภารกิจ\n${String(mission).trim()}` : '',
      `ประเภทงาน\n${String(domain).trim() || 'general'}`,
      formatSection('ข้อมูลจากผู้ใช้', userFacts),
      formatSection('แหล่งข้อมูลที่ต้องค้นก่อนตอบ', requiredSearchSources),
      formatSection('หลักการทำงานกลาง', CORE_RULES),
      formatSection('ข้อกำหนดเฉพาะโมดูล', moduleRules),
      formatSection('รูปแบบผลลัพธ์', outputSections)
    ].filter(Boolean);

    return blocks.join('\n\n');
  }

  function createMasterPromptConfig(overrides = {}) {
    return Object.freeze({
      version: MASTER_PROMPT_VERSION,
      coreRules: CORE_RULES,
      outputSections: OUTPUT_SECTIONS,
      ...overrides
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.MASTER_PROMPT_VERSION = MASTER_PROMPT_VERSION;
  window.GovPromptCore.CORE_RULES = CORE_RULES;
  window.GovPromptCore.OUTPUT_SECTIONS = OUTPUT_SECTIONS;
  window.GovPromptCore.buildMasterPrompt = buildMasterPrompt;
  window.GovPromptCore.createMasterPromptConfig = createMasterPromptConfig;
})();
