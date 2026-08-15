import {
  buildBudgetOfficialEvidenceFromSearchMap,
  mergeEvidenceByKey
} from '../../../src/budget-official-evidence-adapter.js';
import { ingestVerifiedBudgetDocumentContent } from '../../../src/budget-document-content-ingestion.js';
import { ingestInternalBudgetEvidence } from '../../../src/budget-internal-evidence-ingestion.js';
import { buildBudgetWorkingDraftEvidence } from '../../../src/budget-working-draft-planner.js';
import { buildBudgetDeliverableArtifacts } from '../../../src/budget-artifact-factory.js';

export const BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION = '2.0';

const safeText = (value, max = 240) => String(value || '').trim().slice(0, max);

function budgetActive(workflowView) {
  return Array.isArray(workflowView?.workflowIds) && workflowView.workflowIds.includes('gov.budget-draft');
}

function parseBudgetYear(query) {
  const value = safeText(query, 1000);
  const thaiShort = value.match(/(?:ปี(?:งบประมาณ)?\s*)?(?:25)?(6[9]|7\d)\b/);
  if (thaiShort) return 2500 + Number(thaiShort[1]);
  const full = value.match(/\b(25\d{2}|20\d{2})\b/);
  return full ? Number(full[1]) : null;
}

function parseOrganization(query) {
  const value = safeText(query, 1000);
  for (const pattern of [/(อบจ\.?\s*[^\s,]+)/i, /(อบต\.?\s*[^\s,]+)/i, /(เทศบาล(?:นคร|เมือง|ตำบล)?\s*[^\s,]+)/i, /(องค์การบริหารส่วนจังหวัด\s*[^\s,]+)/i, /(องค์การบริหารส่วนตำบล\s*[^\s,]+)/i]) {
    const match = value.match(pattern);
    if (match) return safeText(match[1], 120);
  }
  return '';
}

function queryEvidence(query) {
  const organization = parseOrganization(query);
  const targetYear = parseBudgetYear(query);
  const evidence = [];
  if (organization) evidence.push(Object.freeze({ key: 'organizationContext', value: Object.freeze({ organizationName: organization }), official: false, verified: true, provenance: Object.freeze({ sourceType: 'user-query', extracted: true }) }));
  if (targetYear) evidence.push(Object.freeze({ key: 'targetBudgetYear', value: targetYear, official: false, verified: true, provenance: Object.freeze({ sourceType: 'user-query', extracted: true }) }));
  return Object.freeze(evidence);
}

export function buildBudgetOfficialSearchQueries(query) {
  const organization = parseOrganization(query);
  const targetYear = parseBudgetYear(query);
  const baselineYear = targetYear ? targetYear - 1 : null;
  const org = organization || 'องค์กรปกครองส่วนท้องถิ่น';
  const yearText = targetYear ? `ปีงบประมาณ ${targetYear}` : 'ปีงบประมาณเป้าหมาย';
  const baselineText = baselineYear ? `ปีงบประมาณ ${baselineYear}` : 'ปีงบประมาณก่อนหน้า';
  return Object.freeze({
    currentBudgetRule: `${org} หลักเกณฑ์ ระเบียบ หนังสือสั่งการ การจัดทำงบประมาณ ${yearText} ล่าสุด`,
    baselineBudgetSource: `${org} ข้อบัญญัติงบประมาณรายจ่าย ${baselineText} ฉบับประกาศใช้`,
    latestRevenueActualsSource: `${org} รายงานรายรับจริง ผลการจัดเก็บรายได้ งบประมาณ ล่าสุด`,
    targetYearPlanSource: `${org} แผนพัฒนาท้องถิ่น ${yearText} ฉบับล่าสุด`
  });
}

async function autoReadDocuments({ sourceEvidence = [], readDocuments = {}, documentConnector = null, targetYear = null } = {}) {
  const resolved = { ...(readDocuments || {}) };
  const index = new Map((Array.isArray(sourceEvidence) ? sourceEvidence : []).filter(item => item?.key).map(item => [String(item.key), item]));
  const attempts = [];
  if (!documentConnector || typeof documentConnector.read !== 'function') {
    return Object.freeze({ readDocuments: Object.freeze(resolved), attempts: Object.freeze([]), status: 'reader-unavailable' });
  }
  const targets = [
    ['baselineBudget', 'baselineBudgetSource'],
    ['latestRevenueActuals', 'latestRevenueActualsSource'],
    ['targetYearPlan', 'targetYearPlanSource']
  ];
  for (const [targetKey, sourceKey] of targets) {
    if (resolved[targetKey] || index.has(targetKey)) continue;
    const sourceUrl = index.get(sourceKey)?.value?.sourceUrl;
    if (!sourceUrl) {
      attempts.push(Object.freeze({ targetKey, sourceKey, status: 'source-pointer-missing' }));
      continue;
    }
    let result;
    try { result = await documentConnector.read(sourceUrl, targetKey, { targetYear }); }
    catch { result = { status: 'blocked-document-reader', readDocument: null, errors: ['reader:unexpected-error'] }; }
    attempts.push(Object.freeze({ targetKey, sourceKey, status: result?.status || 'blocked-document-reader', errors: Object.freeze(result?.errors || []) }));
    if (result?.status === 'ready' && result.readDocument) resolved[targetKey] = result.readDocument;
  }
  const failed = attempts.filter(item => item.status !== 'ready');
  return Object.freeze({
    readDocuments: Object.freeze(resolved),
    attempts: Object.freeze(attempts),
    status: failed.length ? (attempts.some(item => item.status === 'ready') ? 'partial' : 'blocked-document-reader') : 'ready'
  });
}

