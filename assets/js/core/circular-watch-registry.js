(() => {
  'use strict';
  // Offline, read-only registry: it never claims to have checked live government websites.
  const STATUSES = Object.freeze(['current', 'amended', 'repealed', 'superseded', 'unknown']);
  const REVIEW = Object.freeze(['pending', 'approved', 'rejected']);
  const normalize = value => String(value ?? '').trim();
  const key = value => normalize(value).normalize('NFKC').toLocaleLowerCase('th');
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
    const verifiedAt = normalize(raw.lastVerifiedAt);
    if (verifiedAt && Number.isNaN(Date.parse(verifiedAt))) throw new TypeError('Invalid verification timestamp');
    return Object.freeze({
      id, documentTitle: title, issuingAgency: agency, documentNumber: number,
      documentDate: date(raw.documentDate), effectiveDate: date(raw.effectiveDate),
      category: normalize(raw.category), keywords: Object.freeze(unique(raw.keywords)),
      sourceUrl: url.href, status, reviewStatus, lastVerifiedAt: verifiedAt,
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
      const identity = [key(record.issuingAgency), key(record.documentNumber)].join('|');
      if (ids.has(record.id) || identities.has(identity)) throw new TypeError('Duplicate circular ID or agency/document number');
      ids.add(record.id); identities.add(identity);
    }
    const byId = new Map(records.map(r => [r.id, r]));
    function search(query = '', options = {}) {
      const needle = key(query), category = key(options.category), agency = key(options.agency);
      const offset = Math.max(0, Math.trunc(Number(options.offset) || 0));
      const limit = Math.min(100, Math.max(1, Math.trunc(Number(options.limit) || 20)));
      const matches = records.filter(r => (!category || key(r.category) === category)
        && (!agency || key(r.issuingAgency) === agency)
        && (!needle || [r.documentNumber, r.documentTitle, r.issuingAgency, r.category, ...r.keywords]
          .some(field => key(field).includes(needle))));
      return Object.freeze({ total: matches.length, items: Object.freeze(matches.slice(offset, offset + limit)) });
    }
    function assess(id, asOf = new Date().toISOString().slice(0, 10)) {
      const r = byId.get(normalize(id));
      if (!r) return Object.freeze({ decision: 'NOT_FOUND', conclusionEligible: false });
      const today = date(asOf);
      const related = records.filter(other => other.supersedesDocumentId === r.id
        || other.repealedBy.includes(r.id) || other.amendedBy.includes(r.id));
      const issues = [];
      if (r.reviewStatus !== 'approved') issues.push('HUMAN_REVIEW_REQUIRED');
      if (!r.lastVerifiedAt) issues.push('VERIFICATION_DATE_MISSING');
      if (!r.evidence.length) issues.push('EVIDENCE_MISSING');
      if (r.status === 'unknown') issues.push('VERSION_UNKNOWN');
      if (r.effectiveDate && r.effectiveDate > today) issues.push('NOT_YET_EFFECTIVE');
      if (r.status === 'repealed' || r.status === 'superseded') issues.push('NOT_CURRENT');
      if (related.length) issues.push('RELATED_VERSION_REQUIRES_REVIEW');
      // "Approved" is only an internal review flag; no claim of live source verification.
      return Object.freeze({
        decision: issues.length ? 'DECISION_LOCK' : 'REVIEWED_RECORD',
        conclusionEligible: issues.length === 0,
        verifiedLatest: false,
        checkedLive: false,
        issues: Object.freeze(issues),
        record: r
      });
    }
    return Object.freeze({ records, get: id => byId.get(normalize(id)), search, assess });
  }
  const api = Object.freeze({ STATUSES, REVIEW, normalizeRecord, createCircularRegistry });
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (typeof window === 'object') {
    window.GovPromptCore = window.GovPromptCore || {};
    window.GovPromptCore.CircularWatch = api;
  }
})();
