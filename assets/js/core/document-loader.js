(() => {
  'use strict';

  const REPOSITORY_DOCUMENT_FIELDS = Object.freeze([
    'id',
    'title',
    'agency',
    'category',
    'effectiveDate',
    'version',
    'keywords',
    'summary',
    'source',
    'content'
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

  function createRepositoryDocument(input = {}) {
    const document = {
      id: normalizeText(input.id),
      title: normalizeText(input.title),
      agency: normalizeText(input.agency),
      category: normalizeText(input.category),
      effectiveDate: normalizeText(input.effectiveDate),
      version: normalizeText(input.version),
      keywords: Array.isArray(input.keywords)
        ? [...new Set(input.keywords.map(normalizeText).filter(Boolean))]
        : [],
      summary: normalizeText(input.summary),
      source: normalizeText(input.source),
      content: normalizeText(input.content),
      reference: normalizeText(input.reference || input.source),
      sourceURL: normalizeText(input.sourceURL || input.source)
    };
    const missing = REPOSITORY_DOCUMENT_FIELDS.filter(field =>
      field === 'keywords' ? !Array.isArray(input.keywords) : !document[field]
    );
    if (missing.length) throw new TypeError(`Invalid knowledge document; missing: ${missing.join(', ')}`);
    if (!isIsoDate(document.effectiveDate)) throw new TypeError('Invalid knowledge document effectiveDate');
    return deepFreeze(document);
  }

  function createDocumentLoader({ fetcher, indexUrl = 'knowledge/index.json' } = {}) {
    const loadJson = fetcher || (typeof fetch === 'function' ? url => fetch(url).then(response => {
      if (!response.ok) throw new Error(`Knowledge repository request failed: ${response.status}`);
      return response.json();
    }) : undefined);
    let repository = deepFreeze({ schemaVersion: '', documents: Object.freeze([]), metadata: Object.freeze([]) });

    async function loadRepository() {
      if (typeof loadJson !== 'function') throw new TypeError('A repository fetcher is required');
      const index = await loadJson(indexUrl);
      if (!index || !Array.isArray(index.documents)) throw new TypeError('Invalid knowledge repository index');
      const baseUrl = typeof location === 'object' ? new URL(indexUrl, location.href) : indexUrl;
      const resolved = await Promise.all(index.documents.map(entry =>
        typeof entry === 'string' ? loadJson(new URL(entry, baseUrl).toString()) : entry
      ));
      const documents = resolved.map(createRepositoryDocument);
      if (new Set(documents.map(document => document.id)).size !== documents.length) {
        throw new TypeError('Duplicate knowledge document id');
      }
      const metadata = documents.map(({ content, ...documentMetadata }) => deepFreeze(documentMetadata));
      repository = deepFreeze({
        schemaVersion: normalizeText(index.schemaVersion),
        documents,
        metadata
      });
      return repository;
    }

    function getRepository() {
      return repository;
    }

    function getDocument(id) {
      return repository.documents.find(document => document.id === normalizeText(id));
    }

    function getMetadata(id) {
      return repository.metadata.find(document => document.id === normalizeText(id));
    }

    return deepFreeze({ loadRepository, getRepository, getDocument, getMetadata });
  }

  const documentLoader = createDocumentLoader();

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.REPOSITORY_DOCUMENT_FIELDS = REPOSITORY_DOCUMENT_FIELDS;
  window.GovPromptCore.createRepositoryDocument = createRepositoryDocument;
  window.GovPromptCore.createDocumentLoader = createDocumentLoader;
  window.GovPromptCore.documentLoader = documentLoader;
})();
