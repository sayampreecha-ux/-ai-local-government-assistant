(() => {
  'use strict';

  const FIELD_MAP = Object.freeze({
    organizationType: Object.freeze(['organizationType', 'agency', 'organization']),
    owningUnit: Object.freeze(['owningUnit', 'agency', 'unit', 'department']),
    currentStage: Object.freeze(['currentStage', 'stage', 'status']),
    fundingSource: Object.freeze(['fundingSource', 'fund', 'budgetSource']),
    facts: Object.freeze(['facts', 'detail', 'details', 'background']),
    documents: Object.freeze(['documents', 'docs', 'law', 'rules', 'references']),
    specialFlags: Object.freeze(['specialFlags', 'flags', 'risks', 'limits']),
    desiredOutput: Object.freeze(['desiredOutput', 'result', 'objective', 'proposal', 'issue'])
  });

  function readFirst(root, ids) {
    for (const id of ids) {
      const value = root?.getElementById?.(id)?.value;
      if (String(value ?? '').trim()) return value;
    }
    return '';
  }

  function collectAssistantContext(moduleId, root = document) {
    const definition = window.GovPromptCore.getPromptDefinition(moduleId);
    const activeTask = root?.querySelector?.('.task.active')?.dataset?.task || '';
    const input = Object.fromEntries(
      Object.entries(FIELD_MAP).map(([field, ids]) => [field, readFirst(root, ids)])
    );
    input.transactionType = activeTask || definition?.transactionTypes?.[0] || '';
    return window.GovPromptCore.createPromptContext(moduleId, input);
  }

  let currentContext;
  let currentRoute;

  function refreshAssistantContext(options = {}) {
    const moduleId = window.GovPromptCore.detectModuleId(options);
    currentContext = collectAssistantContext(moduleId, options.root || document);
    currentRoute = window.GovPromptCore.routeTransaction(currentContext, { moduleId });
    return Object.freeze({ context: currentContext, route: currentRoute });
  }

  function getAssistantContext() {
    return currentContext;
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  window.GovPromptCore.FIELD_MAP = FIELD_MAP;
  window.GovPromptCore.collectAssistantContext = collectAssistantContext;
  window.GovPromptCore.refreshAssistantContext = refreshAssistantContext;
  window.GovPromptCore.getAssistantContext = getAssistantContext;
  window.GovPromptCore.getCurrentRoute = getCurrentRoute;

  if (typeof document === 'object') {
    refreshAssistantContext();
    document.getElementById('make')?.addEventListener('click', () => refreshAssistantContext(), true);
  }
})();
