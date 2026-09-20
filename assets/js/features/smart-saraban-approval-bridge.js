/**
 * GP Smart Saraban ↔ Approval Workflow Bridge v1.0
 * Converts a Saraban intake context into a guarded approval case.
 * No legal conclusion, authority, amount, date, or signatory is invented.
 */

import { createApprovalCase, classifyItems, assessCase, evaluateDecisionLock, runApprovalQualityGates } from './approval-workflow.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');

export function buildApprovalCaseFromSaraban(context = {}, options = {}) {
  const facts = text(context.facts) ? [{ value: text(context.facts), status: 'provided-needs-verification', source: 'user-input' }] : [];
  const proposal = text(context.proposal);
  const requestText = [text(context.subject), text(context.purpose), text(context.facts), proposal].filter(Boolean).join('\n');
  const items = Array.isArray(options.items) ? options.items : [];
  const approvalCase = createApprovalCase({
    caseId: options.caseId,
    sourceChannel: 'smart-saraban',
    owningUnit: context.owningUnit,
    requestText,
    objective: context.purpose,
    facts,
    items,
    evidenceReferences: Array.isArray(context.sourceReferences) ? context.sourceReferences : [],
    requiredAttachments: Array.isArray(context.attachments) ? context.attachments : [],
    candidateDocumentTypes: ['memorandum'],
    humanReviewStatus: 'pending'
  });
  return {
    approvalCase,
    classification: classifyItems(items),
    assessment: assessCase(approvalCase),
    lock: evaluateDecisionLock(approvalCase),
    qualityGates: runApprovalQualityGates(approvalCase)
  };
}

export function buildSafeSarabanDecisionSummary(context = {}, options = {}) {
  const result = buildApprovalCaseFromSaraban(context, options);
  return {
    state: result.approvalCase.state,
    decisionLock: result.lock.locked,
    lockReasons: result.lock.reasons,
    missingInformation: result.assessment.missingInformation,
    classification: result.classification,
    qualityGateStatus: result.qualityGates.status,
    nextAction: result.assessment.hasMaterialGaps ? 'REQUEST_MISSING_INFORMATION' : 'RUN_AUTHORITY_AND_EVIDENCE_CHECK',
    finalDecisionAllowed: false
  };
}
