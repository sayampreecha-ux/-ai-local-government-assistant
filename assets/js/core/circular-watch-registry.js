(() => {
  'use strict';
  // Offline, read-only registry: it never claims to have checked live government websites.
  const STATUSES = Object.freeze(['current', 'amended', 'repealed', 'superseded', 'unknown']);
  const LIFECYCLE = Object.freeze(['DISCOVERED', 'STAGED', 'VERIFIED', 'PUBLISHED']);
  const officialUrl = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password && !u.port && ['dla.go.th','www.dla.go.th','moi.go.th','cmsmoi.moi.go.th','ratchakitcha.soc.go.th'].includes(u.hostname); } catch { return false; }
  };
  const REVIEW = Object.freeze(['pending', 'approved', 'rejected']);
  const normalize = value => String(value ?? '').trim();
  const key = value => normalize(value).normalize('NFKC').toLocaleLowerCase('th');
  const numberKey = value => key(value).replace(/[๐-๙]/g, digit => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(digit))).replace(/[\s\u200b-\u200d\ufeff]/g, '');
  const date = value => {
    const s = normalize(value);
    if (!s) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) throw new TypeError('Expected YYYY-MM-DD');
    const d = new Date(s + 'T00:00:00Z');
    if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() + 1 !== +m[2] || d.getUTCDate() !== +m[3]) throw new TypeError('Invalid calendar date');
    return s;
  };
  const unique = a => [...new Set((Array.isArray(a) ? a : []).map(normalize).filter(Boolean))];
  function normalizeRecord(raw) {
    if (!raw || typeof raw !== 'object') throw new TypeError('Record must be an object');
    const id = normalize(raw.id), title = normalize(raw.documentTitle || raw.title);
    const agency = normalize(raw.issuingAgency || raw.agency);
    const number = normalize(raw.documentNumber || raw.reference);
    const sourceUrl = normalize(raw.sourceUrl || raw.sourceURL || raw.source);
    if (!id || !title || !agency || !number || !sourceUrl) throw new TypeError('Missing circular registry identity fields');
    let url;
    try { url = new URL(sourceUrl); } catch { throw new TypeError('Invalid source URL'); }
    if (url.protocol !== 'https:' || url.username || url.password) throw new TypeError('Source must be a public HTTPS URL');
    const status = key(raw.status || 'unknown'), reviewStatus = key(raw.reviewStatus || 'pending');
    if (!STATUSES.includes(status) || !REVIEW.includes(reviewStatus)) throw new TypeError('Invalid status');
    const publicationStatus = normalize(raw.publicationStatus || 'DISCOVERED');
    if (!LIFECYCLE.includes(publicationStatus)) throw new TypeError('Invalid publication status');
    const documentSha256 = normalize(raw.documentSha256).toLowerCase();
    if (documentSha256 && !/^[a-f0-9]{64}$/.test(documentSha256)) throw new TypeError('Invalid document SHA256');
    const verifiedAt = normalize(raw.lastVerifiedAt);
    if (verifiedAt && Number.isNaN(Date.parse(verifiedAt))) throw new TypeError('Invalid verification timestamp');
    return Object.freeze({
      id, documentTitle: title, issuingAgency: agency, documentNumber: number,
      documentDate: date(raw.documentDate), effectiveDate: date(raw.effectiveDate),
      category: normalize(raw.category), keywords: Object.freeze(unique(raw.keywords)),
      sourceUrl: url.href, status, reviewStatus, publicationStatus, documentSha256, lastVerifiedAt: verifiedAt,
      discoveredAt: normalize(raw.discoveredAt), discoveryMethod: normalize(raw.discoveryMethod),
      authorityEvidence: normalize(raw.authorityEvidence), versionEvidence: normalize(raw.versionEvidence),
      supersedesDocumentId: normalize(raw.supersedesDocumentId),
      supersededByDocumentId: normalize(raw.supersededByDocumentId),
      amendedBy: Object.freeze(unique(raw.amendedBy)), repealedBy: Object.freeze(unique(raw.repealedBy)),
      evidence: Object.freeze(unique(raw.evidence)), contentExcerpt: normalize(raw.contentExcerpt),
      excerptLocator: normalize(raw.excerptLocator)
    });
  }
  function createCircularRegistry(inputs = []) {
    if (!Array.isArray(inputs)) throw new TypeError('Expected registry records array');
    const records = Object.freeze(inputs.map(normalizeRecord));
    const ids = new Set(), identities = new Set();
    for (const record of records) {
      const identity = [key(record.issuingAgency), numberKey(record.documentNumber)].join('|');
      if (ids.has(record.id) || identities.has(identity)) throw new TypeError('Duplicate circular ID or agency/document number');
      ids.add(record.id); identities.add(identity);
    }
    const byId = new Map(records.map(r => [r.id, r]));
    function search(query = '', options = {}) {
      const needle = key(query), category = key(options.category), agency = key(options.agency);
      const rawYear = normalize(options.year);
      const year = /^\d{4}$/.test(rawYear) && +rawYear >= 2400 ? String(+rawYear - 543) : rawYear, status = key(options.status);
      const offset = Math.max(0, Math.trunc(Number(options.offset) || 0));
      const limit = Math.min(100, Math.max(1, Math.trunc(Number(options.limit) || 20)));
      const matches = records.filter(r => (!category || key(r.category) === category)
        && (!agency || key(r.issuingAgency) === agency)
        && (!status || r.status === status)
        && (!year || r.documentDate.startsWith(year + '-'))
        && (!needle || [r.documentNumber, r.documentTitle, r.issuingAgency, r.category, ...r.keywords]
          .some(field => key(field).includes(needle))));
      return Object.freeze({ total: matches.length, items: Object.freeze(matches.slice(offset, offset + limit)) });
    }
    function assess(id, asOf = new Date().toISOString().slice(0, 10)) {
      const r = byId.get(normalize(id));
      if (!r) return Object.freeze({ decision: 'NOT_FOUND', conclusionEligible: false });
      const today = date(asOf);
      const related = records.filter(other => other.id !== r.id && (
        other.supersedesDocumentId === r.id || other.supersededByDocumentId === r.id
        || other.amendedBy.includes(r.id) || other.repealedBy.includes(r.id)
        || r.supersededByDocumentId === other.id || r.amendedBy.includes(other.id)
        || r.repealedBy.includes(other.id)));
      const issues = [];
      if (r.reviewStatus !== 'approved') issues.push('HUMAN_REVIEW_REQUIRED');
      if (!r.lastVerifiedAt) issues.push('VERIFICATION_DATE_MISSING');
      if (!r.evidence.length) issues.push('EVIDENCE_MISSING');
      if (r.status === 'unknown') issues.push('VERSION_UNKNOWN');
      if (r.effectiveDate && r.effectiveDate > today) issues.push('NOT_YET_EFFECTIVE');
      if (r.status === 'repealed' || r.status === 'superseded') issues.push('NOT_CURRENT');
      if ([r.supersededByDocumentId, ...r.amendedBy, ...r.repealedBy].some(Boolean)) issues.push('DECLARED_VERSION_RELATION_REQUIRES_REVIEW');
      if (related.length) issues.push('RELATED_VERSION_REQUIRES_REVIEW');
      // "Approved" is only an internal review flag; no claim of live source verification.
      return Object.freeze({
        decision: issues.length ? 'DECISION_LOCK' : 'REVIEWED_RECORD',
        // A reviewed offline record is not sufficient evidence for a legal conclusion.
        conclusionEligible: false,
        verifiedLatest: false,
        checkedLive: false,
        issues: Object.freeze(issues),
        record: r
      });
    }
    return Object.freeze({ records, get: id => byId.get(normalize(id)), search, assess });
  }
  const identity = r => [key(r.issuingAgency), numberKey(r.documentNumber)].join('|');
  function candidateIssues(record) {
    const issues = [];
    if (!officialUrl(record.sourceUrl)) issues.push('OFFICIAL_SOURCE_NOT_VERIFIED');
    if (!record.documentDate) issues.push('DOCUMENT_DATE_REQUIRED');
    if (!record.evidence.length || !record.excerptLocator) issues.push('EVIDENCE_REQUIRED');
    if (!record.documentSha256) issues.push('ORIGINAL_DOCUMENT_HASH_REQUIRED');
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(record.lastVerifiedAt) || !Number.isFinite(Date.parse(record.lastVerifiedAt))) issues.push('ORIGINAL_NOT_VERIFIED');
    if (!record.authorityEvidence) issues.push('AUTHORITY_REVIEW_REQUIRED');
    if (!record.versionEvidence || record.status === 'unknown') issues.push('VERSION_REVIEW_REQUIRED');
    if (['repealed','amended','superseded'].includes(record.status) && ![record.supersedesDocumentId, record.supersededByDocumentId, ...record.amendedBy, ...record.repealedBy].some(Boolean)) issues.push('VERSION_RELATION_EVIDENCE_REQUIRED');
    return issues;
  }
  function stageReviewQueue(input, current = [], stagedAt = new Date().toISOString()) {
    if (!Array.isArray(input) || input.length > 5000) throw new TypeError('Expected <=5000 records');
    if (input.some(r => r?.reviewStatus === 'approved' || ['VERIFIED','PUBLISHED'].includes(r?.publicationStatus))) throw new TypeError('Approval or publication cannot be imported');
    const candidates = createCircularRegistry(input).records;
    if (candidates.some(r => r.reviewStatus === 'approved' || ['VERIFIED','PUBLISHED'].includes(r.publicationStatus))) throw new TypeError('Approval or publication cannot be imported');
    const baselineVerified = current !== null;
    const existing = new Map(createCircularRegistry(current || []).records.map(r => [identity(r), r]));
    const entries = candidates.map(record => {
      const old = existing.get(identity(record));
      // Lifecycle and review flags are not document changes. Evidence/content/hash changes are.
      const fingerprint = r => JSON.stringify({...r, publicationStatus: '', reviewStatus: '', discoveredAt: ''});
      const change = !baselineVerified ? 'BASELINE_NOT_VERIFIED' : !old ? 'NEW' : fingerprint(old) === fingerprint(record) ? 'UNCHANGED' : 'CHANGED_REVIEW_REQUIRED';
      const issues = candidateIssues(record);
      if (!baselineVerified) issues.push('BASELINE_NOT_VERIFIED');
      if (change === 'CHANGED_REVIEW_REQUIRED') issues.push('VERSION_CONFLICT_REQUIRES_REVIEW');
      const lifecycle = issues.length ? 'DISCOVERED' : 'STAGED';
      return { change, documentId: record.id, lifecycle, record: {...record, reviewStatus: 'pending', publicationStatus: lifecycle},
        issues, decision: 'DECISION_LOCK', publishable: false };
    });
    return {schemaVersion: '1.0', purpose: 'LOCAL_REVIEW_ONLY', publishable: false, stagedAt,
      warning: 'Local review queue only. No authenticated approval, latest-version assertion or publication.',
      summary: Object.fromEntries(['NEW','UNCHANGED','CHANGED_REVIEW_REQUIRED','BASELINE_NOT_VERIFIED'].map(x => [x, entries.filter(e => e.change === x).length])),
      lifecycleCounts: Object.fromEntries(LIFECYCLE.map(x => [x, entries.filter(e => e.lifecycle === x).length])), entries};
  }
  const isPublishedRecord = r => r.publicationStatus === 'PUBLISHED' && r.reviewStatus === 'approved' && candidateIssues(r).length === 0;
  const api = Object.freeze({ STATUSES, REVIEW, LIFECYCLE, officialUrl, candidateIssues, stageReviewQueue, isPublishedRecord, normalizeRecord, createCircularRegistry });
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window === 'object') {
    window.GovPromptCore = window.GovPromptCore || {};
    window.GovPromptCore.CircularWatch = api;
  }
})();
