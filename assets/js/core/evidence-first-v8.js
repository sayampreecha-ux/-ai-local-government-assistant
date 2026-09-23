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
  const hasPrimaryEvidence = evidence => list(evidence).some(item => item && item.primary === true && item.contentVerified === true && text(item.title) && text(item.url));
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
    if (!assessment) return '🔎 หลักฐานยังไม่พอที่จะฟันธง';
    if (assessment.qualityStatus === 'CONFLICT') return '⚠️ พบความขัดแย้ง ต้องตรวจเพิ่ม';
    if (assessment.decisionLock === 'ON') return '🔎 หลักฐานยังไม่พอที่จะฟันธง';
    if (assessment.qualityStatus === 'VERIFIED') return '✅ ผ่านการตรวจหลักฐานตามข้อมูลที่มี';
    return '🔎 ต้องตรวจเพิ่ม';
  }

  const ASSURANCE_VERSION = '8.1.0';
  const RETRIEVAL_LEVELS = Object.freeze([
    'LEVEL_1_DIRECT_FACT_SEARCH',
    'LEVEL_2_LEGAL_OFFICIAL_LANGUAGE_SEARCH',
    'LEVEL_3_PRECEDENT_INDEX_RECOVERY',
    'LEVEL_4_IDENTIFIER_CITATION_CHAINING'
  ]);
  const PRECEDENT_REQUIRED = Object.freeze(['issuingAuthority', 'documentNumber', 'documentDate', 'title', 'consultedFacts', 'adjudicatedIssue', 'citedRules', 'reasoning', 'conclusion', 'officialSource']);

  const normalize = value => text(value).normalize('NFKC').replace(/\\s+/g, ' ').trim();
  const sourceHost = value => { const raw = text(value); try { return new URL(raw).hostname.replace(/^www\\./, '').toLowerCase(); } catch { const schemeIndex = raw.indexOf('://'); const hostText = schemeIndex >= 0 ? raw.slice(schemeIndex + 3) : raw; return hostText.split('/')[0].split('?')[0].split('#')[0].replace(/^www\\./, '').toLowerCase(); } };

  function verifyPrimarySource(document = {}) {
    const host = sourceHost(document.url || document.source);
    const registry = window.GovPromptCore.matchOfficialSource?.(host);
    const officialHost = Boolean(registry && registry.tier === 'primary');
    const metadata = hasRequiredMetadata(document);
    const contentVerified = document.contentVerified === true;
    const result = Object.freeze({
      primary: officialHost && document.primary === true,
      officialHost,
      metadata,
      contentVerified,
      verified: officialHost && document.primary === true && metadata && contentVerified,
      sourceId: registry?.id || '',
      host
    });
    return result;
  }

  function checkLegalVersion(document = {}, allDocuments = [], asOf = new Date()) {
    const reference = asOf instanceof Date ? asOf : new Date(asOf);
    const effective = text(document.effectiveDate || document.documentDate);
    const notYetEffective = effective && !Number.isNaN(reference.getTime()) && new Date(effective) > reference;
    const repealed = document.status === 'repealed' || Boolean(document.repealedBy?.length);
    const superseded = document.status === 'superseded' || Boolean(document.supersededByDocumentId);
    const replacement = document.supersededByDocumentId ? allDocuments.find(d => text(d.id) === text(document.supersededByDocumentId)) : null;
    const transition = Array.isArray(document.transitionalProvisions) ? document.transitionalProvisions.length > 0 : Boolean(document.transitionalProvisions);
    return Object.freeze({
      checked: true,
      effectiveDate: effective,
      notYetEffective,
      repealed,
      superseded,
      replacementId: replacement?.id || '',
      transitionalProvisions: transition,
      currentCandidate: !notYetEffective && !repealed && !superseded
    });
  }

  function checkLaterRuleTransition(evidence = {}) {
    const later = list(evidence.laterRules || evidence.laterAuthorities);
    const transitions = list(evidence.transitions);
    const unresolved = [...later, ...transitions].some(item => item && item.resolved !== true);
    const checked = evidence.laterChangeChecked === true || evidence.laterRuleCheck === true;
    return Object.freeze({ checked, found: later.length > 0 || transitions.length > 0, unresolved, status: !checked ? 'NOT_CHECKED' : unresolved ? 'FOUND_UNRESOLVED' : later.length || transitions.length ? 'FOUND_RESOLVED' : 'CHECKED_NONE_FOUND' });
  }

  function checkOfficialPrecedent(evidence = {}) {
    const precedent = list(evidence.precedents || evidence.officialPrecedents);
    const verified = precedent.filter(item => item && item.verified === true && item.officialSource === true && PRECEDENT_REQUIRED.every(field => Boolean(item[field])));
    const unresolved = precedent.some(item => item && item.resolved !== true && item.verified !== true);
    const checked = evidence.precedentChecked === true || evidence.reviews?.officialPrecedent === true;
    const caseMatch = verified.length ? (verified.some(item => String(item.caseMatch || '').toUpperCase() === 'HIGH MATCH') ? 'HIGH MATCH' : 'MEDIUM MATCH') : 'LOW MATCH';
    return Object.freeze({ checked, found: precedent.length > 0, verifiedCount: verified.length, unresolved, caseMatch, status: !checked ? 'SEARCH_INCOMPLETE' : verified.length ? 'VERIFIED' : precedent.length ? 'FOUND_UNVERIFIED' : 'SEARCHED_NOT_FOUND' });
  }

  function buildEvidenceRetrievalPlan(question = '', context = {}) {
    const q = normalize(question);
    const identifiers = (q.match(/(?:มาตรา|ข้อ|เลขที่)\\s*[\\wก-๙./-]+/gi) || []).map(normalize);
    return Object.freeze({
      version: ASSURANCE_VERSION,
      levels: RETRIEVAL_LEVELS,
      query: q,
      identifiers: Object.freeze([...new Set(identifiers)]),
      subject: normalize(context.domain || context.subject || ''),
      primaryFirst: true,
      userSelectedAiExecution: true,
      searchable: true,
      decidable: false
    });
  }

  function caseFingerprint(question = '', context = {}, evidence = {}) {
    const payload = normalize([question, context.organizationType, context.domain, context.transactionType, context.currentStage, context.facts].join('|')).toLowerCase();
    let hash = 2166136261;
    for (let i = 0; i < payload.length; i += 1) { hash ^= payload.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    const evidenceIds = list(evidence.documents).map(item => normalize(item.id || item.documentNumber || item.title)).sort().join('|');
    let evidenceHash = 2166136261;
    for (let i = 0; i < evidenceIds.length; i += 1) { evidenceHash ^= evidenceIds.charCodeAt(i); evidenceHash = Math.imul(evidenceHash, 16777619); }
    return 'GPCASE-8.1-' + (hash >>> 0).toString(16).padStart(8, '0') + '-' + (evidenceHash >>> 0).toString(16).padStart(8, '0');
  }

  function buildAssuranceAssessment(input = {}) {
    const evidence = normalizeEvidence(input.evidence);
    const documents = evidence.documents;
    const primary = documents.map(verifyPrimarySource);
    const primaryReady = primary.some(item => item.verified);
    const versions = documents.map(document => checkLegalVersion(document, documents, input.asOf));
    const later = checkLaterRuleTransition(input.evidence || {});
    const precedent = checkOfficialPrecedent(input.evidence || {});
    const base = checkApplicableAuthority(input);
    const versionReady = versions.length === 0 ? false : versions.some(item => item.currentCandidate || item.transitionalProvisions);
    const laterReady = later.checked && !later.unresolved;
    const precedentRequired = Boolean(input.reliesOnPrecedent || evidence.precedentChecked || precedent.found);
    const precedentReady = !precedentRequired || (precedent.status === 'VERIFIED' && !precedent.unresolved);
    const decisionLock = base.decisionLock === 'ON' || !primaryReady || !versionReady || !laterReady || !precedentReady;
    const blockers = [];
    if (!primaryReady) blockers.push('PRIMARY_SOURCE_NOT_VERIFIED');
    if (!versionReady) blockers.push('LEGAL_VERSION_NOT_CONFIRMED');
    if (!laterReady) blockers.push('LATER_RULE_TRANSITION_NOT_CHECKED');
    if (!precedentReady) blockers.push('PRECEDENT_NOT_VERIFIED');
    return Object.freeze({
      version: ASSURANCE_VERSION,
      caseFingerprint: caseFingerprint(input.question, input.context, input.evidence),
      retrievalPlan: buildEvidenceRetrievalPlan(input.question, input.context),
      primarySourceVerification: Object.freeze({ verified: primaryReady, documents: Object.freeze(primary) }),
      legalVersion: Object.freeze({ verified: versionReady, documents: Object.freeze(versions) }),
      laterRuleTransition: later,
      precedent,
      authority: base,
      decisionLock: decisionLock ? 'ON' : 'OFF',
      blockers: Object.freeze(blockers),
      searchable: true,
      decidable: !decisionLock
    });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.EVIDENCE_FIRST_V8 = Object.freeze({
    DIMENSIONS,
    isDecisionQuestion,
    normalizeEvidence,
    checkApplicableAuthority,
    formatDecisionStatus,
    ASSURANCE_VERSION,
    RETRIEVAL_LEVELS,
    verifyPrimarySource,
    checkLegalVersion,
    checkLaterRuleTransition,
    checkOfficialPrecedent,
    buildEvidenceRetrievalPlan,
    caseFingerprint,
    buildAssuranceAssessment
  });
})();
