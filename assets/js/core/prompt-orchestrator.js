(() => {
  'use strict';

  const HIGH_RISK_TERMS = Object.freeze([
    'กฎหมาย', 'ระเบียบ', 'หนังสือเวียน', 'หนังสือสั่งการ', 'ข้อหารือ', 'ซักซ้อม',
    'พัสดุ', 'จัดซื้อ', 'จัดจ้าง', 'tor', 'ราคากลาง', 'เบิก', 'งบประมาณ', 'วินัย',
    'คำพิพากษา', 'ศาล', 'ป.ป.ช.', 'สตง.', 'ข้อมูลส่วนบุคคล', 'pdpa'
  ]);

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

  function createGovernmentPrompt({ question, route, context, attachments = [] } = {}) {
    const userQuestion = normalizeText(question);
    if (!userQuestion) throw new TypeError('question must be a non-empty string');
    if (!route?.moduleId || !route?.assistant) throw new TypeError('a routed GovPrompt module is required');

    const normalizedContext = window.GovPromptCore.createSharedContext(context || { facts: userQuestion, desiredOutput: userQuestion });
    const attachmentNames = (Array.isArray(attachments) ? attachments : [])
      .map(item => normalizeText(item?.name || item))
      .filter(Boolean);
    const riskFlags = detectRiskFlags([userQuestion, ...attachmentNames].join(' '));
    const relatedModules = Array.isArray(route.modules) && route.modules.length ? route.modules.join(', ') : route.moduleId;
    const outputPlan = typeof window.GovPromptCore.routeOutput === 'function'
      ? window.GovPromptCore.routeOutput(userQuestion, route, normalizedContext)
      : Object.freeze({ id: 'default', label: 'คำตอบพร้อมใช้', format: 'answer-first', instructions: Object.freeze([]), confidence: 0.5, reason: 'fallback' });
    const governancePlan = typeof window.GovPromptCore.evaluateAgentGovernance === 'function'
      ? window.GovPromptCore.evaluateAgentGovernance(userQuestion)
      : Object.freeze({ requestedLevel: 'L3', effectiveLevel: 'L3', allowed: true, requiresHumanApproval: false, blockers: Object.freeze([]) });

    const prompt = [
      'บทบาท',
      `คุณเป็น Government AI Copilot สำหรับงานราชการไทย โดยใช้ผู้ช่วยหลัก ${route.moduleId} — ${route.assistant.title}`,
      '',
      'คำถามจากผู้ใช้',
      userQuestion,
      '',
      'บริบทที่ GovPrompt จัดให้',
      `- หมวดหลัก: ${route.moduleId} — ${route.assistant.title}`,
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
      '2. หากข้อมูลสำคัญไม่ครบ ให้ตอบเบื้องต้นเท่าที่หลักฐานรองรับ แล้วถามเพิ่มเฉพาะข้อมูลที่มีผลต่อคำตอบจริง',
      '3. แยกข้อเท็จจริง ข้อมูลที่ขาด ประเด็น ฐานอำนาจ/กฎหมาย การวิเคราะห์ ความเสี่ยง และข้อเสนอแนะให้ชัดเจน',
      '4. ห้ามสมมติเลขมาตรา เลขหนังสือ วันที่ คำพิพากษา ชื่อบุคคล หรือ URL',
      '5. สำหรับระเบียบ หนังสือสั่งการ หนังสือหารือ หนังสือซักซ้อม แนววินิจฉัย และคำพิพากษา ให้ตรวจฉบับปัจจุบันล่าสุดก่อนใช้เสมอ',
      '6. ค้นหาเอกสารที่เกี่ยวข้องทั้งหมด เรียงตามวันที่ ตรวจฉบับแก้ไข/ยกเลิก/ฉบับใหม่กว่า แล้วเลือกฉบับที่ยังมีผลและใหม่ที่สุด',
      '7. ยึดแหล่งปฐมภูมิทางราชการก่อน เช่น ราชกิจจานุเบกษา กฤษฎีกา กรมบัญชีกลาง กระทรวงมหาดไทย สถ. สำนักงบประมาณ ศาล ป.ป.ช. ป.ป.ท. และ สตง.',
      '8. บทความ อินโฟกราฟิก Facebook หรือเว็บไซต์สรุป ใช้เป็นเบาะแสในการค้นเท่านั้น ห้ามใช้ฟันธงโดยไม่มีต้นฉบับรองรับ',
      '9. ถ้ายังยืนยันความเป็นฉบับล่าสุดไม่ได้ ให้ระบุชัดว่า “ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง”',
      '10. ตรวจ PDPA ข้อมูลอ่อนไหว และข้อมูลลับก่อนแสดงหรือใช้ข้อมูลที่ไม่จำเป็น',
      '11. ให้คำตอบแบบ Answer First ก่อน แล้วตามด้วยเหตุผล ฐานอำนาจ ความเสี่ยง และขั้นตอนปฏิบัติ',
      '12. หากงานสามารถต่อยอดได้ ให้จัดทำผลลัพธ์พร้อมใช้ เช่น หนังสือราชการ บันทึก Checklist ตาราง CSV JSON หรือสรุปผู้บริหาร โดยไม่แต่งข้อเท็จจริงเพิ่ม',
      '',
      'สถานะความเสี่ยงเบื้องต้นจาก GovPrompt',
      riskFlags.length ? riskFlags.map(flag => `- ${flag}`).join('\n') : '- ไม่พบสัญญาณความเสี่ยงจากข้อความเบื้องต้น แต่ยังต้องตรวจทานก่อนใช้จริง',
      '',
      'ข้อกำหนดผลลัพธ์',
      `- ส่งผลลัพธ์หลักในรูปแบบ “${outputPlan.label}” ตามที่ Output Router เลือก เว้นแต่ผู้ใช้สั่งรูปแบบอื่นชัดเจน`,
      '- ใช้ภาษาไทยชัดเจน เข้าใจง่าย และเหมาะกับการปฏิบัติราชการ',
      '- อ้างแหล่งที่มาต่อข้อความสำคัญเมื่อสามารถตรวจสอบต้นฉบับได้',
      '- แยกสิ่งที่ยืนยันแล้วออกจากข้อวิเคราะห์หรือสิ่งที่ยังต้องตรวจสอบ',
      '- AI ช่วยค้น ช่วยคิด ช่วยร่าง แต่ผู้ใช้เป็นผู้ตรวจสอบและตัดสินใจก่อนนำไปใช้จริง'
    ].join('\n');

    return Object.freeze({ prompt, riskFlags, route, outputPlan, governancePlan, context: normalizedContext, attachmentNames: Object.freeze(attachmentNames) });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.detectPromptRiskFlags = detectRiskFlags;
  window.GovPromptCore.createGovernmentPrompt = createGovernmentPrompt;
})();
