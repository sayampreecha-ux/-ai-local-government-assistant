(() => {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  const definitions = [
    ['GP001', 'ผู้ช่วยงานสารบรรณ', 'records', 'จัดทำ ตรวจ และปรับปรุงหนังสือราชการไทย'],
    ['GP002', 'ผู้ช่วยกฎหมาย', 'legal', 'วิเคราะห์ข้อกฎหมาย ระเบียบ หนังสือสั่งการ และความเสี่ยงทางกฎหมาย'],
    ['GP003', 'ผู้ช่วยพัสดุและ TOR', 'procurement', 'ตรวจ TOR กระบวนการจัดซื้อจัดจ้าง และความเสี่ยงด้านการแข่งขัน'],
    ['GP004', 'ผู้ช่วยแผน โครงการ และงบประมาณ', 'planning-budget', 'วิเคราะห์แผน โครงการ งบประมาณ ความจำเป็น และความคุ้มค่า'],
    ['GP005', 'ผู้ช่วยการเงินและการคลัง', 'finance', 'วิเคราะห์สิทธิ เงื่อนไข และขั้นตอนการเงิน การคลัง และการเบิกจ่าย'],
    ['GP006', 'ผู้ช่วยงานบุคคล', 'human-resources', 'วิเคราะห์งานบริหารบุคคล คำสั่ง สิทธิ และกระบวนการทางวินัย'],
    ['GP007', 'ผู้ช่วยงานช่างและวิศวกรรม', 'engineering', 'ตรวจงานช่าง แบบ ประมาณการ มาตรฐาน และความเสี่ยงทางวิศวกรรม'],
    ['GP008', 'ผู้ช่วยสาธารณสุขและ รพ.สต.', 'public-health', 'วิเคราะห์งานสาธารณสุข รพ.สต. เงินบำรุง และการบริหารบริการสุขภาพ'],
    ['GP009', 'ผู้ช่วยการศึกษา', 'education', 'วิเคราะห์งานการศึกษา โครงการ สิทธิ และการบริหารสถานศึกษา'],
    ['GP010', 'ผู้ช่วยตรวจสอบภายใน', 'internal-audit', 'ประเมินการควบคุมภายใน ความเสี่ยง หลักฐาน และข้อเสนอแนะตรวจสอบ'],
    ['GP011', 'ผู้ช่วยผู้บริหาร', 'executive', 'สรุปข้อมูลเพื่อการตัดสินใจของผู้บริหาร พร้อมทางเลือกและความเสี่ยง'],
    ['GP012', 'ผู้ช่วยประชาสัมพันธ์', 'public-relations', 'สร้างและตรวจเนื้อหาประชาสัมพันธ์ภาครัฐจากข้อเท็จจริงที่ตรวจสอบได้'],
    ['GP013', 'ผู้ช่วยงานสภาท้องถิ่น', 'council', 'วิเคราะห์งานสภา การประชุม ญัตติ ข้อบัญญัติ และกระบวนการที่เกี่ยวข้อง']
  ];

  const PROMPT_REGISTRY = deepFreeze(definitions.map(([moduleId, title, transactionType, mission]) => ({
    moduleId,
    title,
    mission,
    path: `${moduleId.toLowerCase()}.html`,
    transactionTypes: [transactionType],
    promptSource: 'master-prompt-v7+legacy-inline',
    promptVersion: '7.0.0-alpha.1',
    status: 'active'
  })));

  const PROMPT_REGISTRY_BY_ID = deepFreeze(Object.fromEntries(
    PROMPT_REGISTRY.map(definition => [definition.moduleId, definition])
  ));

  function getPromptDefinition(moduleId) {
    const normalized = String(moduleId ?? '').trim().toUpperCase();
    return PROMPT_REGISTRY_BY_ID[normalized];
  }

  function createPromptContext(moduleId, input = {}) {
    const definition = getPromptDefinition(moduleId);
    const createSharedContext = window.GovPromptCore?.createSharedContext;
    if (!definition || typeof createSharedContext !== 'function') return undefined;
    return createSharedContext({
      domain: definition.transactionTypes[0],
      moduleId: definition.moduleId,
      moduleTitle: definition.title,
      promptVersion: definition.promptVersion,
      ...input
    });
  }

  function buildModulePrompt(moduleId, options = {}) {
    const definition = getPromptDefinition(moduleId);
    const buildMasterPrompt = window.GovPromptCore?.buildMasterPrompt;
    if (!definition || typeof buildMasterPrompt !== 'function') return '';

    return buildMasterPrompt({
      mission: definition.mission,
      domain: definition.transactionTypes[0],
      ...options
    });
  }

  function getPromptRuntime(moduleId, input = {}) {
    const definition = getPromptDefinition(moduleId);
    if (!definition) return undefined;

    return Object.freeze({
      definition,
      context: createPromptContext(moduleId, input),
      masterPrompt: buildModulePrompt(moduleId, input)
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.PROMPT_REGISTRY = PROMPT_REGISTRY;
  window.GovPromptCore.PROMPT_REGISTRY_BY_ID = PROMPT_REGISTRY_BY_ID;
  window.GovPromptCore.getPromptDefinition = getPromptDefinition;
  window.GovPromptCore.createPromptContext = createPromptContext;
  window.GovPromptCore.buildModulePrompt = buildModulePrompt;
  window.GovPromptCore.getPromptRuntime = getPromptRuntime;
})();
