import {
  buildBudgetOfficialEvidenceFromSearchMap,
  mergeEvidenceByKey
} from '../../../src/budget-official-evidence-adapter.js';
import { ingestVerifiedBudgetDocumentContent } from '../../../src/budget-document-content-ingestion.js';
import { buildBudgetDeliverableArtifacts } from '../../../src/budget-artifact-factory.js';

export const BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION = '1.3';

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
  const org = organization || 'องค์กรปกครองส่วนท้องถิ่น';
  const yearText = targetYear ? `ปีงบประมาณ ${targetYear}` : 'ปีงบประมาณเป้าหมาย';
  return Object.freeze({
    currentBudgetRule: `${org} หลักเกณฑ์ ระเบียบ หนังสือสั่งการ การจัดทำงบประมาณ ${yearText} ล่าสุด`,
    latestRevenueActualsSource: `${org} รายงานรายรับจริง ผลการจัดเก็บรายได้ งบประมาณ ล่าสุด`,
    targetYearPlanSource: `${org} แผนพัฒนาท้องถิ่น ${yearText} ฉบับล่าสุด`
  });
}

export async function executeBudgetOfficialSourceSearch({ query = '', workflowView = null, connector = null, existingEvidence = [], readDocuments = {}, input = {} } = {}) {
  const baseEvidence = mergeEvidenceByKey(existingEvidence, queryEvidence(query));
  if (!budgetActive(workflowView)) return Object.freeze({ runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, status: 'inactive', evidence: baseEvidence, searchMap: Object.freeze({}), documentIngestion: null, artifactAttempt: null, failClosed: false });
  if (!connector || typeof connector.search !== 'function') return Object.freeze({ runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, status: 'blocked-search-unavailable', evidence: baseEvidence, searchMap: Object.freeze({}), documentIngestion: null, artifactAttempt: buildBudgetDeliverableArtifacts({ evidence: baseEvidence, input }), failClosed: true });

  const queries = buildBudgetOfficialSearchQueries(query);
  const entries = await Promise.all(Object.entries(queries).map(async ([key, searchQuery]) => {
    try { return [key, await connector.search(searchQuery, { limitSources: 6, count: 10, requireFreshness: true })]; }
    catch { return [key, null]; }
  }));
  const searchMap = Object.freeze(Object.fromEntries(entries));
  const adapted = buildBudgetOfficialEvidenceFromSearchMap(searchMap);
  const sourceEvidence = mergeEvidenceByKey(baseEvidence, adapted.evidence);
  const documentIngestion = ingestVerifiedBudgetDocumentContent({ evidence: sourceEvidence, readDocuments });
  const evidence = mergeEvidenceByKey(sourceEvidence, documentIngestion.evidence);
  const artifactAttempt = buildBudgetDeliverableArtifacts({ evidence, input });

  return Object.freeze({
    runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION,
    status: adapted.failClosed ? adapted.status : documentIngestion.failClosed ? documentIngestion.status : artifactAttempt.status,
    evidence,
    acceptedKeys: Object.freeze([...new Set([...(adapted.acceptedKeys || []), ...(documentIngestion.acceptedKeys || [])])]),
    missingKeys: Object.freeze([...new Set([...(adapted.missingKeys || []), ...(documentIngestion.missingKeys || [])])]),
    searchMap,
    documentIngestion,
    artifactAttempt,
    failClosed: adapted.failClosed || documentIngestion.failClosed || artifactAttempt.failClosed,
    governance: Object.freeze({ ...adapted.governance, ...documentIngestion.governance, queryFactsMayPopulateOnlyUserStatedContext: true, artifactsRequireInternalEvidenceAndBalanceValidation: true })
  });
}

export { parseBudgetYear, parseOrganization, queryEvidence };
export default Object.freeze({ version: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, buildBudgetOfficialSearchQueries, executeBudgetOfficialSourceSearch });
