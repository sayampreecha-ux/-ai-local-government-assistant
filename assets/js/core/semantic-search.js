(() => {
  'use strict';

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeText(value) {
    return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  const SYNONYM_GROUPS = deepFreeze([
    ['ว79', 'ว 79', 'ว.79', 'หนังสือ ว79', 'หนังสือเวียน ว79'],
    ['tor', 'terms of reference', 'ขอบเขตของงาน', 'ร่างขอบเขตงาน', 'ข้อกำหนดขอบเขตงาน'],
    ['ค่าเดินทาง', 'เดินทางไปราชการ', 'ค่าพาหนะ', 'ค่าเบี้ยเลี้ยง', 'ค่าที่พัก'],
    ['เงินบำรุง', 'ระเบียบเงินบำรุง', 'เงินรายได้สถานพยาบาล'],
    ['อบจ.', 'อบจ', 'องค์การบริหารส่วนจังหวัด'],
    ['อบต.', 'อบต', 'องค์การบริหารส่วนตำบล'],
    ['เทศบาล', 'เทศบาลนคร', 'เทศบาลเมือง', 'เทศบาลตำบล']
  ].map(group => group.map(normalizeText)));

  function expandIntent(query) {
    const normalized = normalizeText(query);
    const directTerms = normalized.split(/\s+/).filter(Boolean);
    const expanded = new Set(directTerms);
    if (normalized) expanded.add(normalized);
    SYNONYM_GROUPS.forEach(group => {
      if (group.some(term => normalized.includes(term) || term.includes(normalized))) {
        group.forEach(term => expanded.add(term));
      }
    });
    return deepFreeze({ query: normalized, directTerms, expandedTerms: [...expanded] });
  }

  function confidenceFor(similarity, official) {
    if (similarity >= 0.85 && official) return 'high';
    if (similarity >= 0.55) return 'medium';
    return 'low';
  }

  function createSemanticSearch(knowledgeIndex) {
    if (!knowledgeIndex || !Array.isArray(knowledgeIndex.records)) {
      throw new TypeError('A Government Knowledge Index is required');
    }

    function search(query, { category = '', agency = '', documentType = '', asOf = new Date(), limit } = {}) {
      const intent = expandIntent(query);
      if (!intent.query) return Object.freeze([]);
      const wantedCategory = normalizeText(category);
      const wantedAgency = normalizeText(agency);
      const wantedType = normalizeText(documentType);
      const reference = asOf instanceof Date ? asOf : new Date(asOf);

      const results = knowledgeIndex.records
        .filter(record => !Number.isNaN(reference.getTime()) && new Date(`${record.effectiveDate}T00:00:00.000Z`) <= reference)
        .filter(record => !wantedCategory || record.category === wantedCategory)
        .filter(record => !wantedAgency || record.agency === wantedAgency)
        .filter(record => !wantedType || record.documentType === wantedType)
        .map(record => {
          const document = record.document;
          const searchable = normalizeText([
            document.title,
            ...(document.keywords || []),
            document.summary,
            record.category,
            record.agency,
            record.documentType
          ].join(' '));
          const exactTitle = normalizeText(document.title) === intent.query;
          const exactPhrase = searchable.includes(intent.query);
          const directMatches = intent.directTerms.filter(term => searchable.includes(term));
          const semanticMatches = intent.expandedTerms.filter(term => searchable.includes(term));
          const intentCoverage = intent.directTerms.length ? directMatches.length / intent.directTerms.length : 0;
          const synonymStrength = semanticMatches.length ? Math.min(0.2, semanticMatches.length * 0.04) : 0;
          const semanticSimilarity = exactTitle ? 1
            : exactPhrase ? 0.9
              : semanticMatches.length ? Math.min(0.89, 0.6 + synonymStrength + intentCoverage * 0.09)
                : 0;
          const confidence = confidenceFor(semanticSimilarity, record.official);
          const citation = window.GovPromptCore.createCitation(document, { confidenceLevel: confidence, verify: false });
          return deepFreeze({
            title: document.title,
            summary: document.summary || '',
            citation,
            confidence,
            source: document.sourceURL || document.source,
            effectiveDate: document.effectiveDate,
            semanticSimilarity,
            matchedTerms: semanticMatches,
            _rank: deepFreeze({
              semanticSimilarity,
              official: record.official,
              effectiveDate: record.effectiveDate,
              version: record.version,
              confidence: ['low', 'medium', 'high'].indexOf(confidence)
            })
          });
        })
        .filter(result => result.semanticSimilarity > 0)
        .sort((left, right) =>
          right._rank.semanticSimilarity - left._rank.semanticSimilarity
          || Number(right._rank.official) - Number(left._rank.official)
          || right._rank.effectiveDate.localeCompare(left._rank.effectiveDate)
          || right._rank.version.localeCompare(left._rank.version, undefined, { numeric: true })
          || right._rank.confidence - left._rank.confidence
          || left.title.localeCompare(right.title)
        );
      return deepFreeze(Number.isInteger(limit) && limit >= 0 ? results.slice(0, limit) : results);
    }

    return deepFreeze({ search, expandIntent });
  }

  const semanticSearch = createSemanticSearch(window.GovPromptCore.knowledgeIndex);

  window.GovPromptCore.SYNONYM_GROUPS = SYNONYM_GROUPS;
  window.GovPromptCore.expandSemanticIntent = expandIntent;
  window.GovPromptCore.createSemanticSearch = createSemanticSearch;
  window.GovPromptCore.semanticSearch = semanticSearch;
})();
