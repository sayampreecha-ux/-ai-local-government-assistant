(() => {
  'use strict';

  const MODULES = window.GovPromptCore.PROMPT_REGISTRY;
  const V7_MODULE_IDS = Object.freeze(Array.from({ length: 13 }, (_, index) => `GP${String(index + 1).padStart(3, '0')}`));
  const DEFAULT_OPTIONS = Object.freeze({ confidenceThreshold: 0.34, multiModuleThreshold: 0.22, ambiguityGap: 0.12, fallbackModule: 'GP002' });

  const definitions = Object.freeze([
    ['GP001', 'records'], ['GP002', 'legal'], ['GP003', 'procurement'], ['GP004', 'planning-budget'],
    ['GP005', 'finance'], ['GP006', 'human-resources'], ['GP007', 'engineering'], ['GP008', 'public-health'],
    ['GP009', 'education'], ['GP010', 'internal-audit'], ['GP011', 'executive'], ['GP012', 'public-relations'], ['GP013', 'council']
  ]);

  // Action intent answers “what does the user want to do?” before subject-domain scoring.
  const ACTION_INTENT_RULES = Object.freeze([
    Object.freeze({
      moduleId: 'GP001',
      weight: 7.5,
      patterns: Object.freeze([
        /(?:ช่วย)?(?:ร่าง|เขียน|จัดทำ|ทำ).{0,20}(?:หนังสือราชการ|หนังสือภายนอก|บันทึกข้อความ|คำสั่ง|ประกาศ|หนังสือตอบ|หนังสือแจ้ง)/,
        /(?:หนังสือราชการ|หนังสือภายนอก|บันทึกข้อความ).{0,20}(?:ร่าง|เขียน|จัดทำ|ทำ)/
      ])
    }),
    Object.freeze({
      moduleId: 'GP010',
      weight: 7.2,
      patterns: Object.freeze([
        /(?:audit|ตรวจสอบภายใน|ตรวจติดตาม|ประเมินการควบคุมภายใน)/i,
        /(?:ตรวจ|สอบทาน).{0,15}(?:ระบบควบคุม|ความเสี่ยงองค์กร)/
      ])
    }),
    Object.freeze({
      moduleId: 'GP003',
      weight: 7.0,
      patterns: Object.freeze([
        /^(?:ช่วย)?\s*(?:ซื้อ|จัดซื้อ|จัดหา|เช่า|จ้าง|จัดจ้าง)\s*\S+/,
        /(?:ต้องการ|จะ|ขอ).{0,8}(?:ซื้อ|จัดซื้อ|จัดหา|เช่า|จ้าง|จัดจ้าง)\s*\S+/,
        /(?:ซื้อ|จัดซื้อ|จัดหา|เช่า|จ้าง|จัดจ้าง).{0,20}(?:คอม|คอมพิวเตอร์|โน้ตบุ๊ก|เครื่องพิมพ์|โต๊ะ|เก้าอี้|รถ|ครุภัณฑ์|วัสดุ|อุปกรณ์)/
      ])
    }),
    Object.freeze({
      moduleId: 'GP012',
      weight: 6.8,
      patterns: Object.freeze([
        /(?:ทำ|เขียน|ร่าง|สร้าง).{0,12}(?:โพสต์|ข่าวประชาสัมพันธ์|แคปชัน|อินโฟกราฟิก)/
      ])
    })
  ]);

  const INTENT_RULES = Object.freeze([
    ['GP001', [
      [4.5, /(?:ร่าง|ทำ|เขียน|จัดทำ).{0,12}(?:หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|คำสั่ง|ประกาศ)/],
      [4.0, /งานสารบรรณ|เลขหนังสือ|ลงรับ|ทะเบียนหนังสือ/],
      [3.0, /หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก/]
    ]],
    ['GP002', [
      [4.5, /วิเคราะห์ข้อกฎหมาย|ข้อหารือ|ฐานอำนาจ|อำนาจหน้าที่ตามกฎหมาย/],
      [4.0, /ผิดกฎหมายไหม|ถูกกฎหมายไหม|มีอำนาจไหม|ทำได้ตามกฎหมายไหม/],
      [3.2, /ข้อกฎหมาย|กฎหมายที่เกี่ยวข้อง|ระเบียบที่เกี่ยวข้อง|หนังสือสั่งการ/],
      [2.2, /กฎหมาย|ระเบียบ|ประกาศกระทรวง|กฎกระทรวง/]
    ]],
    ['GP003', [
      [5.0, /\btor\b/i], [4.8, /วิธีเฉพาะเจาะจง|วิธีคัดเลือก|e-?bidding|ประกวดราคา/i],
      [4.5, /ล็อกสเปก|ราคากลาง|ตรวจรับ|จัดซื้อ|จัดจ้าง|พัสดุ/],
      [4.2, /(?:^|\s)(?:ซื้อ|จัดหา|เช่า|จ้าง)(?:\s|\S)/],
      [3.6, /ซื้อ(?:ของ|ครุภัณฑ์|วัสดุ)|จ้าง(?:งาน|เหมาบริการ|ที่ปรึกษา)|ผู้รับจ้าง|สัญญาจ้าง/]
    ]],
    ['GP004', [
      [4.8, /ทำโครงการ|เขียนโครงการ|จัดทำโครงการ/], [4.5, /งบประมาณ|โอนงบ|เงินสำรอง|ข้อบัญญัติงบประมาณ/],
      [4.0, /แผนพัฒนา|แผนงาน|ตัวชี้วัด|\bkpi\b/i], [3.0, /โครงการ|แผน|งบ/]
    ]],
    ['GP005', [
      [5.0, /รถเสีย.{0,18}(?:ไปราชการ|ราชการ)|(?:ไปราชการ|ราชการ).{0,18}รถเสีย/],
      [4.8, /เดินทางไปราชการ|ค่าเดินทาง|ค่าใช้จ่ายเดินทาง/],
      [4.5, /เบิกได้ไหม|เบิกได้หรือไม่|จ่ายได้ไหม|จ่ายได้หรือไม่|เบิกจ่าย|ฎีกา/],
      [4.2, /ค่าเช่าบ้าน|ค่าที่พัก|ค่าอาหาร|ค่าพาหนะ|เงินยืม/], [3.0, /การเงิน|การคลัง|เบิก|จ่ายเงิน/]
    ]],
    ['GP006', [
      [5.4, /ขาดราชการ|ขาดงาน|ไม่มาปฏิบัติราชการ|ไม่มาทำงาน|ละทิ้งหน้าที่ราชการ|ละทิ้งหน้าที่|ทอดทิ้งหน้าที่/],
      [5.2, /ขาดราชการ.{0,12}(?:15|สิบห้า).{0,8}วัน|(?:15|สิบห้า).{0,8}วัน.{0,12}ขาดราชการ/],
      [5.0, /ลาเกิน|ขาดเกิน|มาสาย|ไม่ลงเวลาปฏิบัติราชการ|ลงเวลาปฏิบัติราชการ/],
      [4.8, /เลื่อนเงินเดือน|เลื่อนขั้น|เลื่อนระดับ|แต่งตั้ง|โอนย้าย/],
      [4.6, /สอบแข่งขัน|บรรจุ|บัญชีผู้สอบ|วินัย|เกษียณ|ผิดวินัย|โทษทางวินัย|สอบสวนวินัย/],
      [4.0, /อัตรากำลัง|ตำแหน่ง|งานบุคคล|ข้าราชการ|พนักงานส่วนท้องถิ่น|พนักงานจ้าง|ลูกจ้าง/], [3.0, /เงินเดือน|บุคลากร|การลา/]
    ]],
    ['GP007', [
      [4.8, /ถนนพัง|ถนนชำรุด|งานก่อสร้าง|งานช่าง|แบบแปลน|ผู้ควบคุมงาน/],
      [4.5, /ความหนาแน่นดิน|คอนกรีต|แอสฟัลต์|สะพาน|ระบายน้ำ|โครงสร้าง/], [3.0, /ก่อสร้าง|ถนน|วิศวกรรม/]
    ]],
    ['GP008', [
      [5.0, /เงินบำรุง/], [4.8, /รพ\.?สต\.?|โรงพยาบาลส่งเสริมสุขภาพตำบล/],
      [4.5, /สาธารณสุข|ส่งเสริมสุขภาพ|ผู้ป่วย|บริการสุขภาพ|digital health/i], [3.0, /สุขภาพ|อนามัย/]
    ]],
    ['GP009', [
      [4.8, /ศูนย์พัฒนาเด็กเล็ก|โรงเรียน|นักเรียน|ครู|การศึกษา/], [4.2, /อาหารกลางวัน|ทุนการศึกษา|เด็กปฐมวัย/], [3.0, /การเรียน|การสอน/]
    ]],
    ['GP010', [
      [5.4, /\baudit\b/i], [4.8, /ตรวจสอบภายใน|ควบคุมภายใน|ปค\.?\s*[456]/], [4.5, /บริหารความเสี่ยง|ความเสี่ยงองค์กร|ตรวจติดตาม/], [3.0, /ตรวจสอบ/i]
    ]],
    ['GP011', [
      [4.6, /สรุปผู้บริหาร|ข้อสั่งการ|นโยบายผู้บริหาร/], [4.0, /นายก|ปลัด|ผู้บริหาร|ประชุมผู้บริหาร/], [3.0, /นโยบาย|บริหารองค์กร/]
    ]],
    ['GP012', [
      [4.8, /อินโฟกราฟิก|ข่าวประชาสัมพันธ์|โพสต์เฟซบุ๊ก|โพสต์facebook|ประชาสัมพันธ์/], [4.2, /ทำโพสต์|ทำข่าว|แคปชัน|สื่อประชาสัมพันธ์/], [3.0, /โพสต์|facebook|ข่าว/i]
    ]],
    ['GP013', [
      [5.0, /ข้อบัญญัติ(?!งบประมาณ)/], [4.8, /สภาท้องถิ่น|สมัยประชุม|องค์ประชุม|ญัตติ|มติสภา/],
      [4.3, /ประชุมสภา|ประธานสภา|สมาชิกสภา/], [3.0, /สภา/]
    ]]
  ].map(([moduleId, rules]) => Object.freeze({ moduleId, rules: Object.freeze(rules.map(([weight, pattern]) => Object.freeze({ weight, pattern }))) })));

  const CROSS_INTENT_BONUSES = Object.freeze([
    Object.freeze({ moduleId: 'GP003', weight: 2.2, all: [/\btor\b/i, /ก่อสร้าง|ถนน|งานช่าง/] }),
    Object.freeze({ moduleId: 'GP005', weight: 2.4, all: [/เดินทาง|ไปราชการ/, /เบิก|ค่าใช้จ่าย|พาหนะ|รถเสีย/] }),
    Object.freeze({ moduleId: 'GP004', weight: 1.8, all: [/โครงการ/, /งบประมาณ|แผน|ตัวชี้วัด/] }),
    Object.freeze({ moduleId: 'GP006', weight: 2.6, all: [/ขาดราชการ|ขาดงาน|ละทิ้งหน้าที่|ไม่มาปฏิบัติราชการ/, /วัน|วินัย|ลา|งาน/] }),
    Object.freeze({ moduleId: 'GP006', weight: 1.8, all: [/บุคคล|ข้าราชการ|พนักงาน/, /เลื่อน|แต่งตั้ง|โอน|สอบ|วินัย|ลา/] }),
    Object.freeze({ moduleId: 'GP013', weight: 1.8, all: [/สภา/, /ญัตติ|มติ|สมัยประชุม|องค์ประชุม|ข้อบัญญัติ/] })
  ]);

  const TRANSACTION_RULES = Object.freeze(definitions.map(([moduleId, type]) => Object.freeze({ moduleId, type })));

  function normalize(value) { return String(value ?? '').normalize('NFKC').toLocaleLowerCase().trim(); }

  function normalizeModuleId(value) {
    const match = String(value ?? '').trim().toUpperCase().match(/(?:^|[^A-Z0-9])GP\s*0*(1[0-3]|[1-9])(?:[^A-Z0-9]|$)/);
    return match ? `GP${match[1].padStart(3, '0')}` : '';
  }

  function detectModuleId(options = {}) {
    const candidates = [options.moduleId, options.pathname, typeof location === 'object' ? location.pathname : '', typeof document === 'object' ? document.documentElement?.dataset?.moduleId : ''];
    return candidates.map(normalizeModuleId).find(Boolean) || '';
  }

  function detectActionIntent(request) {
    const source = normalize(request);
    for (const rule of ACTION_INTENT_RULES) {
      const matched = rule.patterns.filter(pattern => pattern.test(source));
      if (matched.length) return Object.freeze({ moduleId: rule.moduleId, weight: rule.weight, matched: Object.freeze(matched.map(pattern => pattern.source)) });
    }
    return null;
  }

  function scoreRequest(request) {
    const source = normalize(request);
    return INTENT_RULES.map(group => {
      const matches = [];
      let rawScore = 0;
      group.rules.forEach(rule => {
        if (rule.pattern.test(source)) {
          rawScore += rule.weight;
          matches.push(rule.pattern.source);
        }
      });
      CROSS_INTENT_BONUSES.filter(item => item.moduleId === group.moduleId).forEach(item => {
        if (item.all.every(pattern => pattern.test(source))) {
          rawScore += item.weight;
          matches.push('context-bonus');
        }
      });
      const confidence = rawScore <= 0 ? 0 : Math.min(0.99, 0.28 + rawScore / 10);
      return Object.freeze({ moduleId: group.moduleId, type: TRANSACTION_RULES.find(item => item.moduleId === group.moduleId)?.type || 'general', rawScore, confidence, matchedIntents: Object.freeze(matches) });
    }).sort((a, b) => b.rawScore - a.rawScore || b.confidence - a.confidence || a.moduleId.localeCompare(b.moduleId));
  }

  function routeRequest(request, options = {}) {
    if (typeof request !== 'string' || !request.trim()) throw new TypeError('request must be a non-empty string');
    const settings = { ...DEFAULT_OPTIONS, ...options };
    const ranking = scoreRequest(request);
    const action = detectActionIntent(request);
    const activeModule = V7_MODULE_IDS.includes(options.activeModule) ? options.activeModule : '';
    const top = ranking[0];
    const second = ranking[1];
    const hasEvidence = top.rawScore > 0;
    const ambiguous = hasEvidence && second.rawScore > 0 && (top.confidence - second.confidence) < settings.ambiguityGap;
    const primaryModule = action?.moduleId || (hasEvidence ? top.moduleId : (activeModule || settings.fallbackModule));

    const domainModules = ranking.filter(item => item.rawScore > 0 && item.moduleId !== primaryModule).slice(0, 2).map(item => item.moduleId);
    const modules = options.multiModule === false
      ? [primaryModule]
      : [...new Set([primaryModule, ...domainModules])];

    const actionConfidence = action ? Math.min(0.99, 0.55 + action.weight / 20) : 0;
    return Object.freeze({
      primaryModule,
      modules: Object.freeze(modules),
      confidence: action ? actionConfidence : (hasEvidence ? top.confidence : 0),
      fallback: !action && !hasEvidence,
      ambiguous: !action && ambiguous,
      ranking: Object.freeze(ranking),
      actionIntent: action,
      reason: action ? 'action-intent-primary' : (hasEvidence ? (ambiguous ? 'multi-intent-close-score' : 'weighted-intent') : 'no-domain-evidence')
    });
  }

  function detectTransactionType(context = {}) {
    const explicit = String(context.transactionType ?? '').trim();
    const source = [explicit, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput].concat(Array.isArray(context.specialFlags) ? context.specialFlags : []).join(' ');
    const route = source.trim() ? routeRequest(source, { activeModule: '', fallbackModule: 'GP002', multiModule: false }) : null;
    return TRANSACTION_RULES.find(rule => rule.moduleId === route?.primaryModule)?.type || explicit || 'general';
  }

  function routeTransaction(sharedContext, options = {}) {
    const context = window.GovPromptCore.createSharedContext(sharedContext);
    const currentModuleId = detectModuleId(options);
    const source = [context.transactionType, context.domain, context.currentStage, context.facts, context.documents, context.desiredOutput].concat(context.specialFlags ?? []).join(' ').trim();
    const activeModule = V7_MODULE_IDS.includes(currentModuleId) && currentModuleId !== 'GP001' ? currentModuleId : '';
    const route = source ? routeRequest(source, { activeModule, fallbackModule: 'GP002' }) : routeRequest('ทั่วไป', { activeModule, fallbackModule: 'GP002' });
    const moduleId = route.primaryModule;
    return Object.freeze({
      context, currentModuleId, moduleId,
      transactionType: TRANSACTION_RULES.find(rule => rule.moduleId === moduleId)?.type || 'general',
      assistant: MODULES.find(module => module.moduleId === moduleId),
      shouldRedirect: Boolean(currentModuleId && currentModuleId !== moduleId), preservePrompt: true,
      confidence: route.confidence, modules: route.modules, fallback: route.fallback, ambiguous: route.ambiguous,
      reason: route.reason, actionIntent: route.actionIntent, ranking: route.ranking
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    MODULES, V7_MODULE_IDS, TRANSACTION_RULES, ACTION_INTENT_RULES, INTENT_RULES, ROUTER_DEFAULTS: DEFAULT_OPTIONS,
    detectModuleId, detectTransactionType, detectActionIntent, scoreRequest, routeRequest, routeTransaction
  });
})();
