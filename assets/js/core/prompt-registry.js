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
    ['GP012', 'ผู้ช่วยประชาสัมพันธ์', 'public-relations']
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
      ...input
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.PROMPT_REGISTRY = PROMPT_REGISTRY;
  window.GovPromptCore.PROMPT_REGISTRY_BY_ID = PROMPT_REGISTRY_BY_ID;
  window.GovPromptCore.getPromptDefinition = getPromptDefinition;
  window.GovPromptCore.createPromptContext = createPromptContext;
})();
