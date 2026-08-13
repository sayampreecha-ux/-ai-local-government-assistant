(() => {
  'use strict';

  const HIGH_RISK_TERMS = Object.freeze([
    'กฎหมาย', 'ระเบียบ', 'หนังสือเวียน', 'หนังสือสั่งการ', 'ข้อหารือ', 'ซักซ้อม',
    'พัสดุ', 'จัดซื้อ', 'จัดจ้าง', 'tor', 'ราคากลาง', 'เบิก', 'งบประมาณ', 'วินัย',
    'คำพิพากษา', 'ศาล', 'ป.ป.ช.', 'สตง.', 'ข้อมูลส่วนบุคคล', 'pdpa'
  ]);

  const GENERAL_ASSISTANT = Object.freeze({
    moduleId: 'GENERAL',
    title: 'ผู้ช่วยงานราชการไทยแบบครอบคลุม'
  });

  function normalizeText(value) {
    return String(value ?? '').normalize('NFC').trim();
  }

  function detectRiskFlags(text) {
    const source = normalizeText(text).toLocaleLowerCase();
    const flags = [];
    if (/\b\d{13}\b/.test(source)) flags.push('พบเลข 13 หลัก — ตรวจและปกปิดหากไม่จำเป็น');
    if (/(?:\+66|0)\d{8,9}\b/.test(source)) flags.push('พบหมายเลขโทรศัพท์ — ตรวจและปกปิดหากไม่จำเป็น');
    if (/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/.test(source)) flags.push('พบอีเมล — ตรวจและปกปิดหากไม่จำเป็น');
    if (/(?:เลขบัญชี|พร้อมเพย์|ข้อมูลสุขภาพ|ผลตรวจ|โรค|ข้อมูลลับ)/i.test(source)) flags.push('อาจมีข้อมูลอ่อนไหว/ข้อมูลลับ');
    if (HIGH_RISK_TERMS.some(term => source.includes(term))) flags.push('งานนี้ควรตรวจแหล่งข้อมูลปฐมภูมิและสถานะฉบับล่าสุดก่อนฟันธง');
    return Object.freeze([...new Set(flags)]);
  }

  function normalizeRoute(route) {
    if (route?.moduleId && route?.assistant) return route;
    return Object.freeze({
      moduleId: GENERAL_ASSISTANT.moduleId,
      assistant: GENERAL_ASSISTANT,
      transactionType: 'general',
      modules: Object.freeze([]),
      confidence: 0,
      fallback: true,
      ambiguous: true,
      reason: 'universal-government-fallback'
    });
  }

  function fallbackTaskPlan() {
    return Object.freeze({
      version: '7.1', action: 'answer', deliverable: 'general-answer', disciplines: Object.freeze([]),
      evidenceMode: 'reason-from-provided-context-first', shouldProduceNow: true, routeIsAdvisory: true,
      missingInfoPolicy: 'produce-usable-draft-first-then-ask-only-decisive-gaps', selfCheck: Object.freeze([])
    });
  }

  function createGovernmentPrompt({ question, route, context, attachments = [] } = {}) {
    const userQuestion = normalizeText(question);
    if (!userQuestion) throw new TypeError('question must be a non-empty string');

    const activeRoute = normalizeRoute(route);
    const normalizedContext = window.GovPromptCore.createSharedContext(context || { facts: userQuestion, desiredOutput: userQuestion });
    const attachmentNames = (Array.isArray(attachments) ? attachments : [])
      .map(item => normalizeText(item?.name || item))
      .filter(Boolean);
    const riskFlags = detectRiskFlags([userQuestion, ...attachmentNames].join(' '));
    const relatedModules = Array.isArray(activeRoute.modules) && activeRoute.modules.length ? activeRoute.modules.join(', ') : activeRoute.moduleId;
    const taskPlan = typeof window.GovPromptCore.planUniversalTask === 'function'
      ? window.GovPromptCore.planUniversalTask(userQuestion, normalizedContext)
      : fallbackTaskPlan();
    const outputPlan = typeof window.GovPromptCore.routeOutput === 'function'
      ? window.GovPromptCore.routeOutput(userQuestion, activeRoute, normalizedContext)
      : Object.freeze({ id: 'default', label: 'คำตอบพร้อมใช้', format: 'answer-first', instructions: Object.freeze([]), confidence: 0.5, reason: 'fallback' });
    const governancePlan = typeof window.GovPromptCore.evaluateAgentGovernance === 'function'
      ? window.GovPromptCore.evaluateAgentGovernance(userQuestion)
      : Object.freeze({ requestedLevel: 'L3', effectiveLevel: 'L3', allowed: true, requiresHumanApproval: false, blockers: Object.freeze([]) });

    const prompt = [
      'บทบาท',
      'คุณเป็น Government AI Copilot สำหรับงานราชการไทยแบบครอบคลุม เป้าหมายคือทำงานที่ผู้ใช้ต้องการให้สำเร็จอย่างถูกต้อง ตรวจสอบได้ และพร้อมใช้ โดย Router เป็นเพียงคำแนะนำ ไม่ใช่ข้อจำกัดของความสามารถ',
      '',
      'คำถามจากผู้ใช้',
      userQuestion,
      '',
      'Universal Task Reasoning v7.1 — ให้คิดตามลำดับนี้ก่อนตอบ',
      `1. เจตนาหลักของงาน: ${taskPlan.action}`,
      `2. ชิ้นงานที่ควรส่งมอบ: ${taskPlan.deliverable}`,
      `3. สาขางานที่เกี่ยวข้องจากเนื้อหา: ${taskPlan.disciplines?.length ? taskPlan.disciplines.join(', ') : 'general-government'}`,
      `4. วิธีใช้หลักฐาน: ${taskPlan.evidenceMode}`,
      '5. แยกให้ได้ว่าอะไรคือ “คำตอบ/ชิ้นงานที่ผู้ใช้ต้องการ” กับอะไรคือ “ข้อมูลสนับสนุนที่ระบบควรตรวจ”',
      '6. ถ้าข้อมูลยังไม่ครบ ให้ทำฉบับใช้งานได้เท่าที่ข้อมูลรองรับก่อน แล้วถามเฉพาะช่องว่างที่มีผลต่อคำตอบจริง',
      '7. ก่อนส่งคำตอบ ให้ตรวจความถูกต้อง ความใหม่ของหลักฐาน PDPA อำนาจตามกฎหมาย และความพร้อมใช้ของชิ้นงาน',
      '',
      'หลักสำคัญเรื่องการจำแนกงาน',
      `- ระบบคาดการณ์หมวดเบื้องต้น: ${activeRoute.moduleId} — ${activeRoute.assistant.title}`,
      '- หมวดดังกล่าวมีไว้ช่วยเลือกบริบท/เครื่องมือเท่านั้น ห้ามลดคุณภาพคำตอบหรือปฏิเสธงานเพียงเพราะ Route ไม่ตรง',
      '- หาก Route ขัดกับเจตนาของผู้ใช้ ให้ยึดเจตนา ชิ้นงาน และหลักฐานที่งานนั้นต้องใช้เป็นหลัก',
      '- งานหนึ่งเรื่องอาจใช้หลายความสามารถพร้อมกัน เช่น โครงการ + งบประมาณ + พัสดุ + หนังสือราชการ + PR โดยไม่ต้องบังคับผู้ใช้เลือกหมวด',
      '',
      'บริบทที่ GovPrompt จัดให้',
      `- หมวดที่ระบบคาดการณ์: ${activeRoute.moduleId} — ${activeRoute.assistant.title}`,
      `- หมวดที่อาจเกี่ยวข้อง: ${relatedModules}`,
      `- ประเภทหน่วยงาน: ${normalizedContext.organizationType || '[ยังไม่ได้ระบุ]'}`,
      `- หน่วยงานเจ้าของเรื่อง: ${normalizedContext.owningUnit || '[ยังไม่ได้ระบุ]'}`,
      `- ขั้นตอนปัจจุบัน: ${normalizedContext.currentStage || '[ยังไม่ได้ระบุ]'}`,
      `- แหล่งเงิน: ${normalizedContext.fundingSource || '[ยังไม่ได้ระบุ]'}`,
      `- เอกสารแนบ: ${attachmentNames.length ? attachmentNames.join(', ') : '[ไม่มี/ยังไม่ได้แนบ]'}`,
      `- ผลลัพธ์ที่ต้องการ: ${normalizedContext.desiredOutput || userQuestion}`,
      '',
      'รูปแบบผลลัพธ์ที่ GovPrompt เลือกให้อัตโนมัติ',
      `- ประเภท: ${outputPlan.label}`,
      `- รูปแบบ: ${outputPlan.format}`,
      `- เหตุผลการเลือก: ${outputPlan.reason}`,
      ...(outputPlan.instructions || []).map((item, index) => `${index + 1}. ${item}`),
      '',
      'ขอบเขต AI Agent Governance',
      `- ระดับที่ผู้ใช้ร้องขอโดยพฤติกรรม: ${governancePlan.requestedLevel}`,
      `- ระดับที่อนุญาตในรอบนี้: ${governancePlan.effectiveLevel}`,
      '- Technical Permission ไม่เท่ากับ Legal Authority',
      '- ห้าม AI อนุมัติ ลงนาม สั่งจ่าย ลงมติ หรือตัดสินแทนผู้มีอำนาจตามกฎหมาย',
      '- หากคำขอมีผลต่อระบบจริง ให้หยุดที่ Draft/Recommendation เว้นแต่มี Human Approval, ขอบเขตชัด, rollback, audit trail และยืนยันฐานอำนาจครบ',
      ...(governancePlan.blockers || []).map(item => `- Governance blocker: ${item}`),
      '',
      'หลักการวิเคราะห์ที่ต้องปฏิบัติ',
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
      '15. เมื่อมีหลายทางเลือก ให้สรุปทางเลือกที่เหมาะที่สุดพร้อมเงื่อนไขและความเสี่ยง ไม่โยนภาระให้ผู้ใช้ตัดสินจากข้อมูลดิบเอง',
      '',
      'Self-check ก่อนตอบ',
      ...(taskPlan.selfCheck?.length ? taskPlan.selfCheck.map((item, index) => `${index + 1}. ${item}`) : ['1. ตอบตรงคำถามและไม่แต่งข้อเท็จจริง', '2. ตรวจความเสี่ยงและความพร้อมใช้']),
      '',
      'สถานะความเสี่ยงเบื้องต้นจาก GovPrompt',
      riskFlags.length ? riskFlags.map(flag => `- ${flag}`).join('\n') : '- ไม่พบสัญญาณความเสี่ยงจากข้อความเบื้องต้น แต่ยังต้องตรวจทานก่อนใช้จริง',
      '',
      'ข้อกำหนดผลลัพธ์',
      `- ส่งผลลัพธ์หลักในรูปแบบ “${outputPlan.label}” ตามที่ Output Router เลือก เว้นแต่ผู้ใช้สั่งรูปแบบอื่นชัดเจน`,
      '- ใช้ภาษาไทยชัดเจน กระชับ และเหมาะกับการปฏิบัติราชการ',
      '- อ้างแหล่งที่มาต่อข้อความสำคัญเมื่อสามารถตรวจสอบต้นฉบับได้',
      '- แยกสิ่งที่ยืนยันแล้วออกจากข้อวิเคราะห์หรือสิ่งที่ยังต้องตรวจสอบ',
      '- AI ช่วยค้น ช่วยคิด ช่วยร่าง แต่ผู้ใช้เป็นผู้ตรวจสอบและตัดสินใจก่อนนำไปใช้จริง'
    ].join('\n');

    return Object.freeze({ prompt, riskFlags, route: activeRoute, taskPlan, outputPlan, governancePlan, context: normalizedContext, attachmentNames: Object.freeze(attachmentNames) });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.detectPromptRiskFlags = detectRiskFlags;
  window.GovPromptCore.createGovernmentPrompt = createGovernmentPrompt;
})();
