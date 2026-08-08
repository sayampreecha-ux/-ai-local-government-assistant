(() => {
  'use strict';

  const MODULES = window.GovPromptCore.PROMPT_REGISTRY;
  const V7_MODULE_IDS = Object.freeze(Array.from({ length: 13 }, (_, index) => `GP${String(index + 1).padStart(3, '0')}`));
  const DEFAULT_OPTIONS = Object.freeze({ confidenceThreshold: 0.45, multiModuleThreshold: 0.3, fallbackModule: 'GP001' });
  const definitions = [
    ['GP001', 'records', ['gp001', 'official letter', 'หนังสือราชการ', 'สารบรรณ', 'บันทึกข้อความ', 'คำสั่ง', 'ประกาศ']],
    ['GP002', 'legal', ['gp002', 'law', 'legal', 'กฎหมาย', 'ระเบียบ', 'อำนาจหน้าที่', 'ข้อหารือ', 'หนังสือสั่งการ', 'ซักซ้อม']],
    ['GP003', 'procurement', ['gp003', 'procurement', 'tor', 'จัดซื้อ', 'จัดจ้าง', 'พัสดุ', 'ราคากลาง', 'e-gp', 'ตรวจรับ']],
    ['GP004', 'planning-budget', ['gp004', 'plan', 'project', 'budget', 'planning', 'appropriation', 'แผน', 'โครงการ', 'งบประมาณ', 'โอนงบ', 'เงินสำรอง', 'ตัวชี้วัด', 'kpi']],
    ['GP005', 'finance', ['gp005', 'finance', 'reimbursement', 'travel expense', 'payment', 'การเงิน', 'เบิกจ่าย', 'ค่าเดินทาง', 'ค่าเช่าบ้าน', 'ฎีกา']],
    ['GP006', 'human-resources', ['gp006', 'human resources', 'hr', 'personnel', 'promotion', 'บุคคล', 'แต่งตั้ง', 'เลื่อนระดับ', 'โอนย้าย', 'วินัย', 'เกษียณ', 'สอบแข่งขัน']],
    ['GP007', 'engineering', ['gp007', 'engineering', 'construction', 'road', 'งานช่าง', 'วิศวกรรม', 'ก่อสร้าง', 'ถนน', 'แบบแปลน', 'ผู้ควบคุมงาน']],
    ['GP008', 'public-health', ['gp008', 'public health', 'health', 'hospital', 'สาธารณสุข', 'รพ.สต.', 'รพสต', 'เงินบำรุง', 'บริการสุขภาพ']],
    ['GP009', 'education', ['gp009', 'education', 'school', 'teacher', 'student', 'การศึกษา', 'โรงเรียน', 'ครู', 'นักเรียน', 'ศูนย์พัฒนาเด็กเล็ก']],
    ['GP010', 'internal-audit', ['gp010', 'internal audit', 'audit', 'internal control', 'ตรวจสอบภายใน', 'ควบคุมภายใน', 'ปค.4', 'ปค.5', 'ปค.6', 'ความเสี่ยงองค์กร']],
    ['GP011', 'executive', ['gp011', 'executive', 'policy', 'management', 'ผู้บริหาร', 'นายก', 'ปลัด', 'นโยบาย', 'ข้อสั่งการ', 'สรุปผู้บริหาร']],
    ['GP012', 'public-relations', ['gp012', 'public relations', 'press release', 'pr', 'ประชาสัมพันธ์', 'ข่าว', 'facebook', 'infographic', 'โพสต์']],
    ['GP013', 'council', ['gp013', 'council', 'quorum', 'motion', 'resolution', 'local council', 'สภาท้องถิ่น', 'ญัตติ', 'องค์ประชุม', 'มติสภา', 'ข้อบัญญัติ', 'สมัยประชุม']]
  ];

  const TRANSACTION_RULES = Object.freeze(definitions.map(([moduleId, type, terms]) => Object.freeze({ moduleId, type, weight: 1, terms: Object.freeze(terms) })));

  function tokenize(value) {
    return String(value ?? '').normalize('NFKC').toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  }

  function normalizeModuleId(value) {
    const match = String(value ?? '').trim().toUpperCase().match(/(?:^|[^A-Z0-9])GP\s*0*(1[0-3]|[1-9])(?:[^A-Z0-9]|$)/);
    return match ? `GP${match[1].padStart(3, '0')}` : '';
  }

  function detectModuleId(options = {}) {
    const candidates = [options.moduleId, options.pathname, typeof location === 'object' ? location.pathname : '', typeof document === 'object' ? document.documentElement?.dataset?.moduleId : ''];
    return candidates.map(normalizeModuleId).find(Boolean) || '';
  }

  function scoreRequest(request) {
    const source = String(request ?? '').normalize('NFKC').toLocaleLowerCase();
    const requestTokens = new Set(tokenize(source));
    return TRANSACTION_RULES.map(rule => {
      const matchedIntents = rule.terms.filter(intent => {
        const normalized = intent.normalize('NFKC').toLocaleLowerCase();
        const intentTokens = tokenize(normalized);
        return source.includes(normalized) || (intentTokens.length > 0 && intentTokens.every(token => requestTokens.has(token)));
      });
      const confidence = Math.min(1, matchedIntents.reduce((total, intent) => total + Math.max(1, tokenize(intent).length), 0) / Math.max(2, requestTokens.size));
      return Object.freeze({ moduleId: rule.moduleId, type: rule.type, confidence, matchedIntents: Object.freeze([...matchedIntents]) });
    }).sort((left, right) => right.confidence - left.confidence || left.moduleId.localeCompare(right.moduleId));
  }

  function routeRequest(request, options = {}) {
    if (typeof request !== 'string' || !request.trim()) throw new TypeError('request must be a non-empty string');
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const ranking = scoreRequest(request);
    const activeModule = V7_MODULE_IDS.includes(options.activeModule) ? options.activeModule : '';
    const primaryModule = ranking[0].confidence >= settings.confidenceThreshold ? ranking[0].moduleId : activeModule || settings.fallbackModule;
    const modules = options.multiModule === false ? [primaryModule] : [...new Set([primaryModule, ...ranking.filter(item => item.confidence >= settings.multiModuleThreshold).map(item => item.moduleId)])];
    return Object.freeze({ primaryModule, modules: Object.freeze(modules), confidence: ranking.find(item => item.moduleId === primaryModule)?.confidence ?? 0, fallback: ranking[0].confidence < settings.confidenceThreshold, ranking: Object.freeze(ranking) });
  }

  function detectTransactionType(context = {}) {
    const explicit = String(context.transactionType ?? '').trim();
    const source = [explicit, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput].concat(Array.isArray(context.specialFlags) ? context.specialFlags : []).join(' ');
    const route = source.trim() ? routeRequest(source, { activeModule: '', fallbackModule: 'GP001', multiModule: false }) : null;
    return TRANSACTION_RULES.find(rule => rule.moduleId === route?.primaryModule)?.type || explicit || 'general';
  }

  function routeTransaction(sharedContext, options = {}) {
    const context = window.GovPromptCore.createSharedContext(sharedContext);
    const currentModuleId = detectModuleId(options);
    const source = [context.transactionType, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput].concat(context.specialFlags ?? []).join(' ').trim();
    const route = source ? routeRequest(source, { activeModule: V7_MODULE_IDS.includes(currentModuleId) ? currentModuleId : '', fallbackModule: V7_MODULE_IDS.includes(currentModuleId) ? currentModuleId : 'GP001' }) : { primaryModule: currentModuleId || 'GP001', modules: [currentModuleId || 'GP001'], confidence: 0, fallback: true, ranking: [] };
    const moduleId = route.primaryModule;
    return Object.freeze({ context, currentModuleId, moduleId, transactionType: TRANSACTION_RULES.find(rule => rule.moduleId === moduleId)?.type || 'general', assistant: MODULES.find(module => module.moduleId === moduleId), shouldRedirect: Boolean(currentModuleId && currentModuleId !== moduleId), preservePrompt: true, confidence: route.confidence, modules: route.modules, fallback: route.fallback, ranking: route.ranking });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, { MODULES, V7_MODULE_IDS, TRANSACTION_RULES, ROUTER_DEFAULTS: DEFAULT_OPTIONS, detectModuleId, detectTransactionType, scoreRequest, routeRequest, routeTransaction });
})();
