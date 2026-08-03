(() => {
  'use strict';

  const DEFAULT_CONTEXT = Object.freeze({
    organizationType: '',
    owningUnit: '',
    domain: '',
    currentStage: '',
    transactionType: '',
    fundingSource: '',
    facts: '',
    documents: '',
    specialFlags: [],
    desiredOutput: ''
  });

  function normalizeText(value) {
    return String(value ?? '').trim();
  }

  function normalizeFlags(value) {
    if (Array.isArray(value)) return [...new Set(value.map(normalizeText).filter(Boolean))];
    return normalizeText(value)
      .split(/[\n,;|]+/)
      .map(normalizeText)
      .filter(Boolean);
  }

  function createSharedContext(input = {}) {
    return {
      ...DEFAULT_CONTEXT,
      organizationType: normalizeText(input.organizationType),
      owningUnit: normalizeText(input.owningUnit),
      domain: normalizeText(input.domain),
      currentStage: normalizeText(input.currentStage),
      transactionType: normalizeText(input.transactionType),
      fundingSource: normalizeText(input.fundingSource),
      facts: normalizeText(input.facts),
      documents: normalizeText(input.documents),
      specialFlags: normalizeFlags(input.specialFlags),
      desiredOutput: normalizeText(input.desiredOutput)
    };
  }

  function contextToText(context) {
    const c = createSharedContext(context);
    return [
      'บริบทกลางของงานท้องถิ่น',
      `- ประเภท อปท./หน่วยงาน: ${c.organizationType || '[ยังไม่ได้ระบุ]'}`,
      `- หน่วยงานเจ้าของเรื่อง: ${c.owningUnit || '[ยังไม่ได้ระบุ]'}`,
      `- ภารกิจ/โดเมน: ${c.domain || '[ยังไม่ได้ระบุ]'}`,
      `- ขั้นตอนปัจจุบัน: ${c.currentStage || '[ยังไม่ได้ระบุ]'}`,
      `- ประเภทธุรกรรมที่ทราบ: ${c.transactionType || '[ยังไม่ได้ระบุ]'}`,
      `- แหล่งเงิน: ${c.fundingSource || '[ยังไม่ได้ระบุ]'}`,
      `- เอกสารที่มี: ${c.documents || '[ยังไม่ได้ระบุ]'}`,
      `- กรณีพิเศษ: ${c.specialFlags.length ? c.specialFlags.join(', ') : '[ไม่มี/ยังไม่ได้ระบุ]'}`,
      `- ผลลัพธ์ที่ต้องการ: ${c.desiredOutput || '[ยังไม่ได้ระบุ]'}`
    ].join('\n');
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.createSharedContext = createSharedContext;
  window.GovPromptCore.contextToText = contextToText;
})();