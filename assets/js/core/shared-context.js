(() => {
  'use strict';

  const CONTEXT_FIELDS = Object.freeze([
    'organizationType',
    'owningUnit',
    'domain',
    'currentStage',
    'transactionType',
    'fundingSource',
    'facts',
    'documents',
    'specialFlags',
    'desiredOutput'
  ]);

  const DEFAULT_CONTEXT = Object.freeze({
    organizationType: '',
    owningUnit: '',
    domain: '',
    currentStage: '',
    transactionType: '',
    fundingSource: '',
    facts: '',
    documents: '',
    specialFlags: Object.freeze([]),
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
    const source = input && typeof input === 'object' ? input : {};

    return {
      ...DEFAULT_CONTEXT,
      organizationType: normalizeText(source.organizationType),
      owningUnit: normalizeText(source.owningUnit),
      domain: normalizeText(source.domain),
      currentStage: normalizeText(source.currentStage),
      transactionType: normalizeText(source.transactionType),
      fundingSource: normalizeText(source.fundingSource),
      facts: normalizeText(source.facts),
      documents: normalizeText(source.documents),
      specialFlags: normalizeFlags(source.specialFlags),
      desiredOutput: normalizeText(source.desiredOutput)
    };
  }

  function getMissingContextFields(context) {
    const normalized = createSharedContext(context);
    return CONTEXT_FIELDS.filter(field => {
      const value = normalized[field];
      return Array.isArray(value) ? value.length === 0 : value === '';
    });
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
  window.GovPromptCore.CONTEXT_FIELDS = CONTEXT_FIELDS;
  window.GovPromptCore.DEFAULT_CONTEXT = DEFAULT_CONTEXT;
  window.GovPromptCore.createSharedContext = createSharedContext;
  window.GovPromptCore.getMissingContextFields = getMissingContextFields;
  window.GovPromptCore.contextToText = contextToText;
})();
