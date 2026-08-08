(() => {
  'use strict';

  function text(value) { return String(value ?? '').trim(); }
  function dateValue(value) {
    const normalized = text(value);
    if (!normalized) return Number.NEGATIVE_INFINITY;
    const date = new Date(`${normalized}T00:00:00.000Z`);
    return Number.isNaN(date.getTime()) ? Number.NEGATIVE_INFINITY : date.getTime();
  }
  function verifiedValue(value) {
    const normalized = text(value);
    if (!normalized) return Number.NEGATIVE_INFINITY;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? Number.NEGATIVE_INFINITY : date.getTime();
  }

  function familyKey(record) {
    return [
      text(record.documentNumber || record.reference) || text(record.documentTitle || record.title),
      text(record.issuingAgency || record.agency),
      text(record.category || record.sourceType || record.documentType)
    ].join('|').normalize('NFKC').toLocaleLowerCase();
  }

  function statusRank(status) {
    return ({ current: 5, amended: 3, unknown: 2, superseded: 1, repealed: 0 })[text(status).toLowerCase()] ?? 2;
  }

  function relationshipIds(record) {
    return new Set([
      text(record.supersedesDocumentId),
      text(record.supersededByDocumentId),
      ...(Array.isArray(record.amendedBy) ? record.amendedBy.map(text) : []),
      ...(Array.isArray(record.repealedBy) ? record.repealedBy.map(text) : [])
    ].filter(Boolean));
  }

  function compareFreshness(left, right) {
    const leftPriority = window.GovPromptCore.sourcePriority ? window.GovPromptCore.sourcePriority(left).priority : 0;
    const rightPriority = window.GovPromptCore.sourcePriority ? window.GovPromptCore.sourcePriority(right).priority : 0;
    return statusRank(right.status) - statusRank(left.status)
      || dateValue(right.effectiveDate || right.documentDate) - dateValue(left.effectiveDate || left.documentDate)
      || dateValue(right.documentDate || right.effectiveDate) - dateValue(left.documentDate || left.effectiveDate)
      || verifiedValue(right.lastVerifiedAt) - verifiedValue(left.lastVerifiedAt)
      || rightPriority - leftPriority
      || text(left.id).localeCompare(text(right.id));
  }

  function resolveFreshness(records = [], { asOf = new Date() } = {}) {
    const reference = asOf instanceof Date ? asOf : new Date(asOf);
    if (Number.isNaN(reference.getTime())) throw new TypeError('Invalid freshness reference date');
    const byId = new Map(records.map(record => [text(record.id), record]));
    const eligible = records.filter(record => {
      const effective = dateValue(record.effectiveDate || record.documentDate);
      return effective === Number.NEGATIVE_INFINITY || effective <= reference.getTime();
    });

    const invalidated = new Set();
    eligible.forEach(record => {
      if (text(record.status).toLowerCase() === 'repealed' || text(record.status).toLowerCase() === 'superseded') invalidated.add(text(record.id));
      const supersedesId = text(record.supersedesDocumentId);
      if (supersedesId) invalidated.add(supersedesId);
      (Array.isArray(record.repealedBy) ? record.repealedBy : []).forEach(id => {
        if (byId.has(text(id))) invalidated.add(text(record.id));
      });
    });

    const groups = new Map();
    eligible.forEach(record => {
      const key = familyKey(record);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(record);
    });

    const current = [];
    const rejected = [];
    for (const group of groups.values()) {
      const sorted = [...group].sort(compareFreshness);
      const chosen = sorted.find(record => !invalidated.has(text(record.id))) || sorted[0];
      if (chosen) current.push(chosen);
      sorted.filter(record => record !== chosen).forEach(record => rejected.push(Object.freeze({
        record,
        reason: invalidated.has(text(record.id)) ? 'superseded-or-repealed' : 'older-than-selected-record'
      })));
    }

    const unresolved = current.filter(record => {
      const status = text(record.status).toLowerCase();
      return status === 'unknown' || !text(record.lastVerifiedAt);
    });

    return Object.freeze({
      current: Object.freeze(current.sort(compareFreshness)),
      rejected: Object.freeze(rejected),
      unresolved: Object.freeze(unresolved),
      verifiedCurrent: unresolved.length === 0 && current.length > 0,
      warning: unresolved.length
        ? 'ยังไม่ยืนยันว่าเป็นข้อมูลปัจจุบันล่าสุด — ยังไม่ควรฟันธง'
        : current.length ? '' : 'ไม่พบเอกสารที่มีผล ณ วันที่ตรวจสอบ'
    });
  }

  function selectBestCurrent(records = [], options = {}) {
    const resolved = resolveFreshness(records, options);
    const ranked = [...resolved.current].sort((left, right) => {
      const sourceDiff = (window.GovPromptCore.sourcePriority?.(right).priority ?? 0) - (window.GovPromptCore.sourcePriority?.(left).priority ?? 0);
      return sourceDiff || compareFreshness(left, right);
    });
    return Object.freeze({ ...resolved, best: ranked[0] || null });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    freshnessFamilyKey: familyKey,
    compareFreshness,
    resolveFreshness,
    selectBestCurrent
  });
})();
