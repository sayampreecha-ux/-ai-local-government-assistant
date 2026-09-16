(() => {
  'use strict';

  const LEVELS = Object.freeze({
    L1: Object.freeze({ id: 'L1', label: 'Read', description: 'อ่าน ค้น ดึงข้อมูล และสรุป โดยไม่เปลี่ยนแปลงระบบจริง' }),
    L2: Object.freeze({ id: 'L2', label: 'Recommend', description: 'วิเคราะห์ ประเมินความเสี่ยง และเสนอทางเลือก โดยไม่ตัดสินแทนผู้มีอำนาจ' }),
    L3: Object.freeze({ id: 'L3', label: 'Draft', description: 'จัดทำร่าง เอกสาร หรือชุดข้อมูลเพื่อให้มนุษย์ตรวจและอนุมัติก่อนใช้จริง' }),
    L4: Object.freeze({ id: 'L4', label: 'Bounded Action', description: 'ดำเนินการเชิงระบบเฉพาะขอบเขตที่อนุมัติไว้ล่วงหน้าและย้อนกลับได้' })
  });

  const PROHIBITED_AUTONOMOUS_ACTIONS = Object.freeze([
    'อนุมัติหรือสั่งจ่ายเงินแทนผู้มีอำนาจ',
    'ลงนามหรือออกคำสั่งทางปกครองแทนเจ้าหน้าที่',
    'ตัดสินผลการจัดซื้อจัดจ้างหรือคัดเลือกผู้ชนะ',
    'ลงโทษทางวินัย แต่งตั้ง โอนย้าย หรือเลิกจ้างบุคคล',
    'ลงมติหรือใช้อำนาจของสภาท้องถิ่น',
    'เปิดเผยข้อมูลส่วนบุคคล ข้อมูลสุขภาพ หรือข้อมูลลับโดยอัตโนมัติ',
    'ส่งข้อมูลหรือเรียก API ที่มีผลผูกพันภายนอกโดยไม่มีการอนุมัติที่ตรวจสอบได้'
  ]);

  const ACTION_INTENT = /(ส่ง(?:หนังสือ|ข้อมูล|ผล|จริง)|ยืนยันการส่ง|ยืนยันผล|ยืนยันรายการจ่ายเงิน|อนุมัติ|สั่งจ่าย|ลงนาม|ออก(?:หนังสือ)?คำสั่ง|บันทึก.*เข้าระบบ|แก้ไขข้อมูล(?:ทะเบียน)?.*จริง|เรียก\s*api|ดำเนินการแทน|เผยแพร่.*(?:ทันที|จริง)|ตัดสิน(?:ผล|ผู้ชนะ)|เลือกผู้ชนะ|ลงโทษ|แต่งตั้ง|โอนย้าย|เลิกจ้าง|ลงมติ|เปิดเผยข้อมูล|ข้ามขั้นอนุมัติ)/i;
  const RESERVED_AUTHORITY = /(อนุมัติ(?:และ)?สั่งจ่าย|สั่งจ่ายเงิน.*แทนผู้มีอำนาจ|ลงนาม.*แทน|ออกคำสั่งทางปกครอง.*แทน|ตัดสินผลการจัดซื้อจัดจ้าง|เลือกผู้ชนะ(?:\s*e-bidding)?|ลงโทษทางวินัย|แต่งตั้งบุคคล.*เข้าตำแหน่ง|โอนย้ายข้าราชการ|เลิกจ้างพนักงาน|เลิกจ้างบุคคล|ลงมติแทน|เปิดเผยข้อมูลสุขภาพ|ส่งข้อมูลส่วนบุคคล.*ภายนอก|ส่งข้อมูลลับ.*ภายนอก|เผยแพร่รายชื่อ.*เลขบัตรประชาชน)/i;

  function normalize(value) {
    return String(value ?? '').normalize('NFC').trim().toLocaleLowerCase();
  }

  function classifyAutonomy(request) {
    const text = normalize(request);
    if (!text) return Object.freeze({ level: 'L1', confidence: 0.4, reason: 'empty-or-unknown' });
    if (ACTION_INTENT.test(text)) return Object.freeze({ level: 'L4', confidence: 0.95, reason: 'action-intent' });
    if (/(ร่าง|เขียน|จัดทำ|ทำหนังสือ|ทำบันทึก|ทำ tor|ทำโครงการ|สร้าง checklist|ทำตาราง|ทำ csv|ทำ json|ทำโพสต์|ทำข่าว)/i.test(text)) return Object.freeze({ level: 'L3', confidence: 0.9, reason: 'draft-intent' });
    if (/(วิเคราะห์|ประเมิน|ตรวจ|พิจารณา|เสนอทางเลือก|แนะนำ|ความเสี่ยง|ควรทำอย่างไร|ได้ไหม|หรือไม่)/i.test(text)) return Object.freeze({ level: 'L2', confidence: 0.85, reason: 'recommend-intent' });
    return Object.freeze({ level: 'L1', confidence: 0.7, reason: 'read-intent' });
  }

  function evaluateAgentGovernance(request, options = {}) {
    const text = normalize(request);
    const classified = classifyAutonomy(text);
    const requestedLevel = classified.level;
    const approved = options.humanApproved === true;
    const bounded = options.boundedAction === true;
    const reversible = options.reversible === true;
    const auditReady = options.auditReady === true;
    const legalAuthorityVerified = options.legalAuthorityVerified === true;
    const reservedAuthority = RESERVED_AUTHORITY.test(text);
    const governanceReady = approved && bounded && reversible && auditReady && legalAuthorityVerified;
    const allowed = requestedLevel !== 'L4' || (!reservedAuthority && governanceReady);
    const effectiveLevel = allowed ? requestedLevel : 'L3';
    const blockers = [];
    if (requestedLevel === 'L4') {
      if (reservedAuthority) blockers.push('เป็นการใช้อำนาจที่สงวนไว้สำหรับมนุษย์/ผู้มีอำนาจ — AI ทำได้เพียงช่วยร่างหรือเตรียมข้อมูล');
      if (!approved) blockers.push('ต้องมี Human Approval ที่ตรวจสอบได้');
      if (!bounded) blockers.push('ต้องกำหนดขอบเขตการกระทำอย่างชัดเจน');
      if (!reversible) blockers.push('ต้องมีวิธี Pause/Reject/Revoke/Rollback');
      if (!auditReady) blockers.push('ต้องมี Audit Trail');
      if (!legalAuthorityVerified) blockers.push('ต้องยืนยันฐานอำนาจตามกฎหมายแยกจากสิทธิ์ทางเทคนิค');
    }
    return Object.freeze({ requestedLevel, effectiveLevel, allowed, requiresHumanApproval: requestedLevel === 'L4', technicalPermissionIsLegalAuthority: false, reservedAuthority, blockers: Object.freeze(blockers), reason: classified.reason, confidence: classified.confidence });
  }

  // GovPrompt Thailand V7.1/V7.2 — Authority-dependent routing policy.
  // This augments the existing Router/Quality Gates; it does not add a new UI gate or hard-code any substantive answer.
  const AUTHORITY_DEPENDENCY = /กฎหมาย|ระเบียบ|ประกาศ|มาตรฐานกำหนดตำแหน่ง|หลักเกณฑ์|ก\.กลาง|ก\.จังหวัด|มติ|หนังสือสั่งการ|หนังสือหารือ|แนววินิจฉัย|สิทธิ|คุณสมบัติ|ครองตำแหน่ง|ดำรงตำแหน่ง|เลื่อนระดับ|แต่งตั้ง|โอน|ย้าย|สอบคัดเลือก|สอบแข่งขัน|สมัคร|เงินเดือน|อัตรา|ประสบการณ์|กี่ปี|กี่เดือน|กี่วัน|ครบหรือยัง|นับเวลา|ลดระยะเวลา/i;
  const OFFICIAL_NUMERIC = /(\d+(?:[.,]\d+)?\s*(?:ปี|เดือน|วัน|บาท|%|ร้อยละ|คะแนน|ขั้น|ระดับ))|กี่\s*(?:ปี|เดือน|วัน|บาท|เปอร์เซ็นต์|คะแนน|ขั้น|ระดับ)|อายุ|ร้อยละ|จำนวนเงิน|อัตรา|เงินเดือน|ระยะเวลา|เกณฑ์คะแนน|ครองตำแหน่ง/i;
  const PERSONNEL = /งานบุคคล|บุคลากร|ข้าราชการ|พนักงานส่วนท้องถิ่น|รองปลัด|ปลัด|นักบริหาร|ตำแหน่ง|บรรจุ|แต่งตั้ง|โอน|ย้าย|เลื่อนระดับ|สอบคัดเลือก|สอบแข่งขัน|เงินเดือน/i;
  const DRAFTING = /ร่างหนังสือ|ร่างคำสั่ง|ร่างประกาศ|เขียนคำกล่าว|เรียบเรียง|สรุปข้อมูลที่ผู้ใช้ให้|ปรับภาษา/i;
  const RIGHTS_QUALIFICATION = /สิทธิ|คุณสมบัติ|กี่ปี|กี่เดือน|กี่วัน|ครองตำแหน่ง|ดำรงตำแหน่ง|เลื่อนระดับ|แต่งตั้ง|โอน|ย้าย|สอบคัดเลือก|สอบแข่งขัน|สมัคร|เงินเดือน|อัตรา|ประสบการณ์|ครบหรือยัง|นับเวลา|ลดระยะเวลา/i;
  const WORK_DELIVERABLE = /ร่าง|จัดทำ|ทำหนังสือ|ทำบันทึก|ทำ tor|ทำโครงการ|ทำ checklist|ทำตาราง|สรุป|แนวทาง|ขั้นตอน|เอกสาร|แบบฟอร์ม|คำสั่ง|ประกาศ/i;
  const BLOCKING_FACTS = /ประเภทบุคลากร|ประเภท\s*อปท|หน่วยงาน|ตำแหน่ง|ระดับ|เหตุ(?:ย้าย|โอน)|วันที่|ช่วงเวลา|คำสั่ง|จำนวนเงิน|งบประมาณ|สัญญา|ข้อเท็จจริง|เอกสารประกอบ/i;

  function normalizeAuthorityQuery(input = '') {
    return String(input).normalize('NFC')
      .replace(/สูงง/g, 'สูง')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function classifyAuthorityDependency(input = '') {
    const text = String(input).trim();
    const personnel = PERSONNEL.test(text);
    const numericAuthority = OFFICIAL_NUMERIC.test(text);
    const rightsQualification = RIGHTS_QUALIFICATION.test(text);
    const draftOnly = DRAFTING.test(text) && !rightsQualification && !numericAuthority;
    const authorityDependent = !draftOnly && (AUTHORITY_DEPENDENCY.test(text) || numericAuthority);
    return Object.freeze({
      personnel,
      subtype: personnel ? (draftOnly ? 'drafting-communication' : authorityDependent ? 'qualification-rights-authority' : 'general-personnel') : '',
      authorityDependent,
      numericAuthority,
      searchable: authorityDependent,
      decidable: false,
      recommendedMode: authorityDependent ? 'web-when-needed' : 'ai-only',
      officialAuthorityOverride: authorityDependent,
      normalizedSearchIntent: authorityDependent ? normalizeAuthorityQuery(text) : '',
      unresolvedNumericMessage: 'ยังยืนยันเกณฑ์ปัจจุบันไม่ได้'
    });
  }

  function buildAuthorityPolicy(input = '') {
    const result = classifyAuthorityDependency(input);
    if (!result.authorityDependent) return result;
    return Object.freeze({
      ...result,
      sequence: Object.freeze(['official-source-retrieval', 'applicability-check', 'evidence-check', 'ai-reasoning', 'answer-first']),
      sourcePriority: Object.freeze(['มาตรฐานกำหนดตำแหน่ง', 'ประกาศ ก.กลางที่เกี่ยวข้อง', 'หลักเกณฑ์การสรรหา/คัดเลือก/แต่งตั้ง', 'มติหรือหนังสือสั่งการของหน่วยงานที่มีอำนาจ', 'หนังสือหารือหรือแนววินิจฉัยที่เกี่ยวข้อง', 'เว็บไซต์ราชการที่เผยแพร่เอกสารต้นฉบับ']),
      applicability: Object.freeze(['ประเภทบุคลากร', 'ประเภทองค์กรปกครองส่วนท้องถิ่น', 'ระดับตำแหน่ง', 'วิธีเข้าสู่ตำแหน่ง', 'ช่วงเวลาที่เหตุการณ์เกิดขึ้น', 'ฉบับของหลักเกณฑ์ที่ใช้บังคับ'])
    });
  }

  // V7.2: make the model behave like a work copilot rather than a generic chatbot.
  // The contract is advisory metadata/instructions only; it does not invent missing facts or substantive legal answers.
  function buildWorkContract(input = '', authorityPolicy = null) {
    const text = String(input).trim();
    const authorityDependent = authorityPolicy?.authorityDependent === true || classifyAuthorityDependency(text).authorityDependent;
    const deliverableRequested = WORK_DELIVERABLE.test(text);
    const blockingFactLanguage = BLOCKING_FACTS.test(text);
    return Object.freeze({
      answerFirst: true,
      deliverableRequested,
      authorityDependent,
      minimumClarification: true,
      clarificationRule: 'ถามกลับเฉพาะข้อมูลที่ขาดและมีผลต่อคำตอบ/การทำงานจริงเท่านั้น; รวมคำถามที่จำเป็นไว้ในครั้งเดียว และถ้าเริ่มค้นฐานอำนาจได้โดยไม่ต้องรอข้อมูลเฉพาะราย ให้เริ่มค้นก่อน',
      noQuestionnaire: true,
      evidenceBeforeConclusion: authorityDependent,
      actionableOutput: true,
      outputContract: Object.freeze([
        'คำตอบ/ผลลัพธ์หลัก',
        'เหตุผลหรือหลักฐานที่จำเป็น',
        'สิ่งที่ผู้ใช้ต้องทำต่อ',
        'เอกสารหรือข้อมูลที่ต้องเตรียม (ถ้ามี)',
        'จุดเสี่ยง/สิ่งที่ยังยืนยันไม่ได้ (ถ้ามี)'
      ]),
      avoidGenericAdvice: true,
      blockingFactLanguage,
      unresolvedAuthorityMessage: authorityDependent ? 'หากหลักฐานทางการยังไม่พอ ห้ามฟันธง ให้ระบุสิ่งที่ยังยืนยันไม่ได้และข้อมูล/เอกสารที่ต้องใช้ยืนยัน' : ''
    });
  }

  function activateAuthorityRouting(core) {
    if (!core || core.__authorityRoutingV71Active) return;
    const originalCreatePlan = core.createToolRoutingPlan;
    if (typeof originalCreatePlan === 'function') {
      core.createToolRoutingPlan = function createAuthorityAwareToolRoutingPlan(args = {}) {
        const base = originalCreatePlan(args);
        const policy = buildAuthorityPolicy(args.question || '');
        const workContract = buildWorkContract(args.question || '', policy);
        if (!policy.authorityDependent) {
          if (!base?.instructions) return Object.freeze({ ...base, workContract });
          const instructions = Array.from(base.instructions || []);
          instructions.push('Work Copilot Contract: ตอบผลลัพธ์หลักก่อน ถ้าข้อมูลขาดให้ถามเฉพาะข้อมูลที่เป็นตัวขวางงานจริง และส่งขั้นตอน/เอกสารที่ผู้ใช้ทำต่อได้ทันที');
          instructions.push('ห้ามทำแบบสอบถามยาวโดยไม่จำเป็น และห้ามให้คำแนะนำทั่วไปแทนการทำงานที่ผู้ใช้ร้องขอ');
          return Object.freeze({ ...base, instructions: Object.freeze(instructions), workContract });
        }
        const explicitNoWeb = base?.flags?.explicitNoWeb === true;
        const tools = Array.from(base?.tools || []);
        if (!explicitNoWeb && !tools.includes('web-search')) tools.unshift('web-search');
        const aiIndex = tools.indexOf('ai-reasoning');
        const webIndex = tools.indexOf('web-search');
        if (!explicitNoWeb && webIndex > -1 && aiIndex > -1 && webIndex > aiIndex) {
          tools.splice(webIndex, 1);
          tools.splice(aiIndex, 0, 'web-search');
        }
        const instructions = Array.from(base?.instructions || []);
        instructions.push('Official Authority Retrieval Override: คำถามนี้ขึ้นกับฐานอำนาจ ห้ามใช้ ai-only เพื่อฟันธง และห้ามตอบจากความจำของโมเดลแทนการตรวจหลักฐาน');
        instructions.push('หลักกลาง: ข้อมูลไม่พอสำหรับตัดสิน ไม่ได้หมายความว่าข้อมูลไม่พอสำหรับเริ่มค้น — เมื่อระบุเรื่องที่ต้องค้นได้แล้ว ให้เริ่มค้นฐานอำนาจทันที ไม่ต้องรอข้อเท็จจริงเฉพาะรายครบทุกช่อง');
        instructions.push('ค้นแหล่งทางการ/ต้นฉบับก่อน แล้วตรวจความใช้บังคับกับประเภทบุคลากร ประเภท อปท. ระดับตำแหน่ง วิธีเข้าสู่ตำแหน่ง ช่วงเวลาเกิดเหตุ และฉบับหลักเกณฑ์ ก่อนสรุป');
        instructions.push('Answer First ใช้หลังผ่านการตรวจ Authority/Evidence/Applicability แล้วเท่านั้น; Answer First ไม่ใช่การตอบก่อนตรวจหลักฐาน');
        instructions.push('Work Copilot Contract: ตอบผลลัพธ์หลักหลังผ่านหลักฐานที่จำเป็น แล้วระบุสิ่งที่ผู้ใช้ต้องทำต่อ เอกสารที่ต้องเตรียม และจุดที่ยังยืนยันไม่ได้');
        instructions.push('Minimum Clarification Rule: ถ้าข้อมูลยังขาด ให้ถามเฉพาะข้อมูลที่มีผลต่อคำตอบหรือการทำงานจริง รวมคำถามที่จำเป็นไว้ในครั้งเดียว และอย่ารอข้อมูลที่ไม่จำเป็นต่อการเริ่มค้นฐานอำนาจ');
        if (policy.numericAuthority) instructions.push('Numeric Authority Rule: ตัวเลขที่มีผลต่อสิทธิหรือคุณสมบัติ เช่น ปี เดือน วัน อายุ ร้อยละ เงิน อัตรา ระดับ ขั้น หรือคะแนน ต้องมีหลักฐานทางการรองรับ ห้ามเดาจากความจำ; ถ้ายังตรวจไม่ยืนยัน ให้ตอบว่า “ยังยืนยันเกณฑ์ปัจจุบันไม่ได้”');
        if (explicitNoWeb) instructions.push('ผู้ใช้ปิดการค้นเว็บไว้: ห้ามฝ่าฝืนคำสั่งดังกล่าว แต่คำถามยังคงเป็น authority-dependent จึงห้ามฟันธงฐานกฎหมาย/ตัวเลขที่ยังไม่มีหลักฐานในบริบท ให้ตอบแบบมีเงื่อนไขหรือระบุว่ายังยืนยันไม่ได้');
        return Object.freeze({
          ...base,
          mode: explicitNoWeb ? 'authority-verification-required' : 'web-when-needed',
          tools: Object.freeze([...new Set(tools)]),
          instructions: Object.freeze(instructions),
          reasons: Object.freeze([...(base?.reasons || []), 'คำตอบขึ้นกับฐานอำนาจ/หลักเกณฑ์ทางราชการ จึงต้องตรวจแหล่งทางการก่อนฟันธง']),
          authorityPolicy: policy,
          workContract,
          flags: Object.freeze({ ...(base?.flags || {}), authorityDependent: true, numericAuthority: policy.numericAuthority, officialAuthorityOverride: true })
        });
      };
    }
    core.__authorityRoutingV71Active = true;
  }

  // iOS/in-app browser handoff guard.
  document.addEventListener('click', event => {
    const control = event.target.closest?.('.answer-actions button');
    if (!control) return;
    const label = String(control.textContent || '').trim();
    const destinationUrl = /ChatGPT/i.test(label)
      ? 'https://chatgpt.com/'
      : /Gemini/i.test(label)
        ? 'https://gemini.google.com/'
        : '';
    if (!destinationUrl) return;
    const card = control.closest('.answer-card');
    if (!card) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const copyButton = [...card.querySelectorAll('.answer-actions button')].find(button => /คัดลอก\s*(?:Prompt|คำสั่ง)/i.test(String(button.textContent || '')));
    if (copyButton) copyButton.click();
    const opened = window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = destinationUrl;
  }, true);

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.AGENT_AUTONOMY_LEVELS = LEVELS;
  window.GovPromptCore.PROHIBITED_AUTONOMOUS_ACTIONS = PROHIBITED_AUTONOMOUS_ACTIONS;
  window.GovPromptCore.classifyAutonomy = classifyAutonomy;
  window.GovPromptCore.evaluateAgentGovernance = evaluateAgentGovernance;
  window.GovPromptCore.classifyAuthorityDependency = classifyAuthorityDependency;
  window.GovPromptCore.normalizeAuthorityQuery = normalizeAuthorityQuery;
  window.GovPromptCore.buildAuthorityPolicy = buildAuthorityPolicy;
  window.GovPromptCore.buildWorkContract = buildWorkContract;
  activateAuthorityRouting(window.GovPromptCore);
})();