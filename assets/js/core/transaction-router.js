(() => {
  'use strict';

  const fallbackModules = Array.from({ length: 12 }, (_, index) => {
    const moduleId = `GP${String(index + 1).padStart(3, '0')}`;
    return Object.freeze({ moduleId, path: `${moduleId.toLowerCase()}.html` });
  });
  const MODULES = window.GovPromptCore?.PROMPT_REGISTRY || Object.freeze(fallbackModules);

  const TRANSACTION_RULES = Object.freeze([
    { type: 'records', moduleId: 'GP001', terms: ['หนังสือ', 'สารบรรณ', 'บันทึกข้อความ', 'คำสั่ง', 'ประกาศ', 'ประชุม'] },
    { type: 'legal', moduleId: 'GP002', terms: ['กฎหมาย', 'ระเบียบ', 'ข้อบัญญัติ', 'นิติกรรม', 'อุทธรณ์', 'ร้องเรียน'] },
    { type: 'procurement', moduleId: 'GP003', terms: ['พัสดุ', 'จัดซื้อ', 'จัดจ้าง', 'tor', 'ราคากลาง', 'ตรวจรับ', 'สัญญา'] },
    { type: 'planning-budget', moduleId: 'GP004', terms: ['แผน', 'โครงการ', 'งบประมาณ', 'ยุทธศาสตร์', 'ตัวชี้วัด'] },
    { type: 'finance', moduleId: 'GP005', terms: ['การเงิน', 'การคลัง', 'เบิกจ่าย', 'เงินยืม', 'รายได้', 'ภาษี', 'ค่าธรรมเนียม', 'บัญชี'] },
    { type: 'human-resources', moduleId: 'GP006', terms: ['บุคคล', 'บุคลากร', 'บรรจุ', 'แต่งตั้ง', 'โอน', 'ย้าย', 'วินัย', 'เงินเดือน'] },
    { type: 'engineering', moduleId: 'GP007', terms: ['ช่าง', 'วิศวกรรม', 'ก่อสร้าง', 'ถนน', 'สะพาน', 'อาคาร', 'boq'] },
    { type: 'public-health', moduleId: 'GP008', terms: ['สาธารณสุข', 'สุขภาพ', 'โรค', 'ผู้ป่วย', 'ขยะ', 'สุขาภิบาล'] },
    { type: 'education', moduleId: 'GP009', terms: ['การศึกษา', 'โรงเรียน', 'ศูนย์เด็ก', 'นักเรียน', 'หลักสูตร'] },
    { type: 'internal-audit', moduleId: 'GP010', terms: ['ตรวจสอบภายใน', 'ควบคุมภายใน', 'audit', 'ความเสี่ยง', 'หลักฐาน'] },
    { type: 'executive', moduleId: 'GP011', terms: ['ผู้บริหาร', 'บริหาร', 'ตัดสินใจ', 'ข้อสั่งการ', 'dashboard', 'one page'] },
    { type: 'public-relations', moduleId: 'GP012', terms: ['ประชาสัมพันธ์', 'ข่าว', 'facebook', 'เว็บไซต์', 'สื่อสาร', 'อินโฟกราฟิก'] }
  ].map(rule => Object.freeze({ ...rule, terms: Object.freeze(rule.terms) })));

  function normalizeModuleId(value) {
    const match = String(value ?? '').trim().toUpperCase().match(/(?:^|[^A-Z0-9])GP\s*0*(1[0-2]|[1-9])(?:[^A-Z0-9]|$)/);
    return match ? `GP${match[1].padStart(3, '0')}` : '';
  }

  function detectModuleId(options = {}) {
    const candidates = [
      options.moduleId,
      options.pathname,
      typeof location === 'object' ? location.pathname : '',
      typeof document === 'object' ? document.documentElement?.dataset?.moduleId : ''
    ];
    return candidates.map(normalizeModuleId).find(Boolean) || '';
  }

  function normalizeContext(input) {
    const create = window.GovPromptCore?.createSharedContext;
    return typeof create === 'function' ? create(input) : (input && typeof input === 'object' ? input : {});
  }

  function detectTransactionType(context) {
    const explicit = String(context.transactionType ?? '').trim();
    if (explicit) return explicit;
    const source = [context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput]
      .concat(Array.isArray(context.specialFlags) ? context.specialFlags : [])
      .join(' ')
      .toLowerCase();
    return TRANSACTION_RULES.find(rule => rule.terms.some(term => source.includes(term)))?.type || 'general';
  }

  function routeTransaction(sharedContext, options = {}) {
    const context = normalizeContext(sharedContext);
    const currentModuleId = detectModuleId(options);
    const transactionType = detectTransactionType(context);
    const source = [transactionType, context.domain, context.facts, context.desiredOutput].join(' ').toLowerCase();
    const matchedRule = TRANSACTION_RULES
      .map(rule => ({
        rule,
        score: (rule.type === transactionType ? 100 : 0) + rule.terms.filter(term => source.includes(term)).length
      }))
      .reduce((best, candidate) => candidate.score > best.score ? candidate : best, { rule: null, score: 0 })
      .rule;
    const moduleId = matchedRule?.moduleId || currentModuleId || 'GP011';
    const assistant = MODULES.find(module => module.moduleId === moduleId);

    return Object.freeze({
      context,
      currentModuleId,
      moduleId,
      transactionType,
      assistant,
      shouldRedirect: Boolean(currentModuleId && currentModuleId !== moduleId),
      preservePrompt: true
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.MODULES = MODULES;
  window.GovPromptCore.TRANSACTION_RULES = TRANSACTION_RULES;
  window.GovPromptCore.detectModuleId = detectModuleId;
  window.GovPromptCore.detectTransactionType = detectTransactionType;
  window.GovPromptCore.routeTransaction = routeTransaction;
})();
