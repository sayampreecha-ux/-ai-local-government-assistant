(() => {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeText(value) {
    return String(value ?? '').trim().toLowerCase();
  }

  function normalizeKeywords(value) {
    const values = Array.isArray(value) ? value : normalizeText(value).split(/\s+/);
    return [...new Set(values.map(normalizeText).filter(Boolean))];
  }

  function createKnowledgeIndex(documents = []) {
    const records = deepFreeze(documents.map(document => {
      const official = window.GovPromptCore.verifySource(document).verified;
      return {
        document,
        title: normalizeText(document.title),
        keywords: normalizeKeywords(document.keywords),
        category: normalizeText(document.category),
        agency: normalizeText(document.agency || document.issuingAgency),
        documentType: normalizeText(document.documentType || document.category),
        effectiveDate: document.effectiveDate,
        version: normalizeText(document.version),
        official
      };
    }));

    function toResult(record, exactTitle, keywordScore) {
      const citation = window.GovPromptCore.createCitation(record.document, {
        confidenceLevel: record.official ? 'high' : 'low',
        verify: false
      });
      return deepFreeze({
        title: record.document.title,
        summary: record.document.summary || '',
        citation,
        confidence: citation.confidenceLevel,
        source: record.document.sourceURL || record.document.source,
        effectiveDate: record.document.effectiveDate,
        _rank: deepFreeze({ official: record.official, effectiveDate: record.effectiveDate, exactTitle, keywordScore })
      });
    }

    function search({ query = '', keywords = [], category = '', agency = '', documentType = '', asOf = new Date() } = {}) {
      const normalizedQuery = normalizeText(query);
      const terms = normalizeKeywords(keywords).concat(normalizedQuery ? normalizeKeywords(normalizedQuery) : []);
      const wantedCategory = normalizeText(category);
      const wantedAgency = normalizeText(agency);
      const wantedType = normalizeText(documentType);
      const reference = asOf instanceof Date ? asOf : new Date(asOf);

      return records
        .filter(record => !Number.isNaN(reference.getTime()) && new Date(`${record.effectiveDate}T00:00:00.000Z`) <= reference)
        .filter(record => !wantedCategory || record.category === wantedCategory)
        .filter(record => !wantedAgency || record.agency === wantedAgency)
        .filter(record => !wantedType || record.documentType === wantedType)
        .map(record => {
          const exactTitle = Boolean(normalizedQuery && record.title === normalizedQuery);
          const searchable = [record.title, record.category, record.agency, record.documentType, ...record.keywords].join(' ');
          const keywordScore = terms.reduce((score, term) => score + (searchable.includes(term) ? 1 : 0), 0);
          return { record, exactTitle, keywordScore };
        })
        .filter(match => !normalizedQuery && !terms.length || match.exactTitle || match.keywordScore > 0)
        .sort((left, right) =>
          Number(right.record.official) - Number(left.record.official)
          || right.record.effectiveDate.localeCompare(left.record.effectiveDate)
          || Number(right.exactTitle) - Number(left.exactTitle)
          || right.keywordScore - left.keywordScore
          || right.record.version.localeCompare(left.record.version, undefined, { numeric: true })
          || left.record.title.localeCompare(right.record.title)
        )
        .map(match => toResult(match.record, match.exactTitle, match.keywordScore));
    }

    function exactSearch(title, options = {}) {
      const wanted = normalizeText(title);
      return search({ ...options, query: title }).filter(result => normalizeText(result.title) === wanted);
    }

    function keywordSearch(keywords, options = {}) {
      return search({ ...options, keywords });
    }

    function categorySearch(category, options = {}) {
      return search({ ...options, category });
    }

    function agencySearch(agency, options = {}) {
      return search({ ...options, agency });
    }

    return deepFreeze({ records, search, exactSearch, keywordSearch, categorySearch, agencySearch });
  }

  const knowledgeIndex = createKnowledgeIndex();

  window.GovPromptCore = window.GovPromptCore || {};
  window.GovPromptCore.createKnowledgeIndex = createKnowledgeIndex;
  window.GovPromptCore.knowledgeIndex = knowledgeIndex;
})();