export async function executeBudgetOfficialSourceSearch({
  query = '', workflowView = null, connector = null, documentConnector = null,
  existingEvidence = [], readDocuments = {}, internalBudgetInputs = {}, input = {}
} = {}) {
  const queryAndExistingEvidence = mergeEvidenceByKey(existingEvidence, queryEvidence(query));
  const internalIngestion = ingestInternalBudgetEvidence({ inputs: internalBudgetInputs });
  const baseEvidence = mergeEvidenceByKey(queryAndExistingEvidence, internalIngestion.evidence);
  if (!budgetActive(workflowView)) return Object.freeze({ runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, status: 'inactive', evidence: baseEvidence, searchMap: Object.freeze({}), internalIngestion, documentIngestion: null, workingDraft: null, artifactAttempt: null, failClosed: false });
  if (!connector || typeof connector.search !== 'function') return Object.freeze({ runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, status: 'blocked-search-unavailable', evidence: baseEvidence, searchMap: Object.freeze({}), internalIngestion, documentIngestion: null, workingDraft: null, artifactAttempt: buildBudgetDeliverableArtifacts({ evidence: baseEvidence, input }), failClosed: true });

  const queries = buildBudgetOfficialSearchQueries(query);
  const entries = await Promise.all(Object.entries(queries).map(async ([key, searchQuery]) => {
    try { return [key, await connector.search(searchQuery, { limitSources: 6, count: 10, requireFreshness: true })]; }
    catch { return [key, null]; }
  }));
  const searchMap = Object.freeze(Object.fromEntries(entries));
  const adapted = buildBudgetOfficialEvidenceFromSearchMap(searchMap);
  const sourceEvidence = mergeEvidenceByKey(baseEvidence, adapted.evidence);
  const targetYear = parseBudgetYear(query);
  const documentReads = await autoReadDocuments({ sourceEvidence, readDocuments, documentConnector, targetYear });
  const documentIngestion = ingestVerifiedBudgetDocumentContent({ evidence: sourceEvidence, readDocuments: documentReads.readDocuments });
  const verifiedEvidence = mergeEvidenceByKey(sourceEvidence, documentIngestion.evidence);
  const workingDraft = buildBudgetWorkingDraftEvidence({ evidence: verifiedEvidence });
  const evidence = workingDraft.evidence;
  const artifactAttempt = buildBudgetDeliverableArtifacts({ evidence, input });

  const invalidInternal = internalIngestion.status === 'blocked-invalid-internal-evidence' || internalIngestion.status === 'blocked-pending-confirmation';
  const requiredSourceMissing = (adapted.missingKeys || []).filter(key => key !== 'baselineBudgetSource' || !evidence.some(item => item.key === 'baselineBudget'));
  const sourceBlocked = requiredSourceMissing.length > 0;
  const documentBlocked = (documentIngestion.missingKeys || []).some(key => !evidence.some(item => item.key === key));
  const failClosed = invalidInternal || sourceBlocked || documentBlocked || artifactAttempt.failClosed;
  let status = artifactAttempt.status;
  if (invalidInternal) status = internalIngestion.status;
  else if (sourceBlocked) status = adapted.status;
  else if (documentBlocked) status = documentIngestion.status;
  else if (workingDraft.blockers.length) status = 'partial-working-draft';

  return Object.freeze({
    runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION,
    status,
    evidence,
    acceptedKeys: Object.freeze([...new Set([...(internalIngestion.acceptedKeys || []), ...(adapted.acceptedKeys || []), ...(documentIngestion.acceptedKeys || []), ...(workingDraft.derivedKeys || [])])]),
    missingKeys: Object.freeze([...new Set([...requiredSourceMissing, ...(documentIngestion.missingKeys || []).filter(key => !evidence.some(item => item.key === key)), ...(workingDraft.blockers || [])])]),
    searchMap,
    internalIngestion,
    documentReads,
    documentIngestion,
    workingDraft,
    artifactAttempt,
    failClosed,
    governance: Object.freeze({
      ...internalIngestion.governance,
      ...adapted.governance,
      ...documentIngestion.governance,
      ...workingDraft.governance,
      queryFactsMayPopulateOnlyUserStatedContext: true,
      liveDocumentReaderRequiredForOfficialContent: true,
      artifactsRequireEvidenceAndBalanceValidation: true
    })
  });
}

export { parseBudgetYear, parseOrganization, queryEvidence, autoReadDocuments };
export default Object.freeze({ version: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, buildBudgetOfficialSearchQueries, executeBudgetOfficialSourceSearch });
