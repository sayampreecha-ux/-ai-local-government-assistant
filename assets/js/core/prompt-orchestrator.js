(() => {
  'use strict';

  const HIGH_RISK_TERMS = Object.freeze([
    'กฎหมาย', 'ระเบียบ', 'หนังสือเวียน', 'หนังสือสั่งการ', 'ข้อหารือ', 'ซักซ้อม',
    'พัสดุ', 'จัดซื้อ', 'จัดจ้าง', 'e-bidding', 'tor', 'ราคากลาง', 'เบิก', 'งบประมาณ', 'วินัย',
    'คำพิพากษา', 'ศาล', 'ป.ป.ช.', 'สตง.', 'ข้อมูลส่วนบุคคล', 'pdpa',
    'เงินเดือน', 'โบนัส', 'ประโยชน์ตอบแทน', 'บรรจุ', 'แต่งตั้ง', 'เลื่อน', 'สิทธิ', 'เลขบัตร',
    'หลักเกณฑ์', 'ประกาศ', 'อำนาจ', 'อนุมัติ', 'สั่งจ่าย', 'จ่ายเงิน', 'เงินบำรุง', 'เงินสะสม', 'ข้อมูลสุขภาพ'
  ]);

  const MEDIUM_RISK_TERMS = Object.freeze([
    'ขั้นตอน', 'แนวทาง', 'หนังสือราชการ', 'บันทึกข้อความ', 'โครงการ', 'สภา', 'ประชุม', 'วางแผน', 'แผนงาน'
  ]);

  const DECISION_TERMS = /(?:ได้ไหม|ได้หรือไม่|มีสิทธิ|ไม่มีสิทธิ|เบิกได้|เบิกไม่ได้|ทำได้|ทำไม่ได้|มีอำนาจ|อนุมัติได้|จ่ายได้|ชอบด้วย|ถูกกฎหมาย|ผิดกฎหมาย|ควร.{0,40}ไหม|ต้อง.{0,40}ไหม|ต้องทำหรือไม่|(?:ใช้|มีผล|เกี่ยวข้อง).{0,40}(?:ไหม|หรือไม่))/i;
  const MULTI_CONDITION_TERMS = /(?:สิทธิ|คุณสมบัติ|เงื่อนไข|โบนัส|ประโยชน์ตอบแทน|เบิก|พัสดุ|จัดซื้อ|จัดจ้าง|tor|งบประมาณ|เงินบำรุง|เงินสะสม|บรรจุ|แต่งตั้ง|เลื่อนเงินเดือน|เงินเดือน|วินัย|อำนาจ|อนุมัติ|สั่งจ่าย)/i;
  const LEGAL_VERSION_TERMS = /(?:กฎหมาย|ระเบียบ|ประกาศ|หลักเกณฑ์|หนังสือเวียน|หนังสือสั่งการ|ข้อหารือ|ซักซ้อม|คำพิพากษา|มาตรา|ข้อ\s*\d|ฉบับ|พ\.ศ\.|ปัจจุบัน|ล่าสุด|ยังใช้|ยังมีผล)/i;
  const INTERPRETATION_DECISION_TERMS = /(?:เบิก.{0,80}(?:ได้ไหม|ได้หรือไม่)|มีสิทธิ(?:ไหม|หรือไม่)?|จ่าย.{0,80}(?:ได้ไหม|ได้หรือไม่)|ทำ.{0,80}(?:ได้ไหม|ได้หรือไม่)|ผิดหรือไม่|ใครมีอำนาจ|แต่งตั้ง.{0,40}(?:ได้ไหม|ได้หรือไม่)|ย้าย|โอน|รับโอน|ต้องคืนเงิน(?:ไหม|หรือไม่)|เข้าข่าย|ถือเป็น|วิธีนี้ถูกต้องหรือไม่)/i;
  const INTERPRETATION_FACTORS = /(?:ถือว่า|เข้าลักษณะ|จำเป็น|เพื่อประโยชน์ราชการ|รับการคัดเลือก|โดยอนุโลม|เหตุจำเป็น|ตามความเหมาะสม|ตีความ|ข้อเท็จจริง|หลายกฎหมาย|หลายขั้นตอน|ความเห็น.{0,30}ขัด|แนวปฏิบัติ.{0,30}ขัด|เสียสิทธิ|ความรับผิด|อำนาจหน้าที่|จ่ายเงิน|เบิก|สิทธิ|แต่งตั้ง|โอน|ย้าย)/i;
  const EXPLICIT_PRECEDENT_TERMS = /(?:หนังสือหารือ|ตอบข้อหารือ|แนววินิจฉัย|แนวปฏิบัติ|กรณีเทียบเคียง|กรณีหารือ|ซักซ้อมความเข้าใจ|หนังสือสั่งการ|คำพิพากษา|official precedent|official authority)/i;
  const INTERPRETATION_DISPUTE_TERMS = /(?:ไม่ตรง(?:กับ)?(?:ถ้อยคำ|ระเบียบ|กฎหมาย)|ข้อโต้แย้ง|ทักท้วง|ไม่ให้เบิก|ความเห็น.{0,50}(?:ขัด|ต่าง)|การเงิน|คลัง|พัสดุ|นิติกร|ผู้ตรวจสอบ).{0,80}(?:แย้ง|ทักท้วง|ไม่เห็นด้วย|ไม่ให้|ขัด)/i;
  const MULTI_AUTHORITY_TERMS = /(?:หลายเงื่อนไข|หลายบท|หลายกฎหมาย|กฎหมาย.{0,40}(?:ร่วมกัน|ประกอบ)|ระเบียบ.{0,40}(?:ร่วมกัน|ประกอบ))/i;
  const INTERPRETATION_ANALYSIS_TERMS = /(?:วิเคราะห์|วินิจฉัย|ตีความ|พิจารณา|ตรวจสอบ).{0,80}(?:กฎหมาย|กฎ|ระเบียบ|สิทธิ|อำนาจ|เบิก|จ่าย|พัสดุ|บุคคล|งบประมาณ)/i;
  const OFFICIAL_PRECEDENT_GATE_VERSION = '3.1';
  const OFFICIAL_AUTHORITY_RETRIEVAL_GATE_VERSION = '1.0';
  const REQUIRED_PRECEDENT_EVIDENCE = Object.freeze(['currentRule', 'officialPrecedent', 'caseMatch', 'legalVersion', 'newerOrConflictingAuthority', 'contraryEvidenceCheck']);
  const REQUIRED_CURRENT_RULE_CHECKS = Object.freeze([
    'law', 'rule', 'regulation', 'announcement', 'primaryDirective', 'amendments',
    'repealOrReplacement', 'transitionalProvisions', 'effectiveDate', 'dateContextMatched'
  ]);
  const REQUIRED_PRECEDENT_VERIFICATION = Object.freeze([
    'issuingAuthority', 'documentNumber', 'documentDate', 'title', 'consultedFacts',
    'adjudicatedIssue', 'citedRules', 'reasoning', 'conclusion', 'officialSource'
  ]);
  const ADAPTIVE_SEARCH_LEVELS = Object.freeze([
    'LEVEL_1_DIRECT_FACT_SEARCH',
    'LEVEL_2_LEGAL_OFFICIAL_LANGUAGE_SEARCH',
    'LEVEL_3_PRECEDENT_INDEX_RECOVERY',
    'LEVEL_4_IDENTIFIER_CITATION_CHAINING'
  ]);
  const PRECEDENT_STATUSES = Object.freeze(['NOT_SEARCHED', 'SEARCH_INCOMPLETE', 'FOUND_UNVERIFIED', 'VERIFIED', 'SEARCHED_NOT_FOUND']);
  const CASE_MATCH_LEVELS = Object.freeze(['HIGH MATCH', 'MEDIUM MATCH', 'LOW MATCH']);
  const AUTHORITY_STATUSES = Object.freeze(['NOT_CHECKED', 'NOT_FULLY_CHECKED', 'CHECKED_NONE_FOUND', 'FOUND']);
  const CONTRARY_EVIDENCE_STATUSES = Object.freeze(['NOT_CHECKED', 'CHECKED_NONE_FOUND', 'FOUND_RESOLVED', 'FOUND_UNRESOLVED']);
  const RULE_CONFIDENCE_STATUSES = Object.freeze(['NOT_ASSESSED', 'SUFFICIENT', 'INSUFFICIENT']);

  const GENERAL_ASSISTANT = Object.freeze({ moduleId: 'GENERAL', title: 'ผู้ช่วยงานราชการไทยแบบครอบคลุม' });

  const ACTIONS = Object.freeze([
    ['draft', /(?:ร่าง|เขียน|จัดทำ|ทำ)\s*(?:หนังสือ|บันทึก|โครงการ|tor|คำกล่าว|ข่าว|โพสต์|แผน|รายงาน|คำสั่ง|ประกาศ|mou|วิสัยทัศน์)/i],
    ['create', /(?:ทำ|สร้าง|ออกแบบ|จัดทำ)\s*(?:ปก|โปสเตอร์|อินโฟ|อินโฟกราฟิก|ภาพ|สื่อ|วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์|ตาราง|checklist|เช็กลิสต์|แบบฟอร์ม)/i],
    ['verify', /(?:ตรวจ|เช็ก|เช็ค|ตรวจสอบ|ทบทวน|ประเมินความเสี่ยง)/i],
    ['summarize', /(?:สรุป|ย่อ|executive summary)/i],
    ['plan', /(?:วางแผน|แผนงาน|ขั้นตอน|workflow|roadmap|แนวทางดำเนินการ|จัดการแข่งขัน|จัดงาน|จัดกิจกรรม|ดำเนินโครงการ)/i],
    ['calculate', /(?:คำนวณ|รวมยอด|หายอด|คิดเป็น|ร้อยละ|เปอร์เซ็นต์)/i],
    ['analyze', /(?:วิเคราะห์|พิจารณา|หารือ|ตีความ|มีอำนาจ|ได้ไหม|ได้หรือไม่|มีสิทธิ|ชอบด้วย|ผิดกฎหมาย|ถูกกฎหมาย)/i]
  ]);

  const DELIVERABLES = Object.freeze([
    ['official-document', /(?:หนังสือราชการ|บันทึกข้อความ|หนังสือภายนอก|หนังสือภายใน|คำสั่ง|ประกาศ|mou|(?:ร่าง|ทำ|เขียน|จัดทำ)\s*(?:หนังสือ|บันทึก))/i],
    ['project', /(?:โครงการ|หลักการและเหตุผล|วัตถุประสงค์|ตัวชี้วัด)/i],
    ['procurement', /(?:tor|ขอบเขตของงาน|จัดซื้อ|จัดจ้าง|ราคากลาง|สัญญา)/i],
    ['finance', /(?:เบิก|เบิกจ่าย|ฎีกา|ค่าใช้จ่าย|เงินสะสม|เงินสำรองจ่าย|งบประมาณ|โบนัส|ประโยชน์ตอบแทน)/i],
    ['legal-analysis', /(?:กฎหมาย|ระเบียบ|ข้อหารือ|หนังสือเวียน|หนังสือสั่งการ|อำนาจ|คำพิพากษา|มีสิทธิ)/i],
    ['public-content', /(?:โปสเตอร์|โพสต์|ประชาสัมพันธ์|ข่าวประชาสัมพันธ์|อินโฟ|อินโฟกราฟิก|การ์ด|แคปชัน|ปก|วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์)/i],
    ['speech', /(?:คำกล่าว|กล่าวเปิด|กล่าวปิด|สุนทรพจน์|โอวาท)/i],
    ['table', /(?:ตาราง|csv|json|รายการ|เปรียบเทียบ)/i],
    ['general-answer', /.+/]
  ]);

  const DISCIPLINES = Object.freeze([
    ['records', /(?:หนังสือราชการ|บันทึกข้อความ|สารบรรณ|รับส่งหนังสือ|(?:ร่าง|ทำ|เขียน|จัดทำ)\s*(?:หนังสือ|บันทึก))/i],
    ['legal', /(?:กฎหมาย|ระเบียบ|อำนาจ|ข้อหารือ|คำพิพากษา|หนังสือเวียน|หนังสือสั่งการ|มีสิทธิ)/i],
    ['procurement', /(?:พัสดุ|จัดซื้อ|จัดจ้าง|tor|ราคากลาง|สัญญา|ผู้รับจ้าง)/i],
    ['planning-budget', /(?:โครงการ|แผน|งบประมาณ|เงินสะสม|เงินสำรองจ่าย)/i],
    ['finance', /(?:เบิก|เบิกจ่าย|ฎีกา|ค่าเดินทาง|ค่าใช้จ่าย|ใบเสร็จ|โบนัส|ประโยชน์ตอบแทน)/i],
    ['human-resources', /(?:บุคคล|บุคลากร|ข้าราชการ|พนักงาน|ตำแหน่ง|วินัย|ลาป่วย|สอบ|อัตรากำลัง|กำลังคน|บรรจุ|แต่งตั้ง|เลื่อนเงินเดือน|เงินเดือน|โบนัส)/i],
    ['engineering', /(?:ถนน|สะพาน|ก่อสร้าง|ช่าง|แบบ|ประมาณราคา|หน้างาน)/i],
    ['public-health', /(?:สาธารณสุข|รพ\.สต|สุขภาพ|อสม|ยา|เวชภัณฑ์|โรค)/i],
    ['education', /(?:การศึกษา|โรงเรียน|เด็ก|เยาวชน|นักเรียน|กีฬา|วิทยาศาสตร์|สามเณร|บรรพชา|คุณธรรม)/i],
    ['audit', /(?:ตรวจสอบภายใน|สตง|ป\.ป\.ช|ความเสี่ยง|ควบคุมภายใน)/i],
    ['executive', /(?:ผู้บริหาร|สรุปผู้บริหาร|executive summary|briefing|คำกล่าว|วิสัยทัศน์)/i],
    ['public-relations', /(?:ประชาสัมพันธ์|โปสเตอร์|โพสต์|ข่าว|อินโฟ|การ์ด|ปก|แคปชัน|วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์)/i],
    ['council', /(?:สภาท้องถิ่น|สภา อบจ|สภาเทศบาล|ประชุมสภา|ญัตติ|ข้อบัญญัติ)/i]
  ]);

  const FRESHNESS = /(?:ล่าสุด|ปัจจุบัน|ยังใช้|ยังมีผล|ฉบับใหม่|อัตรา|สิทธิ|ระเบียบ|กฎหมาย|หนังสือเวียน|หนังสือสั่งการ|ข้อหารือ|tor|ขอบเขตของงาน|ราคากลาง|จัดซื้อ|จัดจ้าง|เบิก|งบประมาณ|คำพิพากษา|โบนัส|เงินเดือน|บรรจุ|แต่งตั้ง)/i;
  const EXPLICIT_GENERATION = /(?:ช่วย)?(?:ทำ|ร่าง|เขียน|จัดทำ|สร้าง|ออกแบบ|สรุป|ตรวจ|วิเคราะห์|วางแผน|จัดการแข่งขัน|จัดงาน|จัดกิจกรรม)/i;

  function normalizeText(value) {
    return String(value ?? '').normalize('NFC').trim();
  }

  function normalizeForReasoning(value) {
    return normalizeText(value).toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function firstMatch(source, entries, fallback) {
    for (const [id, pattern] of entries) if (pattern.test(source)) return id;
    return fallback;
  }

  function allMatches(source, entries) {
    return Object.freeze(entries.filter(([, pattern]) => pattern.test(source)).map(([id]) => id));
  }

  function classifyRiskLevel(source) {
    if (HIGH_RISK_TERMS.some(term => source.includes(term))) return 'HIGH';
    if (MEDIUM_RISK_TERMS.some(term => source.includes(term))) return 'MEDIUM';
    return 'LOW';
  }

  function buildQualityGates(source, riskLevel) {
    const decisionRequired = DECISION_TERMS.test(source);
    const multiConditionRequired = decisionRequired && MULTI_CONDITION_TERMS.test(source);
    const legalVersionRequired = riskLevel === 'HIGH' || LEGAL_VERSION_TERMS.test(source);
    const evidenceRequired = riskLevel === 'HIGH' || legalVersionRequired;
    return Object.freeze({
      decisionRequired,
      multiConditionRequired,
      legalVersionRequired,
      evidenceRequired,
      allowedDecisionStatuses: Object.freeze(['✅ ได้', '❌ ไม่ได้', '⚠️ ได้โดยมีเงื่อนไข', '🔎 หลักฐานยังไม่พอที่จะฟันธง'])
    });
  }

  function extractCaseFingerprint(question, context = {}) {
    const source = normalizeText(question);
    const facts = normalizeText(context?.facts || source);
    const pick = (pattern, fallback = '[ให้ AI สกัดจากข้อเท็จจริง]') => facts.match(pattern)?.[0] || fallback;
    const status = pick(/(?:ผู้ผ่านการสรรหา|ผู้ผ่านการคัดเลือก|ผู้สมัคร|ผู้มีสิทธิ|ผู้ได้รับแต่งตั้ง)[^,.\n]{0,80}/i);
    const priorEvent = pick(/(?:ผ่านการสรรหา|ผ่านการคัดเลือก|ประกาศผล|ได้รับคำสั่ง|ได้รับแต่งตั้ง)[^,.\n]{0,80}/i);
    return Object.freeze({
      actor: pick(/(?:ข้าราชการ|พนักงานส่วนท้องถิ่น|ลูกจ้าง|ผู้บริหาร|ผู้ผ่านการสรรหา|ผู้สมัคร)[^,.\n]{0,80}/i),
      organization: pick(/(?:องค์การบริหารส่วนจังหวัด|อบจ\.|องค์การบริหารส่วนตำบล|อบต\.|เทศบาล|อปท\.|หน่วยงาน)[^,.\n]{0,60}/i),
      status_or_prior_event: [status, priorEvent].filter(value => !value.startsWith('[')).join(' / ') || '[ให้ AI สกัดสถานะหรือเหตุการณ์ก่อนหน้า]',
      current_stage: normalizeText(context?.currentStage) || pick(/(?:รายงานตัวครั้งแรก|รายงานตัว|เลือก[^,.\n]{0,60}|รับตำแหน่ง|ก่อนสอบ|หลังสอบ)[^,.\n]{0,80}/i),
      disputed_action: pick(/(?:เดินทาง|รายงานตัว|เลือก|เบิก|จ่าย|แต่งตั้ง|ย้าย|โอน|รับโอน)[^,.\n]{0,100}/i),
      claim_or_power: pick(/(?:ค่าใช้จ่ายในการเดินทาง|ค่าเดินทาง|สิทธิ|ค่าใช้จ่าย|อำนาจ|เบิก|จ่าย)[^,.\n]{0,80}/i),
      legal_issue: pick(/(?:รับการคัดเลือก|ข้อ\s*\d+(?:\(\d+\))?|ถือเป็น|เข้าข่าย|มีอำนาจ)[^,.\n]{0,100}/i),
      applicable_rule: pick(/(?:พระราชบัญญัติ|กฎกระทรวง|ระเบียบ|ประกาศ|หนังสือ(?:สั่งการ|เวียน)?|มาตรา\s*\d+|ข้อ\s*\d+(?:\(\d+\))?)[^,.\n]{0,120}/i),
      date_context: pick(/(?:พ\.ศ\.\s*)?25\d{2}|(?:พ\.ศ\.\s*)?26\d{2}|ปี\s*\d{2,4}|วันที่\s*\d{1,2}[^,.\n]{0,30}/i, '[ต้องระบุวันที่เกิดข้อเท็จจริง]')
    });
  }

  function detectInterpretationIssue(source) {
    return EXPLICIT_PRECEDENT_TERMS.test(source)
      || INTERPRETATION_DISPUTE_TERMS.test(source)
      || MULTI_AUTHORITY_TERMS.test(source)
      || INTERPRETATION_ANALYSIS_TERMS.test(source)
      || (INTERPRETATION_DECISION_TERMS.test(source) && INTERPRETATION_FACTORS.test(source));
  }

  function buildRuleCaseMap(fingerprint) {
    const entries = Object.freeze({
      WHO: fingerprint.actor,
      ORG: fingerprint.organization,
      BEFORE: fingerprint.status_or_prior_event,
      STAGE: fingerprint.current_stage,
      ACTION: fingerprint.disputed_action,
      RIGHT: fingerprint.claim_or_power,
      RULE: fingerprint.applicable_rule,
      TIME: fingerprint.date_context
    });
    const known = Object.freeze(Object.entries(entries).filter(([, value]) => !String(value).startsWith('[')).map(([key]) => key));
    const unknown = Object.freeze(Object.entries(entries).filter(([, value]) => String(value).startsWith('[')).map(([key]) => key));
    return Object.freeze({ entries, known, unknown });
  }

  function normalizeCompletedChecks(value, allowed) {
    const supplied = Array.isArray(value)
      ? value
      : Object.entries(value && typeof value === 'object' ? value : {}).filter(([, done]) => done === true).map(([key]) => key);
    return Object.freeze([...new Set(supplied.filter(item => allowed.includes(item)))]);
  }

  function allChecksCompleted(completed, required) {
    return required.every(item => completed.includes(item));
  }

  function normalizePrecedentEvidence(evidence = {}) {
    const validationIssues = [];
    const currentRuleChecks = normalizeCompletedChecks(evidence?.currentRuleChecks, REQUIRED_CURRENT_RULE_CHECKS);
    const requestedCurrentRule = evidence?.currentRule === 'VERIFIED' || evidence?.currentRule === true;
    const currentRule = requestedCurrentRule && allChecksCompleted(currentRuleChecks, REQUIRED_CURRENT_RULE_CHECKS) ? 'VERIFIED' : 'NOT_VERIFIED';
    if (requestedCurrentRule && currentRule !== 'VERIFIED') validationIssues.push('CURRENT_RULE_CHECKLIST_INCOMPLETE');

    const searchLevelsCompleted = normalizeCompletedChecks(evidence?.searchLevelsCompleted, ADAPTIVE_SEARCH_LEVELS);
    if (currentRule !== 'VERIFIED' && searchLevelsCompleted.length > 0) validationIssues.push('PRECEDENT_SEARCH_BEFORE_CURRENT_RULE_VERIFIED');
    const identifierLeadDetected = evidence?.identifierLeadDetected === true || (Array.isArray(evidence?.citationIdentifiers) && evidence.citationIdentifiers.length > 0);
    const unresolvedLeads = evidence?.unresolvedLeads === true || (Array.isArray(evidence?.unresolvedLeads) && evidence.unresolvedLeads.length > 0);
    const hiddenDocumentRiskDetected = evidence?.hiddenDocumentRiskDetected === true;
    const hiddenDocumentRecoveryCompleted = !hiddenDocumentRiskDetected || evidence?.hiddenDocumentRecoveryCompleted === true;
    const precedentVerification = normalizeCompletedChecks(evidence?.precedentVerification, REQUIRED_PRECEDENT_VERIFICATION);
    const precedentVerificationComplete = allChecksCompleted(precedentVerification, REQUIRED_PRECEDENT_VERIFICATION);
    const rawPrecedent = evidence?.officialPrecedent === 'FOUND' ? 'FOUND_UNVERIFIED' : evidence?.officialPrecedent;
    let officialPrecedent = PRECEDENT_STATUSES.includes(rawPrecedent) ? rawPrecedent : 'NOT_SEARCHED';
    if (officialPrecedent === 'VERIFIED' && (!precedentVerificationComplete || searchLevelsCompleted.length === 0)) {
      officialPrecedent = 'FOUND_UNVERIFIED';
      validationIssues.push('PRECEDENT_VERIFICATION_INCOMPLETE');
    }
    if (officialPrecedent === 'SEARCHED_NOT_FOUND') {
      const baseLevelsComplete = ADAPTIVE_SEARCH_LEVELS.slice(0, 3).every(level => searchLevelsCompleted.includes(level));
      const citationLevelComplete = !identifierLeadDetected || searchLevelsCompleted.includes('LEVEL_4_IDENTIFIER_CITATION_CHAINING');
      if (!baseLevelsComplete || !citationLevelComplete || unresolvedLeads || !hiddenDocumentRecoveryCompleted) {
        officialPrecedent = 'SEARCH_INCOMPLETE';
        validationIssues.push('PRECEDENT_SEARCH_COVERAGE_INCOMPLETE');
      }
    }
    const searchStatus = officialPrecedent === 'VERIFIED' && (unresolvedLeads || !hiddenDocumentRecoveryCompleted)
      ? 'SEARCH_INCOMPLETE'
      : officialPrecedent;
    if (officialPrecedent === 'VERIFIED' && searchStatus === 'SEARCH_INCOMPLETE') validationIssues.push('SIGNIFICANT_AUTHORITY_LEAD_UNRESOLVED');

    const explicitNotAssessed = evidence?.caseMatch === 'NOT_ASSESSED';
    const requestedMatchLevel = explicitNotAssessed
      ? 'NOT_ASSESSED'
      : (CASE_MATCH_LEVELS.includes(evidence?.caseMatchLevel)
        ? evidence.caseMatchLevel
        : (CASE_MATCH_LEVELS.includes(evidence?.caseMatch) ? evidence.caseMatch : 'NOT_ASSESSED'));
    const caseMatch = !explicitNotAssessed && (evidence?.caseMatch === 'ASSESSED' || requestedMatchLevel !== 'NOT_ASSESSED') ? 'ASSESSED' : 'NOT_ASSESSED';
    const caseMatchLevel = caseMatch === 'ASSESSED' ? requestedMatchLevel : 'NOT_ASSESSED';
    if (caseMatch === 'ASSESSED' && caseMatchLevel === 'NOT_ASSESSED') validationIssues.push('CASE_MATCH_LEVEL_MISSING');

    const legalVersion = evidence?.legalVersion === 'VERIFIED' || evidence?.legalVersion === true ? 'VERIFIED' : 'NOT_VERIFIED';
    const rawAuthority = evidence?.newerOrConflictingAuthority
      || (evidence?.conflictingOrNewerAuthority === true ? 'CHECKED_NONE_FOUND' : 'NOT_CHECKED');
    const newerOrConflictingAuthority = AUTHORITY_STATUSES.includes(rawAuthority) ? rawAuthority : 'NOT_CHECKED';
    const authorityAnalysisComplete = newerOrConflictingAuthority !== 'FOUND' || evidence?.authorityAnalysisComplete === true;
    if (newerOrConflictingAuthority === 'FOUND' && !authorityAnalysisComplete) validationIssues.push('CONFLICTING_AUTHORITY_ANALYSIS_INCOMPLETE');
    const ruleInterpretationConfidence = RULE_CONFIDENCE_STATUSES.includes(evidence?.ruleInterpretationConfidence)
      ? evidence.ruleInterpretationConfidence
      : 'NOT_ASSESSED';
    const contraryEvidenceCheck = CONTRARY_EVIDENCE_STATUSES.includes(evidence?.contraryEvidenceCheck)
      ? evidence.contraryEvidenceCheck
      : 'NOT_CHECKED';
    if (contraryEvidenceCheck === 'FOUND_UNRESOLVED') validationIssues.push('CONTRARY_EVIDENCE_UNRESOLVED');
    const precedentContradictsPriorAnalysis = evidence?.precedentContradictsPriorAnalysis === true;

    return Object.freeze({
      currentRule,
      currentRuleChecks,
      officialPrecedent,
      searchStatus,
      searchLevelsCompleted,
      identifierLeadDetected,
      unresolvedLeads,
      hiddenDocumentRiskDetected,
      hiddenDocumentRecoveryCompleted,
      precedentVerification,
      precedentVerificationComplete,
      caseMatch,
      caseMatchLevel,
      legalVersion,
      newerOrConflictingAuthority,
      authorityAnalysisComplete,
      ruleInterpretationConfidence,
      contraryEvidenceCheck,
      precedentContradictsPriorAnalysis,
      validationIssues: Object.freeze(validationIssues)
    });
  }

  function buildCasePrecedentGate(question, context = {}, riskLevel = 'LOW', evidence = {}) {
    const source = normalizeForReasoning([question, context?.facts, context?.currentStage].filter(Boolean).join(' '));
    const interpretationIssue = detectInterpretationIssue(source);
    if (!interpretationIssue) return Object.freeze({ required: false, interpretation_issue: false, status: 'not-required', reason: 'primary-authority-sufficient-unless-new-ambiguity-appears' });

    const fingerprint = extractCaseFingerprint(question, context);
    const ruleCaseMap = buildRuleCaseMap(fingerprint);
    const evidenceState = normalizePrecedentEvidence(evidence);
    const compactFacts = Object.values(fingerprint).filter(value => !String(value).startsWith('[')).join(' ');
    const legalPhrase = fingerprint.legal_issue.startsWith('[') ? source : fingerprint.legal_issue;
    const precedentGatePassed = evidenceState.officialPrecedent === 'SEARCHED_NOT_FOUND'
      || (evidenceState.officialPrecedent === 'VERIFIED'
        && evidenceState.caseMatch === 'ASSESSED'
        && /^(?:HIGH|MEDIUM) MATCH$/.test(evidenceState.caseMatchLevel));
    const authorityGatePassed = evidenceState.newerOrConflictingAuthority === 'CHECKED_NONE_FOUND'
      || (evidenceState.newerOrConflictingAuthority === 'FOUND' && evidenceState.authorityAnalysisComplete);
    const contraryEvidenceGatePassed = evidenceState.contraryEvidenceCheck === 'CHECKED_NONE_FOUND'
      || evidenceState.contraryEvidenceCheck === 'FOUND_RESOLVED';
    const searchCompletionPassed = evidenceState.searchStatus === 'VERIFIED'
      || evidenceState.searchStatus === 'SEARCHED_NOT_FOUND';
    const decisionUnlocked = evidenceState.currentRule === 'VERIFIED'
      && precedentGatePassed
      && searchCompletionPassed
      && evidenceState.legalVersion === 'VERIFIED'
      && authorityGatePassed
      && contraryEvidenceGatePassed
      && evidenceState.ruleInterpretationConfidence === 'SUFFICIENT';
    const correctionRequired = evidenceState.precedentContradictsPriorAnalysis
      && evidenceState.officialPrecedent === 'VERIFIED'
      && evidenceState.caseMatchLevel === 'HIGH MATCH';
    let workflowStatus = 'READY_FOR_HUMAN_REVIEW';
    let nextAction = 'HUMAN_REVIEW';
    if (decisionUnlocked && correctionRequired) {
      workflowStatus = 'READY_FOR_CORRECTION_AND_HUMAN_REVIEW';
      nextAction = 'CORRECT_PRIOR_ANALYSIS_THEN_HUMAN_REVIEW';
    }
    if (!decisionUnlocked) {
      if (evidenceState.currentRule !== 'VERIFIED') {
        workflowStatus = 'BLOCKED_CURRENT_RULE_CHECK';
        nextAction = 'EXECUTE_CURRENT_RULE_CHECK';
      } else if (evidenceState.officialPrecedent === 'NOT_SEARCHED') {
        workflowStatus = 'BLOCKED_PRECEDENT_SEARCH';
        nextAction = 'EXECUTE_OFFICIAL_PRECEDENT_SEARCH';
      } else if (evidenceState.officialPrecedent === 'SEARCH_INCOMPLETE') {
        workflowStatus = 'BLOCKED_PRECEDENT_SEARCH';
        nextAction = 'CONTINUE_ADAPTIVE_PRECEDENT_SEARCH';
      } else if (evidenceState.officialPrecedent === 'FOUND_UNVERIFIED') {
        workflowStatus = 'BLOCKED_PRECEDENT_VERIFICATION';
        nextAction = 'VERIFY_PRECEDENT_CANDIDATE';
      } else if (evidenceState.searchStatus === 'SEARCH_INCOMPLETE') {
        workflowStatus = 'BLOCKED_AUTHORITY_RETRIEVAL';
        nextAction = evidenceState.hiddenDocumentRiskDetected && !evidenceState.hiddenDocumentRecoveryCompleted
          ? 'EXECUTE_HIDDEN_DOCUMENT_RECOVERY'
          : 'FOLLOW_UNRESOLVED_AUTHORITY_LEADS';
      } else if (evidenceState.officialPrecedent === 'VERIFIED' && (evidenceState.caseMatch !== 'ASSESSED' || evidenceState.caseMatchLevel === 'LOW MATCH')) {
        workflowStatus = 'BLOCKED_CASE_MATCH_ASSESSMENT';
        nextAction = evidenceState.caseMatchLevel === 'LOW MATCH' ? 'SEARCH_STRONGER_PRECEDENT_OR_LIMIT_CONCLUSION' : 'ASSESS_CASE_MATCH';
      } else if (evidenceState.legalVersion !== 'VERIFIED') {
        workflowStatus = 'BLOCKED_LEGAL_VERSION_CHECK';
        nextAction = 'VERIFY_LEGAL_VERSION';
      } else if (!authorityGatePassed) {
        workflowStatus = 'BLOCKED_AUTHORITY_CHECK';
        nextAction = 'CHECK_NEWER_OR_CONFLICTING_AUTHORITY';
      } else if (!contraryEvidenceGatePassed) {
        workflowStatus = 'BLOCKED_CONTRARY_EVIDENCE_CHECK';
        nextAction = evidenceState.contraryEvidenceCheck === 'FOUND_UNRESOLVED'
          ? 'RESOLVE_CONTRARY_EVIDENCE'
          : 'EXECUTE_CONTRARY_EVIDENCE_CHECK';
      } else {
        workflowStatus = 'BLOCKED_RULE_INTERPRETATION';
        nextAction = 'ASSESS_RULE_INTERPRETATION_CONFIDENCE';
      }
    }
    const officialDocumentLanguage = Object.freeze([
      'หารือการพิจารณา', 'หารือแนวทางการปฏิบัติ', 'หลักเกณฑ์และแนวทาง',
      'ซักซ้อมความเข้าใจ', 'การเบิกค่าใช้จ่าย', 'การเดินทางไปราชการ',
      'การแต่งตั้ง', 'การรับการคัดเลือก'
    ]);
    return Object.freeze({
      required: true,
      interpretation_issue: true,
      gateVersion: OFFICIAL_PRECEDENT_GATE_VERSION,
      retrievalGateVersion: OFFICIAL_AUTHORITY_RETRIEVAL_GATE_VERSION,
      currentRule: evidenceState.currentRule,
      officialPrecedent: evidenceState.officialPrecedent,
      caseMatch: evidenceState.caseMatch,
      caseMatchLevel: evidenceState.caseMatchLevel,
      legalVersion: evidenceState.legalVersion,
      newerOrConflictingAuthority: evidenceState.newerOrConflictingAuthority,
      ruleInterpretationConfidence: evidenceState.ruleInterpretationConfidence,
      contraryEvidenceCheck: evidenceState.contraryEvidenceCheck,
      searchStatus: evidenceState.searchStatus,
      correctionRequired,
      decisionLock: decisionUnlocked ? 'OFF' : 'ON',
      workflowStatus,
      nextAction,
      status: decisionUnlocked ? 'evidence-ready-human-review-required' : 'blocked-pending-case-precedent-search',
      reason: 'interpretation-risk-detected',
      riskLevel,
      fingerprint,
      ruleCaseMap,
      requiredEvidence: REQUIRED_PRECEDENT_EVIDENCE,
      requiredDecisionChecks: Object.freeze([...REQUIRED_PRECEDENT_EVIDENCE, 'ruleInterpretationConfidence']),
      requiredCurrentRuleChecks: REQUIRED_CURRENT_RULE_CHECKS,
      requiredPrecedentVerification: REQUIRED_PRECEDENT_VERIFICATION,
      evidenceState,
      searchConcepts: Object.freeze({
        factLanguage: compactFacts || source,
        legalLanguage: legalPhrase,
        officialDocumentLanguage,
        sourceLanguage: normalizeText(context?.owningUnit || context?.organizationType || fingerprint.organization)
      }),
      retrievalLoop: Object.freeze(['SEARCH', 'EXTRACT_LEADS', 'FOLLOW_BEST_LEAD', 'UPDATE_SEARCH', 'VERIFY']),
      leadTypes: Object.freeze(['documentNumber', 'date', 'title', 'issuingAuthority', 'legalProvision', 'officialTerminology', 'citedDocument', 'indexOrCompilation', 'pageNumber']),
      hiddenDocumentRecovery: Object.freeze(['open-pdf-or-compilation', 'inspect-index-and-table-of-contents', 'navigate-relevant-pages', 'inspect-page-images', 'ocr-only-when-needed-and-supported']),
      searchQueries: Object.freeze([
        `${compactFacts || source} หนังสือหารือ ตอบข้อหารือ แนววินิจฉัย ซักซ้อม`,
        `"${legalPhrase}" ข้อ มาตรา หลักเกณฑ์ การพิจารณา แนวทางปฏิบัติ site:go.th`,
        `รวมหนังสือหารือ ประมวลข้อหารือ สารบัญ ดัชนี คู่มือ FAQ แนววินิจฉัย ${legalPhrase} ${normalizeText(context?.owningUnit || '')} site:go.th`,
        `เลขหนังสือ รหัสกอง วันที่ ชื่อเรื่อง หนังสือที่อ้างถึง หน่วยงานผู้ตอบ ${legalPhrase} site:go.th`
      ]),
      searchLadder: ADAPTIVE_SEARCH_LEVELS,
      requiredPasses: Object.freeze(['current-rule-date-context', 'official-authority-retrieval', 'precedent-verification', 'case-match', 'temporal-authority', 'contrary-evidence', 'rule-interpretation-confidence']),
      matchingDimensions: Object.freeze(['person-position', 'organization', 'prior-event-status', 'current-stage-action', 'legal-provision', 'claim-power-legal-effect']),
      allowedMatchLevels: CASE_MATCH_LEVELS,
      allowedFinalDecisions: decisionUnlocked ? Object.freeze(['✅ ได้', '❌ ไม่ได้', '⚠️ ได้โดยมีเงื่อนไข', '🔎 หลักฐานยังไม่พอที่จะฟันธง']) : Object.freeze(['⚠️ ได้โดยมีเงื่อนไข', '🔎 หลักฐานยังไม่พอที่จะฟันธง']),
      conclusionStatusUntilPassed: '🔎 หลักฐานยังไม่พอที่จะฟันธง',
      humanApprovalRequired: true
    });
  }

  function planUniversalTask(question, context = {}) {
    const source = normalizeForReasoning([question, context?.facts, context?.desiredOutput].filter(Boolean).join(' '));
    if (!source) throw new TypeError('question must be a non-empty string');
    const riskLevel = classifyRiskLevel(source);
    const qualityGates = buildQualityGates(source, riskLevel);
    return Object.freeze({
      version: '7.1',
      standard: 'GovPrompt Prompt Standard v7.1',
      action: firstMatch(source, ACTIONS, 'answer'),
      deliverable: firstMatch(source, DELIVERABLES, 'general-answer'),
      disciplines: allMatches(source, DISCIPLINES),
      riskLevel,
      qualityGates,
      evidenceMode: qualityGates.evidenceRequired || FRESHNESS.test(source) ? 'verify-current-primary-source' : 'reason-from-provided-context-first',
      shouldProduceNow: EXPLICIT_GENERATION.test(source),
      routeIsAdvisory: true,
      missingInfoPolicy: 'produce-usable-draft-first-then-ask-only-decisive-gaps',
      selfCheck: Object.freeze([
        'ตอบตรงสิ่งที่ผู้ใช้ขอ ไม่ยึดติดชื่อหมวด',
        'ไม่แต่งข้อเท็จจริง เลขหนังสือ มาตรา วันที่ อัตรา หรือแหล่งอ้างอิง',
        'งานที่ขึ้นกับกฎ/อัตรา/สถานะปัจจุบันต้องยืนยันแหล่งปฐมภูมิและความใหม่',
        'ถ้าสิทธิหรือผลลัพธ์มีหลายเงื่อนไข ต้องตรวจครบทุกเงื่อนไขที่มีสาระสำคัญก่อนสรุป',
        'ตรวจวันมีผลใช้บังคับ ฉบับแก้ไข การยกเลิก และบทเฉพาะกาลให้ตรงกับวันที่ของข้อเท็จจริง',
        'ตรวจ PDPA ข้อมูลอ่อนไหว และข้อมูลลับ',
        'งานสั่งการ/อนุมัติ/ลงนาม/จ่ายเงินจริงต้องคง Human Approval',
        'ส่งมอบชิ้นงานพร้อมใช้ก่อนคำอธิบาย เมื่อผู้ใช้ขอให้ทำหรือร่าง'
      ])
    });
  }

  function detectRiskFlags(text) {
    const source = normalizeText(text).toLocaleLowerCase();
    const flags = [];
    if (/\b\d{13}\b/.test(source)) flags.push('พบเลข 13 หลัก — ตรวจและปกปิดหากไม่จำเป็น');
    if (/(?:\+66|0)\d{8,9}\b/.test(source)) flags.push('พบหมายเลขโทรศัพท์ — ตรวจและปกปิดหากไม่จำเป็น');
    if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(source)) flags.push('พบอีเมล — ตรวจและปกปิดหากไม่จำเป็น');
    if (/(?:เลขบัญชี|พร้อมเพย์|ข้อมูลสุขภาพ|ผลตรวจ|โรค|ข้อมูลลับ)/i.test(source)) flags.push('อาจมีข้อมูลอ่อนไหว/ข้อมูลลับ');
    if (HIGH_RISK_TERMS.some(term => source.includes(term))) flags.push('งานความเสี่ยงสูง — ต้องตรวจแหล่งข้อมูลปฐมภูมิและสถานะฉบับล่าสุดก่อนฟันธง');
    if (DECISION_TERMS.test(source) && MULTI_CONDITION_TERMS.test(source)) flags.push('Decision Gate — ห้ามสรุปจากเงื่อนไขเพียงข้อเดียว');
    return Object.freeze([...new Set(flags)]);
  }

  function normalizeRoute(route) {
    if (route?.moduleId && route?.assistant) return route;
    return Object.freeze({
      moduleId: GENERAL_ASSISTANT.moduleId,
      assistant: GENERAL_ASSISTANT,
      transactionType: 'general', modules: Object.freeze([]), confidence: 0,
      fallback: true, ambiguous: true, reason: 'universal-government-fallback'
    });
  }

  function createGovernmentPrompt({ question, route, context, attachments = [], outputFormatId = 'auto' } = {}) {
    const userQuestion = normalizeText(question);
    if (!userQuestion) throw new TypeError('question must be a non-empty string');

    const activeRoute = normalizeRoute(route);
    const normalizedContext = window.GovPromptCore.createSharedContext(context || { facts: userQuestion, desiredOutput: userQuestion });
    const attachmentNames = (Array.isArray(attachments) ? attachments : []).map(item => normalizeText(item?.name || item)).filter(Boolean);
    const riskFlags = detectRiskFlags([userQuestion, ...attachmentNames].join(' '));
    const relatedModules = Array.isArray(activeRoute.modules) && activeRoute.modules.length ? activeRoute.modules.join(', ') : activeRoute.moduleId;
    const taskPlan = planUniversalTask(userQuestion, normalizedContext);
    const gates = taskPlan.qualityGates;
    const casePrecedentGate = buildCasePrecedentGate(userQuestion, normalizedContext, taskPlan.riskLevel);
    const operationalSummary = taskPlan.action === 'summarize'
      || /(?:สรุป|ย่อ|executive summary|สรุปหนังสือ|สรุปเอกสาร)/i.test(userQuestion);
    const outputPlan = typeof window.GovPromptCore.routeOutput === 'function'
      ? window.GovPromptCore.routeOutput(userQuestion, activeRoute, normalizedContext)
      : Object.freeze({ id: 'default', label: 'คำตอบพร้อมใช้', format: 'answer-first', instructions: Object.freeze([]), confidence: 0.5, reason: 'fallback' });
    const presentationPreset = typeof window.GovPromptCore.resolveOutputFormatPreset === 'function'
      ? window.GovPromptCore.resolveOutputFormatPreset(outputFormatId)
      : null;
    const presentationBlock = presentationPreset && typeof window.GovPromptCore.buildOutputFormatPresetBlock === 'function'
      ? window.GovPromptCore.buildOutputFormatPresetBlock(presentationPreset.id)
      : '';
    const governancePlan = typeof window.GovPromptCore.evaluateAgentGovernance === 'function'
      ? window.GovPromptCore.evaluateAgentGovernance(userQuestion)
      : Object.freeze({ requestedLevel: 'L3', effectiveLevel: 'L3', allowed: true, requiresHumanApproval: false, blockers: Object.freeze([]) });

    // PR creation must be detected from the user's literal intent before any generic routing.
    // This deliberately catches common Thai typos such as "องกอน" and avoids leaking generic web/legal boilerplate.
    // Structural PR-video detection: do not depend on the spelling of the topic/title.
    // If the user asks for a video/clip AND PR/creation intent exists anywhere in the request,
    // always enter compact PR mode. The topic can be arbitrary or misspelled.
    const isPrVideoIntent = /(?:วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์)/i.test(String(userQuestion || ''))
      && /(?:ประชาสัมพันธ์|ทำ|สร้าง|ร่าง|เขียน|จัดทำ|ออกแบบ|แนะนำ)/i.test(String(userQuestion || ''));
    const isPrMediaText = isPrVideoIntent || /(?:ประชาสัมพันธ์|ข่าวประชาสัมพันธ์|โพสต์(?:โซเชียล)?|อินโฟกราฟิก|โปสเตอร์|สคริปต์|คำกล่าว|วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์|แนะนำองค์กร|แนะนำหน่วยงาน)/i.test(String(userQuestion || ''));
    const isVideoCreation = /(?:วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์)/i.test(String(userQuestion || ''))
      && /(?:ทำ|สร้าง|ร่าง|เขียน|จัดทำ|ออกแบบ|ประชาสัมพันธ์|แนะนำ)/i.test(String(userQuestion || ''));
    const isCreationAction = /^(?:create|draft|plan|summarize)$/.test(String(taskPlan.action || ''));
    const isPrCreation = isPrVideoIntent
      || isVideoCreation
      || (isCreationAction && (taskPlan.deliverable === 'public-content' || taskPlan.deliverable === 'speech'))
      || (isPrMediaText && /(?:ทำ|สร้าง|ร่าง|เขียน|จัดทำ|ออกแบบ|วางข้อความ|ทำโพสต์)/i.test(String(userQuestion || '')));
    const isPrRoute = activeRoute?.moduleId === 'GP012'
      || /ประชาสัมพันธ์/.test(String(activeRoute?.label || activeRoute?.title || activeRoute?.assistant?.title || ''))
      || isPrMediaText;
    const domainSpecificPrinciples = isPrCreation
      ? [
          '1. อ่านข้อเท็จจริงและเอกสารแนบทั้งหมดก่อนจัดทำสื่อ และห้ามถามซ้ำในสิ่งที่มีอยู่แล้ว',
          '2. ส่งชิ้นงานประชาสัมพันธ์ที่ใช้ต่อได้ทันทีตามคำขอ เช่น ข่าว โพสต์ อินโฟกราฟิก สคริปต์ หรือวิดีโอ',
          '3. ยึดข้อเท็จจริงจากข้อมูลต้นฉบับ ห้ามแต่งชื่อ ตำแหน่ง วันที่ ตัวเลข เหตุการณ์ หรือผลการดำเนินงาน',
          '4. ระบุวัตถุประสงค์ กลุ่มเป้าหมาย ช่องทาง และโทนการสื่อสารให้เหมาะกับงาน',
          '5. ถ้าเป็นวิดีโอ ให้จัด Storyboard/ลำดับฉาก บทพากย์ ข้อความขึ้นจอ รายการภาพหรือคลิปที่ควรใช้ และ Prompt สำหรับ AI Video เมื่อเหมาะสม',
          '6. ตรวจ PDPA ข้อมูลส่วนบุคคล ข้อมูลอ่อนไหว ลิขสิทธิ์ภาพ และความเหมาะสมก่อนเผยแพร่',
          '7. หากข้อมูลสำคัญขัดแย้งหรือไม่พอสำหรับเผยแพร่ ให้เตือนเฉพาะจุดนั้นและระบุข้อมูลที่ต้องยืนยัน',
          '8. ใช้ภาษาไทยอ่านง่าย กระชับ น่าเชื่อถือ และเหมาะกับการสื่อสารของหน่วยงานราชการ',
          '9. ไม่เพิ่มข้อกำหนด TOR พัสดุ การเงิน บุคคล หรือกฎหมาย เว้นแต่ผู้ใช้ร้องขอเรื่องนั้นโดยตรง',
          '10. จบด้วยผลลัพธ์พร้อมคัดลอกไปใช้ต่อ ไม่อธิบายกลไกภายในของ GovPrompt'
        ]
      : [
          '1. อ่านข้อเท็จจริงและเอกสารแนบทั้งหมดก่อนวิเคราะห์ และห้ามถามซ้ำในสิ่งที่มีอยู่แล้ว',
          '2. ตอบหรือร่างงานให้ผู้ใช้ได้ทันทีเท่าที่ข้อมูลรองรับ แม้ Router จะไม่แน่ใจหรือเลือกหมวดคลาดเคลื่อน',
          '3. ถ้าผู้ใช้ขอ “ทำ/ร่าง/จัด/สร้าง/สรุป/ตรวจ/วิเคราะห์” ให้ส่งชิ้นงานหรือข้อสรุปที่ใช้ต่อได้ก่อน ไม่เริ่มด้วยคำอธิบายเรื่องหมวด',
          '4. หากข้อมูลสำคัญไม่ครบ ให้ใช้ [ระบุ...] เฉพาะช่องที่จำเป็นในงานร่าง และถามเพิ่มเฉพาะข้อมูลที่เปลี่ยนผลลัพธ์จริง',
          '5. แยกข้อเท็จจริง สิ่งที่ยืนยันแล้ว ข้อวิเคราะห์ ความเสี่ยง และสิ่งที่ยังต้องตรวจให้ชัดเมื่อมีผลต่อการตัดสินใจ',
          '6. ห้ามสมมติเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา ชื่อบุคคล URL อัตราเงิน หรือสถานะกฎหมาย',
          '7. สำหรับกฎ ระเบียบ หนังสือสั่งการ หนังสือหารือ หนังสือซักซ้อม แนววินิจฉัย อัตรา สิทธิ และคำพิพากษา ให้ตรวจฉบับปัจจุบันล่าสุดก่อนฟันธง',
          '8. ค้นเอกสารที่เกี่ยวข้อง เรียงตามวันที่ ตรวจฉบับแก้ไข/ยกเลิก/ฉบับใหม่กว่า แล้วเลือกต้นฉบับที่ยังมีผลและใหม่ที่สุด',
          '9. ยึดแหล่งปฐมภูมิทางราชการก่อน เช่น ราชกิจจานุเบกษา กฤษฎีกา กรมบัญชีกลาง กระทรวงมหาดไทย สถ. สำนักงบประมาณ ศาล ป.ป.ช. ป.ป.ท. และ สตง.',
          '10. บทความ อินโฟกราฟิก Facebook หรือเว็บไซต์สรุป ใช้เป็นเบาะแสในการค้นเท่านั้น ห้ามใช้ฟันธงโดยไม่มีต้นฉบับรองรับ',
          '11. ถ้ายังยืนยันความเป็นฉบับล่าสุดไม่ได้ ให้ระบุชัดว่า “ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง”',
          '12. ตรวจ PDPA ข้อมูลอ่อนไหว และข้อมูลลับก่อนแสดงหรือใช้ข้อมูลที่ไม่จำเป็น',
          '13. ให้คำตอบแบบ Answer First แล้วตามด้วยเหตุผล ฐานอำนาจ ความเสี่ยง และขั้นตอนเท่าที่จำเป็น',
          '14. งานที่เป็นเอกสาร/โครงการ/TOR/ตาราง/สื่อ/คำกล่าว ให้จัดโครงสร้างตามมาตรฐานของชิ้นงานนั้น ไม่ใช้รูปแบบคำตอบทั่วไปแทน',
          '15. เมื่อมีหลายทางเลือก ให้สรุปทางเลือกที่เหมาะที่สุดพร้อมเงื่อนไขและความเสี่ยง ไม่โยนภาระให้ผู้ใช้ตัดสินจากข้อมูลดิบเอง'
        ];

    if (isPrCreation) {
      const isVideo = /(?:วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์)/i.test(userQuestion);
      const prPrompt = [
        'บทบาท',
        'คุณเป็นผู้ช่วยงานประชาสัมพันธ์ของหน่วยงานราชการไทย',
        '',
        'งานที่ผู้ใช้ต้องการ',
        userQuestion,
        '',
        'โหมดงาน: PR Media / Video Creation',
        '',
        'Answer First: ให้ส่งชิ้นงานที่ผู้ใช้ต้องการก่อน แล้วค่อยระบุข้อควรตรวจหรือข้อมูลที่ยังขาดเฉพาะที่จำเป็น',
        ...(presentationBlock ? ['', 'รูปแบบการนำเสนอที่ผู้ใช้เลือก', ...presentationBlock.split('\n')] : []),
        attachmentNames.length ? `เอกสาร/ไฟล์ประกอบ: ${attachmentNames.join(', ')}` : '',
        '',
        'วิธีทำงาน',
        '- ตอบแบบ Answer First: ส่งชิ้นงานหรือคำตอบที่พร้อมใช้ก่อน แล้วค่อยระบุข้อควรตรวจเมื่อจำเป็น',
        '- ใช้ข้อเท็จจริงจากข้อมูลที่ผู้ใช้ให้เป็นหลัก',
        '- ห้ามแต่งชื่อบุคคล ตำแหน่ง วันที่ ตัวเลข สถานที่ ผลงาน หรือเหตุการณ์',
        '- ถ้าข้อมูลสำคัญขัดแย้ง ให้ชี้จุดขัดแย้งก่อนและใช้เฉพาะข้อมูลที่ยืนยันได้',
        '- ตรวจ PDPA ข้อมูลส่วนบุคคล สิทธิการใช้ภาพ/สื่อ และความเหมาะสมก่อนเผยแพร่',
        '- ใช้ภาษาไทยอ่านง่าย กระชับ น่าเชื่อถือ เหมาะกับการสื่อสารของหน่วยงานราชการ',
        '- ไม่ดึงกฎ TOR พัสดุ การเงิน บุคคล หรือกฎหมายมาปน เว้นแต่ผู้ใช้ร้องขอเรื่องนั้นโดยตรง',
        '- หาก Route ขัดกับเจตนาของผู้ใช้ ให้ยึดเจตนา ชิ้นงาน และหลักฐานที่งานนั้นต้องใช้เป็นหลัก',
        ...(isVideo ? [
          '',
          'ถ้าเป็นวิดีโอ',
          '- แนะนำความยาวที่เหมาะสมตามวัตถุประสงค์ หากผู้ใช้ยังไม่ได้กำหนด',
          '- จัดผลลัพธ์เป็น 1) ลำดับฉาก/Storyboard 2) บทพากย์ 3) ข้อความขึ้นจอ/ซับ 4) รายการภาพหรือคลิปที่ควรใช้ 5) Prompt พร้อมคัดลอกไปใช้กับ AI Video ภายนอก',
          '- ให้แต่ละฉากระบุช่วงเวลาโดยประมาณและสารสำคัญ',
          '- ถ้ามีภาพหรือเอกสารประกอบ ให้บอกว่าจะใช้ช่วงใดของวิดีโอ'
        ] : [
          '',
          'ผลลัพธ์',
          '- จัดชิ้นงานประชาสัมพันธ์พร้อมคัดลอกไปใช้ตามรูปแบบที่ผู้ใช้ขอ'
        ]),
        '',
        'ก่อนส่ง',
        '- ตรวจชื่อ ตำแหน่ง วันที่ ตัวเลข และสารสำคัญอีกครั้ง',
        '- ถ้าข้อมูลพอ ให้ทำชิ้นงานทันที ไม่ถามคำถามเพิ่มโดยไม่จำเป็น'
      ].filter(Boolean).join('\n');

      return Object.freeze({
        prompt: prPrompt,
        riskFlags,
        route: activeRoute,
        taskPlan,
        outputPlan,
        outputFormatId: presentationPreset?.id || 'auto',
        presentationPreset,
        governancePlan,
        qualityGates: gates,
        context: normalizedContext,
        attachmentNames: Object.freeze(attachmentNames),
        prMode: true
      });
    }

    const prompt = [
      'บทบาท',
      'คุณเป็น Government AI Copilot สำหรับงานราชการไทยแบบครอบคลุม เป้าหมายคือทำงานที่ผู้ใช้ต้องการให้สำเร็จอย่างถูกต้อง ตรวจสอบได้ และพร้อมใช้ โดย Router เป็นเพียงคำแนะนำ ไม่ใช่ข้อจำกัดของความสามารถ',
      'Answer First: ส่งคำตอบหรือชิ้นงานที่ใช้ตัดสินใจ/ใช้งานต่อได้ก่อน แล้วจึงให้เหตุผล หลักฐาน ความเสี่ยง หรือขั้นตอนเท่าที่จำเป็น',
      '', 'คำถามจากผู้ใช้', userQuestion, '',
      ...(isPrCreation ? [
        'GovPrompt PR Media Mode — พร้อมนำไปใช้',
        'เป้าหมาย: จัดทำสื่อประชาสัมพันธ์จากข้อเท็จจริงที่ผู้ใช้ให้ โดยไม่ดึงกฎ TOR พัสดุ การเงิน บุคคล หรือกฎหมายมาปน เว้นแต่ผู้ใช้ถามเรื่องนั้นโดยตรง',
        'ผลลัพธ์หลัก: ข่าว/โพสต์/อินโฟกราฟิก/คำกล่าว/Storyboard/Script/บทพากย์/ข้อความขึ้นจอ/รายการภาพ/Prompt AI Video ตามคำขอ'
      ] : [
        'GovPrompt Prompt Standard v7.1 — Universal Task Reasoning'
      ]),
      `1. เจตนาหลักของงาน: ${taskPlan.action}`,
      `2. ชิ้นงานที่ควรส่งมอบ: ${taskPlan.deliverable}`,
      `3. สาขางานที่เกี่ยวข้องจากเนื้อหา: ${taskPlan.disciplines.length ? taskPlan.disciplines.join(', ') : 'general-government'}`,
      `4. ระดับความเสี่ยง: ${taskPlan.riskLevel}`,
      `5. วิธีใช้หลักฐาน: ${taskPlan.evidenceMode}`,
      '6. แยกให้ได้ว่าอะไรคือ “คำตอบ/ชิ้นงานที่ผู้ใช้ต้องการ” กับอะไรคือ “ข้อมูลสนับสนุนที่ระบบควรตรวจ”',
      '7. ถ้าข้อมูลยังไม่ครบ ให้ทำฉบับใช้งานได้เท่าที่ข้อมูลรองรับก่อน แล้วถามเฉพาะช่องว่างที่มีผลต่อคำตอบจริง',
      '8. ก่อนส่งคำตอบ ให้ตรวจความถูกต้อง ความใหม่ของหลักฐาน PDPA อำนาจตามกฎหมาย และความพร้อมใช้ของชิ้นงาน',
      '',
      'Quality Gates — ต้องผ่านก่อนฟันธง',
      `- Decision Gate: ${gates.decisionRequired ? 'ON' : 'OFF'}`,
      `- Multi-condition Gate: ${gates.multiConditionRequired ? 'ON' : 'OFF'}`,
      `- Legal Version Gate: ${gates.legalVersionRequired ? 'ON' : 'OFF'}`,
      `- Evidence Gate: ${gates.evidenceRequired ? 'ON' : 'OFF'}`,
      ...(gates.decisionRequired ? [
        '- เมื่อคำถามต้องการคำตัดสิน ให้เลือกสถานะตามหลักฐานจาก 4 สถานะเท่านั้น: ✅ ได้ / ❌ ไม่ได้ / ⚠️ ได้โดยมีเงื่อนไข / 🔎 หลักฐานยังไม่พอที่จะฟันธง',
        '- ห้ามใช้คำว่า “ได้แน่นอน/ไม่มีสิทธิแน่นอน” หากยังมีเงื่อนไขสำคัญที่ไม่ได้ตรวจ'
      ] : []),
      ...(gates.multiConditionRequired ? [
        '- Multi-condition Gate: ห้ามสรุปสิทธิ อำนาจ การเบิกจ่าย การจัดซื้อจัดจ้าง หรือผลทางบุคคลจากเงื่อนไขเพียงข้อเดียว',
        '- ระบุเงื่อนไขที่มีสาระสำคัญทั้งหมดที่ค้นพบ → เทียบกับข้อเท็จจริงทีละข้อ → ระบุ ผ่าน/ไม่ผ่าน/ยังไม่ทราบ → จึงสรุปผลรวม',
        '- ถ้าข้อมูลขาดในเงื่อนไขที่สามารถเปลี่ยนคำตอบ ให้ใช้สถานะ “🔎 หลักฐานยังไม่พอที่จะฟันธง” หรือ “⚠️ ได้โดยมีเงื่อนไข” ตามความเหมาะสม'
      ] : []),
      ...(gates.legalVersionRequired ? [
        '- Legal Version Gate: ตรวจวันมีผลใช้บังคับ ฉบับแก้ไขเพิ่มเติม การยกเลิก ฉบับที่ใหม่กว่า และบทเฉพาะกาล',
        '- ต้องจับคู่ “วันที่ของข้อเท็จจริง” กับ “กฎที่มีผลในวันนั้น” ห้ามเอาหลักเกณฑ์คนละช่วงเวลามาปะปนโดยไม่อธิบาย'
      ] : []),
      ...(gates.evidenceRequired ? [
        '- Evidence Gate: ก่อนฟันธงต้องยืนยันแหล่งปฐมภูมิ/ราชการที่ตรวจสอบได้ และตรวจความใหม่ของแหล่งนั้น',
        '- ลำดับน้ำหนักหลักฐาน: กฎหมาย/กฎ/ระเบียบ/ประกาศต้นฉบับ → หน่วยงานเจ้าของเรื่อง/หนังสือสั่งการทางการ → คำวินิจฉัยหรือคำพิพากษาที่เกี่ยวข้อง → เว็บไซต์ราชการอื่น → แหล่งสรุป',
        '- หากแหล่งสรุปขัดกับต้นฉบับ ให้ยึดต้นฉบับ และหากต้นฉบับหลายฉบับขัดกันให้ตรวจลำดับศักดิ์ วันมีผล และฉบับแก้ไข'
      ] : []),
      ...(casePrecedentGate.required ? [
        '', 'GOVPROMPT — OFFICIAL AUTHORITY RETRIEVAL GATE',
        `- retrievalGateVersion=${casePrecedentGate.retrievalGateVersion}; stateModel=Official Precedent Gate v${casePrecedentGate.gateVersion}; interpretation_issue=true`,
        `- currentRule=${casePrecedentGate.currentRule}; officialPrecedent=${casePrecedentGate.officialPrecedent}; searchStatus=${casePrecedentGate.searchStatus}; caseMatch=${casePrecedentGate.caseMatch}; legalVersion=${casePrecedentGate.legalVersion}`,
        `- newerOrConflictingAuthority=${casePrecedentGate.newerOrConflictingAuthority}; contraryEvidenceCheck=${casePrecedentGate.contraryEvidenceCheck}; ruleInterpretationConfidence=${casePrecedentGate.ruleInterpretationConfidence}`,
        `- decisionLock=${casePrecedentGate.decisionLock}; workflowStatus=${casePrecedentGate.workflowStatus}; nextAction=${casePrecedentGate.nextAction}`,
        '- MISSION: ค้นหลักฐานราชการที่มีน้ำหนักสูง ตรงข้อเท็จจริง และใช้ได้ในวันที่เกิดกรณีก่อนฟันธง — SEARCH FOR THE CASE, NOT JUST THE WORDS.',
        '- HARD STOP: ขณะ decisionLock=ON ห้ามสรุป ✅ ได้ หรือ ❌ ไม่ได้; หากมี Web Search ให้ค้นและเปิดหลักฐานเองทันที ห้ามโยนให้ผู้ใช้ค้น',
        '', '1) RULE + CASE MAP — แยกสิ่งที่ทราบ/ไม่ทราบ ห้ามสมมติข้อเท็จจริง',
        ...Object.entries(casePrecedentGate.ruleCaseMap.entries).map(([key, value]) => `- ${key}=${value}`),
        `- KNOWN=${casePrecedentGate.ruleCaseMap.known.join(', ') || 'NONE'}; UNKNOWN=${casePrecedentGate.ruleCaseMap.unknown.join(', ') || 'NONE'}`,
        '', '2) CURRENT RULE FIRST',
        '- เปิดแหล่งปฐมภูมิ ตรวจตัวบท/ข้อ/มาตรา วันมีผล ฉบับแก้ไข การยกเลิก/แทนที่ บทเฉพาะกาล และหน่วยงานเจ้าของเรื่อง แล้วจับคู่กับ TIME',
        '- สกัดถ้อยคำกฎหมายและ legal concepts จากตัวบทจริงไปค้น authority; ห้ามใช้คำถามผู้ใช้เป็น Search Vocabulary เพียงอย่างเดียว',
        '', '3–4) MULTI-ANGLE + ADAPTIVE RETRIEVAL LOOP',
        `- FACT=${casePrecedentGate.searchConcepts.factLanguage}`,
        `- LEGAL=${casePrecedentGate.searchConcepts.legalLanguage}`,
        `- OFFICIAL=${casePrecedentGate.searchConcepts.officialDocumentLanguage.join(' / ')}`,
        `- SOURCE=${casePrecedentGate.searchConcepts.sourceLanguage || '[ระบุหน่วยงานเจ้าของเรื่องและแหล่งราชการ]'}`,
        `- LOOP=${casePrecedentGate.retrievalLoop.join(' → ')}; ทุกครั้งต้องสกัด lead ใหม่: ${casePrecedentGate.leadTypes.join(', ')}`,
        '- พบ identifier จำเพาะให้เปลี่ยนจาก Topic Search เป็น Identifier Search ทันที; ห้ามค้นซ้ำคำเดิมโดยไม่เพิ่มแนวคิดหรือหลักฐาน',
        ...casePrecedentGate.searchQueries.map((query, index) => `- Query ${index + 1}: ${query}`),
        '', '5–7) DEEP / HIDDEN-DOCUMENT / CITATION RECOVERY',
        '- Direct Search ไม่พบให้ตรวจรวม/ประมวล/สารบัญ/ดัชนีข้อหารือ คู่มือ FAQ หนังสือเวียน และเอกสารที่อ้างต้นทาง; ต้องเปิดดูรายการภายใน ไม่ตัดสินจากชื่อไฟล์หรือ snippet',
        '- PDF scan อาจไม่ถูก full-text index: ตรวจสารบัญ ดัชนี เลขหน้า ภาพหน้าเอกสาร และใช้ OCR เมื่อจำเป็น/รองรับ; “ค้นข้อความไม่พบ” ไม่เท่ากับ “ไม่มีเอกสาร”',
        '- ตามสายเอกสารรอง→ต้นทาง, เอกสารหนึ่ง→หนังสือที่อ้าง, เอกสารเดิม→ฉบับแก้ไข/ใหม่กว่า จนถึงเอกสารจริง',
        '', '8) VERIFY + CASE MATCH',
        '- VERIFIED ต้องเปิดตรวจ: ผู้ออก เลขหนังสือ วันที่ เรื่อง ข้อเท็จจริง ประเด็นวินิจฉัย กฎ เหตุผล ผลวินิจฉัย และแหล่งตรวจสอบได้; Discovery Source ยังไม่ใช่ Verified Authority',
        '- เทียบ บุคคล/สถานะ + หน่วยงาน + เหตุการณ์ก่อนหน้า + ขั้นตอน + การกระทำ + กฎ + สิทธิ/ผล แล้วจัด HIGH/MEDIUM/LOW โดยให้น้ำหนักประเด็นกฎหมายและข้อเท็จจริงสาระสำคัญมากกว่าคำหรือชื่อเรื่อง; LOW เพียงลำพังห้ามฟันธง',
        '', '9–10) AUTHORITY / VERSION / CONTRARY EVIDENCE',
        '- ตรวจฉบับแก้ไข ยกเลิก แทนที่ authority ที่สูงกว่า/ใหม่กว่า/ขัดกัน และข้อยกเว้น; ชั่ง ลำดับศักดิ์ → การใช้กับกรณี → วันมีผล/ความใหม่ → Case Match → ความเป็นต้นฉบับ',
        '- ค้นหลักฐานที่อาจหักล้างคำตอบเดิมด้วย ห้ามเลือกเฉพาะหลักฐานสนับสนุน; พบ contrary evidence ต้อง resolve ก่อน Final Decision',
        '', '11) SEARCH COMPLETION',
        '- หยุดเมื่อ (A) VERIFIED + Case Match เพียงพอ + Rule/Version/Authority ครบและไม่มี unresolved lead สำคัญ หรือ (B) ทำ Direct/Multi-Angle + Deep/Index + Identifier/Citation เมื่อมี lead ตามสมควรแล้วแต่ยังไม่พบ',
        '- SEARCH_INCOMPLETE=ยังมี lead/PDF/ฐานข้อมูลสำคัญ; SEARCHED_NOT_FOUND=ใช้ retrieval strategy ที่สมควรครบแล้วแต่ยังไม่พบจากการค้นครั้งนี้; ห้ามกล่าวว่าไม่มีเอกสารเพียงเพราะ Search Engine ไม่พบ',
        '', '12) FINAL DECISION GATE',
        '- ต้องผ่าน Current Rule + Legal Version + Official Authority Search + Case Match เมื่อพบ authority + Newer/Conflicting Check + Contrary-Evidence Check + ruleInterpretationConfidence=SUFFICIENT',
        '- ผลใช้เพียง ✅ ได้ / ❌ ไม่ได้ / ⚠️ ได้โดยมีเงื่อนไข / 🔎 หลักฐานยังไม่พอที่จะฟันธง; VERIFIED + HIGH MATCH มีน้ำหนักสำคัญ เว้นแต่ authority สูงกว่า/ใหม่กว่าหรือกฎหมายเปลี่ยนผล',
        '- หากภายหลังพบหลักฐานราชการน้ำหนักสูงกว่าที่เปลี่ยนคำตอบ ต้องแก้ผลทันทีและแจ้งเหตุผลสั้น ๆ',
        '- AI ทำได้เฉพาะ Search / Verify / Compare / Analyze / Draft / Recommend; การอนุมัติ ลงนาม สั่งจ่าย ลงมติ หรือใช้อำนาจจริงต้องผ่าน Human Approval'
      ] : []),
      '', 'หลักสำคัญเรื่องการจำแนกงาน',
      `- ระบบคาดการณ์หมวดเบื้องต้น: ${activeRoute.moduleId} — ${activeRoute.assistant.title}`,
      '- หมวดดังกล่าวมีไว้ช่วยเลือกบริบท/เครื่องมือเท่านั้น ห้ามลดคุณภาพคำตอบหรือปฏิเสธงานเพียงเพราะ Route ไม่ตรง',
      '- หาก Route ขัดกับเจตนาของผู้ใช้ ให้ยึดเจตนา ชิ้นงาน และหลักฐานที่งานนั้นต้องใช้เป็นหลัก',
      '- งานหนึ่งเรื่องอาจใช้หลายความสามารถพร้อมกัน เช่น โครงการ + งบประมาณ + พัสดุ + หนังสือราชการ + PR โดยไม่ต้องบังคับผู้ใช้เลือกหมวด',
      '', 'บริบทที่ GovPrompt จัดให้',
      `- หมวดที่ระบบคาดการณ์: ${activeRoute.moduleId} — ${activeRoute.assistant.title}`,
      `- หมวดที่อาจเกี่ยวข้อง: ${relatedModules}`,
      `- ประเภทหน่วยงาน: ${normalizedContext.organizationType || '[ยังไม่ได้ระบุ]'}`,
      `- หน่วยงานเจ้าของเรื่อง: ${normalizedContext.owningUnit || '[ยังไม่ได้ระบุ]'}`,
      `- ขั้นตอนปัจจุบัน: ${normalizedContext.currentStage || '[ยังไม่ได้ระบุ]'}`,
      `- แหล่งเงิน: ${normalizedContext.fundingSource || '[ยังไม่ได้ระบุ]'}`,
      `- เอกสารแนบ: ${attachmentNames.length ? attachmentNames.join(', ') : '[ไม่มี/ยังไม่ได้แนบ]'}`,
      `- ผลลัพธ์ที่ต้องการ: ${normalizedContext.desiredOutput || userQuestion}`,
      '', presentationPreset ? 'ชิ้นงานหลักที่ Output Router เลือก' : 'รูปแบบผลลัพธ์ที่ GovPrompt เลือกให้อัตโนมัติ',
      `- ประเภท: ${outputPlan.label}`, `- รูปแบบ: ${outputPlan.format}`, `- เหตุผลการเลือก: ${outputPlan.reason}`,
      ...(outputPlan.instructions || []).map((item, index) => `${index + 1}. ${item}`),
      ...(presentationBlock ? ['', 'รูปแบบการนำเสนอที่ผู้ใช้เลือก', ...presentationBlock.split('\n')] : []),
      '', 'ขอบเขต AI Agent Governance',
      `- ระดับที่ผู้ใช้ร้องขอโดยพฤติกรรม: ${governancePlan.requestedLevel}`,
      `- ระดับที่อนุญาตในรอบนี้: ${governancePlan.effectiveLevel}`,
      '- Technical Permission ไม่เท่ากับ Legal Authority',
      '- ห้าม AI อนุมัติ ลงนาม สั่งจ่าย ลงมติ หรือตัดสินแทนผู้มีอำนาจตามกฎหมาย',
      '- หากคำขอมีผลต่อระบบจริง ให้หยุดที่ Draft/Recommendation เว้นแต่มี Human Approval, ขอบเขตชัด, rollback, audit trail และยืนยันฐานอำนาจครบ',
      '- งานกฎหมาย การเงิน พัสดุ และการเผยแพร่ทุกชิ้นต้องหยุดที่ฉบับร่างและผ่าน Human Approval ก่อนใช้จริง',
      ...(governancePlan.blockers || []).map(item => `- Governance blocker: ${item}`),
      '', 'หลักการวิเคราะห์ที่ต้องปฏิบัติ',
      ...domainSpecificPrinciples,
      ...(operationalSummary ? [
        '',
        'โหมดสรุปเพื่อการปฏิบัติจริง',
        '- เริ่มด้วยคำตอบสั้น 2–4 บรรทัดว่าเอกสารนี้หมายความว่าอะไรและมีผลต่อการทำงานอย่างไร',
        '- ระบุเฉพาะเมื่อมีข้อมูลจริง: ใช้กับใคร/กรณีใด วันมีผล วงเงิน ระยะเวลา เงื่อนไข ข้อยกเว้น และบทเฉพาะกาล',
        '- แปลงข้อกำหนดเป็น “ต้องทำอะไร” ตามลำดับที่เจ้าหน้าที่ทำตามได้จริง',
        '- ชี้จุดเสี่ยงหรือความเข้าใจผิดเฉพาะที่มีฐานจากต้นฉบับหรือแหล่งราชการที่ยืนยันได้',
        '- แยก “สิ่งที่ต้นฉบับกำหนด” ออกจาก “ข้อวิเคราะห์/คำแนะนำของ AI” ให้ชัด',
        '- ตรวจว่ามีการแก้ไข ยกเลิก แทนที่ หรืออ้างเอกสารเดิมหรือไม่ ก่อนสรุปว่าหลักใดยังใช้',
        '- หากหลักฐานไม่พอ ห้ามเดาเลขหนังสือ วันที่ วงเงิน เส้นตาย ข้อกฎหมาย หรือผลทางกฎหมาย ให้ระบุสิ่งที่ต้องตรวจเพิ่ม',
        '- ปิดท้ายด้วย Checklist สั้น ๆ หรือขั้นตอนต่อไปเฉพาะเมื่อช่วยให้ผู้ใช้ทำงานต่อได้จริง',
        '- ไม่ต้องฝืนสร้างทุกหัวข้อ ถ้าเรื่องง่ายให้ตอบสั้น ถ้าเรื่องซับซ้อนค่อยขยาย'
      ] : []),
      '', 'Self-check ก่อนตอบ',
      ...taskPlan.selfCheck.map((item, index) => `${index + 1}. ${item}`),
      '', 'สถานะความเสี่ยงเบื้องต้นจาก GovPrompt',
      riskFlags.length ? riskFlags.map(flag => `- ${flag}`).join('\n') : '- ไม่พบสัญญาณความเสี่ยงจากข้อความเบื้องต้น แต่ยังต้องตรวจทานก่อนใช้จริง',
      '', 'ข้อกำหนดผลลัพธ์',
      `- ส่งผลลัพธ์หลักในรูปแบบ “${outputPlan.label}” ตามที่ Output Router เลือก เว้นแต่ผู้ใช้สั่งรูปแบบอื่นชัดเจน`,
      ...(presentationPreset ? [`- จัดการนำเสนอชิ้นงานด้วย “${presentationPreset.label}” ตามที่ผู้ใช้เลือก โดยไม่ลดทอนโครงสร้างบังคับของชิ้นงานหลัก`] : []),
      '- ใช้ภาษาไทยชัดเจน กระชับ และเหมาะกับการปฏิบัติราชการ',
      '- อ้างแหล่งที่มาต่อข้อความสำคัญเมื่อสามารถตรวจสอบต้นฉบับได้',
      '- แยกสิ่งที่ยืนยันแล้วออกจากข้อวิเคราะห์หรือสิ่งที่ยังต้องตรวจสอบ',
      '- AI ช่วยค้น ช่วยคิด ช่วยร่าง แต่ผู้ใช้เป็นผู้ตรวจสอบและตัดสินใจก่อนนำไปใช้จริง'
    ].join('\n');

    return Object.freeze({
      prompt,
      riskFlags,
      route: activeRoute,
      taskPlan,
      outputPlan,
      outputFormatId: presentationPreset?.id || 'auto',
      presentationPreset,
      governancePlan,
      qualityGates: gates,
      casePrecedentGate,
      context: normalizedContext,
      attachmentNames: Object.freeze(attachmentNames)
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.detectPromptRiskFlags = detectRiskFlags;
  window.GovPromptCore.classifyPromptRiskLevel = classifyRiskLevel;
  window.GovPromptCore.buildPromptQualityGates = buildQualityGates;
  window.GovPromptCore.buildCasePrecedentGate = buildCasePrecedentGate;
  window.GovPromptCore.planUniversalTask = planUniversalTask;
  window.GovPromptCore.UNIVERSAL_TASK_REASONING_VERSION = '7.1';
  window.GovPromptCore.OFFICIAL_PRECEDENT_GATE_VERSION = OFFICIAL_PRECEDENT_GATE_VERSION;
  window.GovPromptCore.OFFICIAL_AUTHORITY_RETRIEVAL_GATE_VERSION = OFFICIAL_AUTHORITY_RETRIEVAL_GATE_VERSION;
  window.GovPromptCore.PROMPT_STANDARD_VERSION = '7.8.0';
  window.GovPromptCore.createGovernmentPrompt = createGovernmentPrompt;
})();
