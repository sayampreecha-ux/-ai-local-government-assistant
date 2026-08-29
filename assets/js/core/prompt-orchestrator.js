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

  const GENERAL_ASSISTANT = Object.freeze({ moduleId: 'GENERAL', title: 'ผู้ช่วยงานราชการไทยแบบครอบคลุม' });

  const ACTIONS = Object.freeze([
    ['draft', /(?:ร่าง|เขียน|จัดทำ|ทำ)\s*(?:หนังสือ|บันทึก|โครงการ|tor|คำกล่าว|ข่าว|โพสต์|แผน|รายงาน|คำสั่ง|ประกาศ|mou|วิสัยทัศน์)/i],
    ['create', /(?:ทำ|สร้าง|ออกแบบ|จัดทำ)\s*(?:ปก|โปสเตอร์|อินโฟ|อินโฟกราฟิก|ภาพ|สื่อ|ตาราง|checklist|เช็กลิสต์|แบบฟอร์ม)/i],
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
    ['public-content', /(?:โปสเตอร์|โพสต์|ประชาสัมพันธ์|ข่าวประชาสัมพันธ์|อินโฟ|อินโฟกราฟิก|การ์ด|แคปชัน|ปก)/i],
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
    ['public-relations', /(?:ประชาสัมพันธ์|โปสเตอร์|โพสต์|ข่าว|อินโฟ|การ์ด|ปก|แคปชัน)/i],
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

    const isPrIntent = /(?:ประชาสัมพันธ์|ข่าวประชาสัมพันธ์|โพสต์(?:โซเชียล)?|อินโฟกราฟิก|สคริปต์|คำกล่าว|วิดีโอ|วีดีโอ|คลิป|video|storyboard|บทพากย์|แนะนำองค์กร|แนะนำหน่วยงาน)/i.test(String(userQuestion || ''));
    const isPrRoute = activeRoute?.moduleId === 'GP012'
      || /ประชาสัมพันธ์/.test(String(activeRoute?.label || activeRoute?.title || activeRoute?.assistant?.title || ''))
      || isPrIntent;
    const domainSpecificPrinciples = isPrRoute
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

    const prompt = [
      'บทบาท',
      'คุณเป็น Government AI Copilot สำหรับงานราชการไทยแบบครอบคลุม เป้าหมายคือทำงานที่ผู้ใช้ต้องการให้สำเร็จอย่างถูกต้อง ตรวจสอบได้ และพร้อมใช้ โดย Router เป็นเพียงคำแนะนำ ไม่ใช่ข้อจำกัดของความสามารถ',
      '', 'คำถามจากผู้ใช้', userQuestion, '',
      ...(isPrRoute ? [
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
      context: normalizedContext,
      attachmentNames: Object.freeze(attachmentNames)
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.detectPromptRiskFlags = detectRiskFlags;
  window.GovPromptCore.classifyPromptRiskLevel = classifyRiskLevel;
  window.GovPromptCore.buildPromptQualityGates = buildQualityGates;
  window.GovPromptCore.planUniversalTask = planUniversalTask;
  window.GovPromptCore.UNIVERSAL_TASK_REASONING_VERSION = '7.1';
  window.GovPromptCore.PROMPT_STANDARD_VERSION = '7.3';
  window.GovPromptCore.createGovernmentPrompt = createGovernmentPrompt;
})();
