(() => {
  'use strict';

  const CONFIDENCE_LEVELS = Object.freeze(['high', 'medium', 'low']);

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeText(value) {
    return String(value ?? '').trim();
  }

  function verifySource(document) {
    const sourceURL = normalizeText(document.sourceURL || document.sourceUrl || document.source);
    try {
      const url = new URL(sourceURL);
      const official = url.protocol === 'https:' && (url.hostname === 'go.th' || url.hostname.endsWith('.go.th'));
      return deepFreeze({
        verified: official,
        sourceURL,
        reason: official ? 'official-government-domain' : 'source-is-not-an-official-https-government-domain'
      });
    } catch {
      return deepFreeze({ verified: false, sourceURL, reason: 'invalid-source-url' });
    }
  }

  function compareVersions(left, right) {
    return normalizeText(left).localeCompare(normalizeText(right), undefined, { numeric: true, sensitivity: 'base' });
  }

  function isEffective(document, asOf = new Date()) {
    const reference = asOf instanceof Date ? asOf : new Date(asOf);
    if (Number.isNaN(reference.getTime())) return false;
    const effectiveDate = normalizeText(document.effectiveDate || document.documentDate);
    if (!effectiveDate) return true;
    const effective = new Date(`${effectiveDate}T00:00:00.000Z`);
    return !Number.isNaN(effective.getTime()) && effective.getTime() <= reference.getTime();
  }

  function documentFamily(document) {
    return [
      document.agency || document.issuingAgency,
      document.title || document.documentTitle,
      document.reference || document.documentNumber || document.sourceUrl || document.source
    ]
      .map(normalizeText)
      .join('|')
      .toLowerCase();
  }

  function selectNewestEffectiveVersions(documents, asOf = new Date()) {
    const selected = new Map();
    documents.filter(document => isEffective(document, asOf)).forEach(document => {
      const key = documentFamily(document);
      const current = selected.get(key);
      const documentDate = normalizeText(document.effectiveDate || document.documentDate);
      const currentDate = normalizeText(current?.effectiveDate || current?.documentDate);
      if (!current
        || documentDate > currentDate
        || (documentDate === currentDate && compareVersions(document.version, current.version) > 0)) {
        selected.set(key, document);
      }
    });
    return Object.freeze([...selected.values()]);
  }

  function rejectObsoleteVersion(document, candidates, asOf = new Date()) {
    const newest = selectNewestEffectiveVersions(candidates, asOf)
      .find(candidate => documentFamily(candidate) === documentFamily(document));
    if (newest && newest.id !== document.id) {
      throw new RangeError(`Obsolete knowledge document version: ${document.id}`);
    }
    if (!isEffective(document, asOf)) throw new RangeError(`Knowledge document is not effective: ${document.id}`);
    return document;
  }

  function createCitation(document, { confidenceLevel, verify = true } = {}) {
    const sourceVerification = verifySource(document);
    if (verify && !sourceVerification.verified) throw new TypeError(`Unverified official source: ${document.id}`);
    const confidence = normalizeText(confidenceLevel) || (sourceVerification.verified ? 'high' : 'low');
    if (!CONFIDENCE_LEVELS.includes(confidence)) throw new TypeError('Invalid citation confidence level');
    const agency = normalizeText(document.agency || document.issuingAgency || document.sourceName);
    const reference = normalizeText(document.reference || document.documentNumber || document.sourceUrl || document.source);
    const title = normalizeText(document.title || document.documentTitle);
    const effectiveDate = normalizeText(document.effectiveDate || document.documentDate);
    const version = normalizeText(document.version);
    return deepFreeze({
      id: normalizeText(document.id),
      citationId: normalizeText(document.id),
      title,
      agency,
      effectiveDate,
      version,
      reference,
      officialReference: reference,
      sourceURL: sourceVerification.sourceURL,
      confidenceLevel: confidence,
      sourceVerified: sourceVerification.verified,
      label: `${title} (${agency}${reference ? `, ${reference}` : ''}${version ? `, ${version}` : ''})`
    });
  }

  function createCitations(documents, options = {}) {
    const selected = selectNewestEffectiveVersions(documents, options.asOf);
    return deepFreeze(selected.map(document => createCitation(document, options)));
  }

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.CONFIDENCE_LEVELS = CONFIDENCE_LEVELS;
  window.GovPromptCore.verifySource = verifySource;
  window.GovPromptCore.selectNewestEffectiveVersions = selectNewestEffectiveVersions;
  window.GovPromptCore.rejectObsoleteVersion = rejectObsoleteVersion;
  window.GovPromptCore.createCitation = createCitation;
  window.GovPromptCore.createCitations = createCitations;
})();
