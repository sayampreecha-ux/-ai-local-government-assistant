(() => {
  'use strict';

  const DOCUMENT_STATUSES = Object.freeze(['current', 'amended', 'repealed', 'superseded', 'unknown']);
  const SOURCE_LEVELS = Object.freeze(['primary', 'secondary', 'unknown']);
  const METADATA_FIELDS = Object.freeze([
    'id', 'documentTitle', 'documentNumber', 'documentDate', 'issuingAgency', 'category',
    'keywords', 'sourceUrl', 'sourceType', 'sourceLevel', 'effectiveDate', 'status',
    'supersedesDocumentId', 'supersededByDocumentId', 'amendedBy', 'repealedBy',
    'lastVerifiedAt', 'relatedWorkflows', 'notes'
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function text(value) { return String(value ?? '').trim(); }
  function list(value) {
    const values = Array.isArray(value) ? value : text(value).split(/[\n,;|]+/);
    return [...new Set(values.map(text).filter(Boolean))];
  }
  function isoDate(value) {
    const normalized = text(value);
    if (!normalized) return '';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
    if (!match) throw new TypeError(`Invalid ISO date: ${normalized}`);
    const date = new Date(`${normalized}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid ISO date: ${normalized}`);
    return normalized;
  }
  function isoDateTime(value) {
    const normalized = text(value);
    if (!normalized) return '';
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid ISO datetime: ${normalized}`);
    return date.toISOString();
  }

  function createKnowledgeMetadata(input = {}) {
    const id = text(input.id);
    const documentTitle = text(input.documentTitle || input.title);
    const issuingAgency = text(input.issuingAgency || input.agency);
    const sourceUrl = text(input.sourceUrl || input.sourceURL || input.source);
    if (!id || !documentTitle || !issuingAgency || !sourceUrl) {
      throw new TypeError('Knowledge metadata requires id, documentTitle, issuingAgency and sourceUrl');
    }

    const status = text(input.status || 'unknown').toLowerCase();
    const sourceLevel = text(input.sourceLevel || 'unknown').toLowerCase();
    if (!DOCUMENT_STATUSES.includes(status)) throw new TypeError(`Invalid document status: ${status}`);
    if (!SOURCE_LEVELS.includes(sourceLevel)) throw new TypeError(`Invalid source level: ${sourceLevel}`);

    return deepFreeze({
      id,
      documentTitle,
      documentNumber: text(input.documentNumber || input.reference),
      documentDate: isoDate(input.documentDate || input.effectiveDate),
      issuingAgency,
      category: text(input.category),
      keywords: list(input.keywords),
      sourceUrl,
      sourceType: text(input.sourceType || input.documentType || input.category),
      sourceLevel,
      effectiveDate: isoDate(input.effectiveDate || input.documentDate),
      status,
      supersedesDocumentId: text(input.supersedesDocumentId),
      supersededByDocumentId: text(input.supersededByDocumentId),
      amendedBy: list(input.amendedBy),
      repealedBy: list(input.repealedBy),
      lastVerifiedAt: isoDateTime(input.lastVerifiedAt),
      relatedWorkflows: list(input.relatedWorkflows),
      notes: text(input.notes)
    });
  }

  function createMetadataRepository(inputs = []) {
    const records = deepFreeze(inputs.map(createKnowledgeMetadata));
    const byId = new Map(records.map(record => [record.id, record]));
    if (byId.size !== records.length) throw new TypeError('Duplicate knowledge metadata id');

    function get(id) { return byId.get(text(id)); }
    function all() { return records; }
    function search(query = '') {
      const needle = text(query).normalize('NFKC').toLocaleLowerCase();
      if (!needle) return records;
      return deepFreeze(records.filter(record => [
        record.documentTitle, record.documentNumber, record.issuingAgency, record.category,
        record.sourceType, ...record.keywords, ...record.relatedWorkflows
      ].join(' ').normalize('NFKC').toLocaleLowerCase().includes(needle)));
    }

    return deepFreeze({ records, get, all, search });
  }

  window.GovPromptCore = window.GovPromptCore || {};
  Object.assign(window.GovPromptCore, {
    DOCUMENT_STATUSES,
    SOURCE_LEVELS,
    METADATA_FIELDS,
    createKnowledgeMetadata,
    createMetadataRepository
  });
})();
