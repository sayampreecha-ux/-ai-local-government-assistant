(() => {
  'use strict';

  // Universal TOR Engine v1
  // Shared review layer for every division/office and procurement type.
  // It drafts and checks evidence; it never approves, signs, procures, or pays.

  const UNIT_PATTERNS = Object.freeze([
    { id: 'general-office', label: 'สำนักปลัด', patterns: [/สำนักปลัด/i, /งานบริหารทั่วไป/] },
    { id: 'finance', label: 'กองคลัง', patterns: [/กองคลัง/, /การเงินและบัญชี/] },
    { id: 'engineering', label: 'กองช่าง', patterns: [/กองช่าง/, /งานก่อสร้าง/, /งานวิศวกรรม/] },
    { id: 'public-health', label: 'กองสาธารณสุข', patterns: [/สาธารณสุข/, /อนามัย/, /ป้องกันโรค/] },
    { id: 'education', label: 'กองการศึกษา', patterns: [/กองการศึกษา/, /โรงเรียน/, /ศูนย์พัฒนาเด็ก/] },
    { id: 'social-welfare', label: 'กองสวัสดิการสังคม', patterns: [/สวัสดิการสังคม/, /พัฒนาชุมชน/] },
    { id: 'strategy', label: 'กองยุทธศาสตร์และงบประมาณ', patterns: [/ยุทธศาสตร์/, /งบประมาณ/] }
  ]);

  const PROCUREMENT_TYPES = Object.freeze([
    { id: 'purchase', label: 'จัดซื้อ', patterns: [/จัดซื้อ/, /วัสดุ/, /ครุภัณฑ์/] },
    { id: 'construction', label: 'งานก่อสร้าง', patterns: [/ก่อสร้าง/, /ปรับปรุงอาคาร/, /ถนน/, /สิ่งก่อสร้าง/] },
    { id: 'service-contract', label: 'จ้างเหมาบริการ', patterns: [/จ้างเหมาบริการ/, /จ้างเหมา(?!ก่อสร้าง)/, /บริการ/] },
    { id: 'consultancy', label: 'จ้างที่ปรึกษา', patterns: [/ที่ปรึกษา/] },
    { id: 'activity', label: 'จ้างจัดกิจกรรม/โครงการ', patterns: [/จัดกิจกรรม/, /จัดโครงการ/, /ฝึกอบรม/] },
    { id: 'maintenance', label: 'จ้างบำรุงรักษา', patterns: [/บำรุงรักษา/, /ซ่อมบำรุง/, /ดูแลระบบ/] }
  ]);

  const REQUIRED_EVIDENCE = Object.freeze([
    { id: 'necessity', label: 'เหตุผลความจำเป็นและประโยชน์ของทางราชการ' },
    { id: 'scope', label: 'ขอบเขตงานและผลผลิตที่ตรวจรับได้' },
    { id: 'budget', label: 'วงเงินและแหล่งงบประมาณจากเอกสารต้นทาง' },
    { id: 'duration', label: 'ระยะเวลาและกำหนดส่งมอบ' },
    { id: 'price', label: 'หลักฐานราคา/ราคากลาง/ราคาอ้างอิงตามกรณี' },
    { id: 'authority', label: 'ผู้มีอำนาจและลำดับการอนุมัติ' },
    { id: 'method', label: 'เหตุผลและฐานอำนาจของวิธีจัดซื้อจัดจ้าง' },
    { id: 'acceptance', label: 'เกณฑ์ตรวจรับและหลักฐานการส่งมอบ' },
    { id: 'contract', label: 'เงื่อนไขสัญญา ค่าปรับ และการเปลี่ยนแปลง' },
    { id: 'privacy', label: 'การคุ้มครองข้อมูลส่วนบุคคล หากมีข้อมูลส่วนบุคคล' }
  ]);

  function textOf(input = {}) {
    return String(input.question ?? input.text ?? input.facts ?? '').trim();
  }

  function matchType(text, definitions) {
    return definitions.find(item => item.patterns.some(pattern => pattern.test(text))) || null;
  }

  function detectTorIntent(input = {}) {
    const text = typeof input === 'string' ? input : textOf(input);
    return /(?:TOR|ขอบเขตของงาน|ขอบเขตงาน|จัดทำทีโออาร์|ตรวจสอบทีโออาร์|จัดซื้อจัดจ้าง|จ้างเหมา|จัดซื้อ|งานก่อสร้าง)/i.test(text);
  }

  function createTorReview(input = {}) {
    const text = typeof input === 'string' ? input : textOf(input);
    const evidence = Array.isArray(input.evidence) ? input.evidence : [];
    const evidenceText = evidence.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(' ').toLowerCase();
    const unit = matchType(text, UNIT_PATTERNS);
    const procurementType = matchType(text, PROCUREMENT_TYPES);
    const checks = REQUIRED_EVIDENCE.map(item => Object.freeze({
      id: item.id,
      label: item.label,
      status: evidenceText.includes(item.label.toLowerCase()) ? 'provisionally-supported' : 'evidence-required'
    }));
    const missing = checks.filter(item => item.status === 'evidence-required');
    const matched = detectTorIntent(text);

    return Object.freeze({
      moduleId: 'GP-TOR-UNIVERSAL',
      version: '1.0.0',
      matched,
      owningUnit: unit ? unit.id : 'unconfirmed',
      owningUnitLabel: unit ? unit.label : 'ยังไม่ระบุหน่วยงาน',
      procurementType: procurementType ? procurementType.id : 'unconfirmed',
      procurementTypeLabel: procurementType ? procurementType.label : 'ยังไม่จำแนกประเภทงาน',
      status: matched ? (missing.length ? 'evidence-incomplete' : 'authority-verification-required') : 'not-applicable',
      decisionLock: matched && (missing.length > 0 || input.authorityVerified !== true),
      checks: Object.freeze(checks),
      missingEvidence: Object.freeze(missing.map(item => item.label)),
      requiredNextAction: matched
        ? 'รวบรวมหลักฐานจากเอกสารต้นทาง ให้ AI ฝั่งผู้ใช้ค้นแหล่งทางการ และตรวจสอบฐานอำนาจ ฉบับ วันมีผล ข้อเท็จจริง และความสอดคล้องก่อนสรุป'
        : 'ส่งต่อให้ Router จำแนกงานตามปกติ',
      guardrails: Object.freeze([
        'ห้ามสรุปอนุมัติแทนผู้มีอำนาจ',
        'ห้ามถือว่าการค้นพบข้อมูลเท่ากับหลักฐานที่ยืนยันแล้ว',
        'ห้ามกำหนดตัวเลขหรือเงื่อนไขกฎหมายแบบตายตัวโดยไม่มีแหล่งอ้างอิง',
        'ต้องแยกข้อเท็จจริง ข้อกฎหมาย การตีความ และข้อเสนอแนะ'
      ])
    });
  }

  const core = window.GovPromptCore = window.GovPromptCore || {};
  core.universalTor = Object.freeze({
    version: '1.0.0',
    unitPatterns: UNIT_PATTERNS,
    procurementTypes: PROCUREMENT_TYPES,
    requiredEvidence: REQUIRED_EVIDENCE,
    detectTorIntent,
    createTorReview
  });
})();
