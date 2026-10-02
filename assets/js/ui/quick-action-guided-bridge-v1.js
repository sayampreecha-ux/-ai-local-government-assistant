(() => {
  'use strict';
  const core = window.GovPromptCore = window.GovPromptCore || {};
  const generic = /^(?:(?:ช่วย|ขอ|ทำ|จัดทำ|ร่าง|ตรวจ|วิเคราะห์)\s*)*(?:tor\s*)?(?:gp223|จ้างเหมา(?:บริการ)?(?:บุคคลธรรมดา)?)(?:\s*tor)?(?:ครับ|ค่ะ)?$/i;
  const unrelated = /(?:เริ่มเรื่องใหม่|ยกเลิก|เปลี่ยนเรื่อง|จ้างก่อสร้าง|บริษัท|นิติบุคคล|ซื้อคอม|ซื้อรถ|ถนน|สะพาน|ค่าเช่าบ้าน|เงินบำรุง|ทำลายเอกสาร|น้ำท่วม|ร่างหนังสือ|หนังสือราชการ)/;
  const related = /(?:tor|ทีโออาร์|บัญชี|ธุรการ|คนขับ|ขับรถ|ทำความสะอาด|ภารโรง|ประปา|รักษาความปลอดภัย|สาธารณสุข|จ้าง|ผู้รับจ้าง|สัญญา|เบิก|ตรวจรับ|ส่งมอบ|ว\s*\d|เดินทาง|ประชุม|อบรม|ค่าปรับ|หลักประกัน|ค่าจ้าง|เวลางาน|ค้น|ตรวจสด)/i;

  function prepareGP223IntakeTurn({ text, state = null, attachments = [] } = {}) {
    const question = String(text || '').trim();
    const standalone = core.isGP223Request({ question });
    const continueCase = state?.workflowId === 'GP223' && !unrelated.test(question)
      && (related.test(question) || /^(?:ครับ|ค่ะ|ทำต่อ|ร่างต่อ|ทำให้เสร็จ|\d)/.test(question)
        || (state.awaitingScope && /^(?:งาน|สนับสนุน|ดูแล|บริการ|ไอที|นักการ|พยาบาล|ครู|นิติการ|สอน)/.test(question)));
    if (!standalone && !continueCase) return Object.freeze({ workflowId: null, state: null, question });
    const caseFacts = continueCase ? state.caseFacts : '';
    const facts = [caseFacts, question].filter(Boolean).join('\n');
    const needsScope = generic.test(question) && !caseFacts && attachments.length === 0;
    return Object.freeze({
      workflowId: 'GP223', question, caseFacts: facts,
      intakeQuestion: needsScope ? 'ต้องการจ้างให้ทำงานอะไรครับ? บอกลักษณะงานจริงที่มีได้เลย' : '',
      state: Object.freeze({ workflowId: 'GP223', caseFacts: facts, awaitingScope: needsScope })
    });
  }
  core.prepareGP223IntakeTurn = prepareGP223IntakeTurn;
})();
