import { initializeCaseListUI } from './case-list-ui-v1.js';

function bootCaseList() {
  try {
    initializeCaseListUI();
  } catch (error) {
    console.warn('GovPrompt case list UI bootstrap skipped:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootCaseList, { once: true });
} else {
  bootCaseList();
}
