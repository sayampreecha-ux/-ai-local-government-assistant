(() => {
  'use strict';
  // Runtime manifest for the Legal Case Reasoning layer.
  // The main application can consume this metadata without changing routing.
  const manifest = Object.freeze({
    id: 'legal-case-reasoning-v1',
    version: '1.0.0',
    module: './legal-case-reasoning-v1.js',
    category: 'legal',
    capabilities: Object.freeze([
      'post_inspection_contract_amendment_classification',
      'separate_amendment_acceptance_payment_and_liability',
      'primary_authority_verification_required',
      'decision_lock_on_insufficient_facts_or_authority'
    ]),
    safety: Object.freeze({
      hardCodedLegalConclusion: false,
      finalLegalDetermination: false,
      primarySourceFirst: true,
      humanReviewRequired: true
    })
  });
  if (typeof globalThis !== 'undefined') globalThis.GovPromptLegalCaseReasoningManifest = manifest;
  if (typeof module !== 'undefined' && module.exports) module.exports = manifest;
})();
