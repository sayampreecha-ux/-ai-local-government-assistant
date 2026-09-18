(() => {
  'use strict';

  const DIMENSIONS = Object.freeze([
    'AUTHORITY',
    'VERSION',
    'TIME',
    'FACT_MATCH',
    'LATER_CHANGE',
    'CONFLICT_TRANSITION'
  ]);

  const LEGAL_DOMAINS = Object.freeze(['legal', 'procurement', 'finance', 'human-resources', 'internal-audit']);
  const DECISION_PATTERN = /(?:ได้ไหม|ได้หรือไม่|มีสิทธิ|ไม่มีสิทธิ|เบิกได้|เบิกไม่ได้|ทำได้|ทำไม่ได้|มีอำนาจ|อนุมัติได้|จ่ายได้|ชอบด้วย|ผิดกฎหมาย|ถูกกฎหมาย|ต้องคืน|เข้าข่าย|แต่งตั้ง|โอน|ย้าย)/i;

  const text = value => String(value ?? '').trim();
  const list = value => Array.isArray(value) ? value.filter(Boolean) : [];
  const hasPrimaryEvidence = evidence => list(evidence).some(item => item && item.primary === true && text(item.title) && text(item.url));
  const hasRequiredMetadata = item => Boolean(item && text(item.title) && text(item.issuingAgency) && text(item.documentDate) && text(item.url));

  function isDecisionQuestion(question = '') {
    return DECISION_PATTERN.test(text(question));
  }

  function normalizeEvidence(input = {}) {
    const source = input && typeof input === 'object' ? input : {};
    return {
      documents: list(source.documents),
      reviews: source.reviews && typeof source.reviews === 'object' ? source.reviews : {},
      conflicts: list(source.conflicts),
      factsComplete: source.factsComplete === true,
      authorityConfirmed: source.authorityConfirmed === true,
      versionConfirmed: source.versionConfirmed === true,
      timeConfirmed: source.timeConfirmed === true,
      factMatchConfirmed: source.factMatchConfirmed === true,
      laterChangeChecked: source.laterChangeChecked === true,
      conflictTransitionChecked: source.conflictTransitionChecked === true
    };
  }

  function checkApplicableAuthority(input = {}) {
    const question = text(input.question);
    const domain = text(input.domain).toLowerCase();
    const evidence = normalizeEvidence(input.evidence);
    const decisionQuestion = isDecisionQuestion(question) || LEGAL_DOMAINS.includes(domain);
    if (!decisionQuestion) {
      return Object.freeze({ mode: 'NONE', qualityStatus: 'NOT_APPLICABLE', decisionLock: 'OFF', missingChecks: [], reasons: [] });
    }

    const checks = {
      AUTHORITY: evidence.authorityConfirmed,
      VERSION: evidence.versionConfirmed,
      TIME: evidence.timeConfirmed,
      FACT_MATCH: evidence.factMatchConfirmed && evidence.factsComplete,
      LATER_CHANGE: evidence.laterChangeChecked,
      CONFLICT_TRANSITION: evidence.conflictTransitionChecked
    };
    const missingChecks = DIMENSIONS.filter(key => !checks[key]);
    const validPrimary = evidence.documents.filter(hasRequiredMetadata);
    const primaryReady = hasPrimaryEvidence(validPrimary);
    const unresolvedConflict = evidence.conflicts.some(item => item && item.resolved !== true);
    const decisionLock = !primaryReady || missingChecks.length > 0 || unresolvedConflict ? 'ON' : 'OFF';
    const qualityStatus = unresolvedConflict ? 'CONFLICT' : decisionLock === 'ON' ? 'UNVERIFIED' : 'VERIFIED';
    const reasons = [];
    if (!primaryReady) reasons.push('ยังไม่พบหลักฐานปฐมภูมิที่มี metadata และ URL ครบ');
    if (missingChecks.length) reasons.push(`ยังไม่ผ่าน Applicable Authority Check: ${missingChecks.join(', ')}`);
    if (unresolvedConflict) reasons.push('พบเอกสารหรือแนวทางที่ยังมีความขัดแย้งค้างอยู่');

    return Object.freeze({
      mode: 'FULL',
      qualityStatus,
      decisionLock,
      primaryEvidenceReady: primaryReady,
      missingChecks: Object.freeze(missingChecks),
      reasons: Object.freeze(reasons),
      dimensions: Object.freeze({ ...checks }),
      sourceCount: validPrimary.length
    });
  }

  function formatDecisionStatus(assessment) {
    if (!assessment || assessment.decisionLock === 'ON') return '🔎 หลักฐานยังไม่พอที่จะฟันธง';
    if (assessment.qualityStatus === 'CONFLICT') return '⚠️ พบความขัดแย้ง ต้องตรวจเพิ่ม';
    if (assessment.qualityStatus === 'VERIFIED') return '✅ ผ่านการตรวจหลักฐานตามข้อมูลที่มี';
    return '🔎 ต้องตรวจเพิ่ม';
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.EVIDENCE_FIRST_V8 = Object.freeze({
    DIMENSIONS,
    isDecisionQuestion,
    normalizeEvidence,
    checkApplicableAuthority,
    formatDecisionStatus
  });
})();
