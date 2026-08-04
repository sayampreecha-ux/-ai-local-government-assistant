(() => {
  'use strict';

  const DOCUMENT_FIELDS = Object.freeze([
    'title',
    'source',
    'issuingAgency',
    'effectiveDate',
    'version',
    'category'
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeText(value) {
    return String(value ?? '').trim();
  }

  function isIsoDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return date.getUTCFullYear() === Number(match[1])
      && date.getUTCMonth() + 1 === Number(match[2])
      && date.getUTCDate() === Number(match[3]);
  }

  function createKnowledgeDocument(input = {}) {
    const issuingAgency = input.issuingAgency ?? input.agency;
    const metadata = Object.fromEntries(
      DOCUMENT_FIELDS.map(field => [field, normalizeText(field === 'issuingAgency' ? issuingAgency : input[field])])
    );
    const missingFields = DOCUMENT_FIELDS.filter(field => !metadata[field]);
    if (missingFields.length) throw new TypeError(`Missing document metadata: ${missingFields.join(', ')}`);
    if (!isIsoDate(metadata.effectiveDate)) throw new TypeError('effectiveDate must use a valid YYYY-MM-DD date');

    const id = normalizeText(input.id) || [
      metadata.issuingAgency,
      metadata.title,
      metadata.version,
      metadata.effectiveDate
    ].join('|').toLowerCase();
    const agency = metadata.issuingAgency;
    const reference = normalizeText(input.reference || metadata.source);
    const sourceURL = normalizeText(input.sourceURL || metadata.source);
    const citation = window.GovPromptCore.createCitation({ id, ...metadata, agency, reference, sourceURL });

    return deepFreeze({ id, ...metadata, agency, reference, sourceURL, citation });
  }

  function compareVersions(left, right) {
    return normalizeText(left).localeCompare(normalizeText(right), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  }

  function checkDocumentVersion(document, latestVersion) {
    const latest = normalizeText(latestVersion);
    if (!latest) return deepFreeze({ status: 'unknown', currentVersion: document.version, latestVersion: '' });
    const comparison = compareVersions(document.version, latest);
    return deepFreeze({
      status: comparison === 0 ? 'current' : comparison < 0 ? 'outdated' : 'ahead',
      currentVersion: document.version,
      latestVersion: latest
    });
  }

  function validateEffectiveDate(document, asOf = new Date()) {
    const reference = asOf instanceof Date ? asOf : new Date(asOf);
    if (Number.isNaN(reference.getTime())) return deepFreeze({ valid: false, status: 'invalid-reference-date' });
    const effective = new Date(`${document.effectiveDate}T00:00:00.000Z`);
    const valid = effective.getTime() <= reference.getTime();
    return deepFreeze({
      valid,
      status: valid ? 'effective' : 'not-yet-effective',
      effectiveDate: document.effectiveDate,
      asOf: reference.toISOString().slice(0, 10)
    });
  }

  function createKnowledgeEngine(inputs = []) {
    const documents = deepFreeze(inputs.map(createKnowledgeDocument));
    const byId = deepFreeze(Object.fromEntries(documents.map(document => [document.id, document])));

    function getDocument(id) {
      return byId[normalizeText(id)];
    }

    function searchDocuments({ query = '', category = '', issuingAgency = '', effectiveOn } = {}) {
      const needle = normalizeText(query).toLowerCase();
      const normalizedCategory = normalizeText(category).toLowerCase();
      const normalizedAgency = normalizeText(issuingAgency).toLowerCase();
      return documents.filter(document => {
        const searchable = [document.title, document.source, document.issuingAgency, document.category, document.version]
          .join(' ')
          .toLowerCase();
        return (!needle || searchable.includes(needle))
          && (!normalizedCategory || document.category.toLowerCase() === normalizedCategory)
          && (!normalizedAgency || document.issuingAgency.toLowerCase() === normalizedAgency)
          && (!effectiveOn || validateEffectiveDate(document, effectiveOn).valid);
      });
    }

    function resolveCurrentDocuments(ids, options = {}) {
      return ids.map(getDocument).filter(Boolean).map(document =>
        window.GovPromptCore.rejectObsoleteVersion(document, documents, options.asOf)
      );
    }

    function getCitations(ids = documents.map(document => document.id), options = {}) {
      return window.GovPromptCore.createCitations(resolveCurrentDocuments(ids, options), options);
    }

    function createAnswer(text, ids = documents.map(document => document.id), options = {}) {
      const citations = getCitations(ids, options);
      if (!citations.length) throw new TypeError('Knowledge answers require at least one effective citation');
      return deepFreeze({ text: normalizeText(text), citations });
    }

    return deepFreeze({ documents, getDocument, searchDocuments, getCitations, createAnswer });
  }

  function createKnowledgeEngineFromRepository(repository) {
    if (!repository || !Array.isArray(repository.documents)) {
      throw new TypeError('A loaded knowledge repository is required');
    }
    return createKnowledgeEngine(repository.documents);
  }

  async function loadKnowledgeRepository(loader = window.GovPromptCore.documentLoader) {
    if (!loader || typeof loader.loadRepository !== 'function') {
      throw new TypeError('A document loader is required');
    }
    return createKnowledgeEngineFromRepository(await loader.loadRepository());
  }

  const knowledgeEngine = createKnowledgeEngine();

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.DOCUMENT_FIELDS = DOCUMENT_FIELDS;
  window.GovPromptCore.createKnowledgeDocument = createKnowledgeDocument;
  window.GovPromptCore.createKnowledgeEngine = createKnowledgeEngine;
  window.GovPromptCore.createKnowledgeEngineFromRepository = createKnowledgeEngineFromRepository;
  window.GovPromptCore.loadKnowledgeRepository = loadKnowledgeRepository;
  window.GovPromptCore.compareVersions = compareVersions;
  window.GovPromptCore.checkDocumentVersion = checkDocumentVersion;
  window.GovPromptCore.validateEffectiveDate = validateEffectiveDate;
  window.GovPromptCore.knowledgeEngine = knowledgeEngine;
})();
