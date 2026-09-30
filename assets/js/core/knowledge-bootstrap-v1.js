(() => {
  'use strict';

  const core = window.GovPromptCore = window.GovPromptCore || {};

  async function load() {
    try {
      const repository = await core.documentLoader.loadRepository();
      core.knowledgeRepository = repository;
      core.knowledgeLoadedAt = new Date().toISOString();
      window.dispatchEvent(new CustomEvent('govprompt:knowledge-ready', {
        detail: { schemaVersion: repository.schemaVersion, count: repository.documents.length }
      }));
      return repository;
    } catch (error) {
      core.knowledgeRepository = Object.freeze({
        schemaVersion: '',
        documents: Object.freeze([]),
        metadata: Object.freeze([])
      });
      core.knowledgeLoadError = String(error?.message || error);
      return core.knowledgeRepository;
    }
  }

  core.loadKnowledge = load;
  load();
})();