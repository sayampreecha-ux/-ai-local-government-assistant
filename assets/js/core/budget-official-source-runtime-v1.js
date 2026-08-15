import {
  buildBudgetOfficialEvidenceFromSearchMap,
  mergeEvidenceByKey
} from '../../../src/budget-official-evidence-adapter.js';

export const BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION = '1.0';

const safeText = (value, max = 240) => String(value || '').trim().slice(0, max);

function budgetActive(workflowView) {
  return Array.isArray(workflowView?.workflowIds) && workflowView.workflowIds.includes('gov.budget-draft');
}

function parseBudgetYear(query) {
  const text = safeText(query, 1000);
  const thaiShort = text.match(/(?:ปี(?:งบประมาณ)?\s*)?(?:25)?(6[9]|7\d)\b/);
  if (thaiShort) {
    const short = Number(thaiShort[1]);
    return short < 100 ? 2500 + short : short;
  }
  const full = text.match(/\b(25\d{2}|20\d{2})\b/);
  return full ? Number(full[1]) : null;
}

function parseOrganization(query) {
  const text = safeText(query, 1000);
  const patterns = [
    /(อบจ\.?\s*[^\s,]+)/i,
    /(อบต\.?\s*[^\s,]+)/i,
    /(เทศบาล(?:นคร|เมือง|ตำบล)?\s*[^\s,]+)/i,
    /(องค์การบริหารส่วนจังหวัด\s*[^\s,]+)/i,
    /(องค์การบริหารส่วนตำบล\s*[^\s,]+)/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return safeText(match[1], 120);
  }
  return '';
}

export function buildBudgetOfficialSearchQueries(query) {
  const organization = parseOrganization(query);
  const targetYear = parseBudgetYear(query);
  const org = organization || 'องค์กรปกครองส่วนท้องถิ่น';
  const yearText = targetYear ? `ปีงบประมาณ ${targetYear}` : 'ปีงบประมาณเป้าหมาย';
  return Object.freeze({
    currentBudgetRule: `${org} หลักเกณฑ์ ระเบียบ หนังสือสั่งการ การจัดทำงบประมาณ ${yearText} ล่าสุด`,
    latestRevenueActuals: `${org} รายงานรายรับจริง ผลการจัดเก็บรายได้ งบประมาณ ล่าสุด`,
    targetYearPlan: `${org} แผนพัฒนาท้องถิ่น ${yearText} ฉบับล่าสุด`
  });
}

export async function executeBudgetOfficialSourceSearch({ query = '', workflowView = null, connector = null, existingEvidence = [] } = {}) {
  if (!budgetActive(workflowView)) {
    return Object.freeze({
      runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION,
      status: 'inactive',
      evidence: Object.freeze(Array.isArray(existingEvidence) ? [...existingEvidence] : []),
      searchMap: Object.freeze({}),
      failClosed: false
    });
  }

  if (!connector || typeof connector.search !== 'function') {
    return Object.freeze({
      runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION,
      status: 'blocked-search-unavailable',
      evidence: Object.freeze(Array.isArray(existingEvidence) ? [...existingEvidence] : []),
      searchMap: Object.freeze({}),
      failClosed: true
    });
  }

  const queries = buildBudgetOfficialSearchQueries(query);
  const entries = await Promise.all(Object.entries(queries).map(async ([key, searchQuery]) => {
    try {
      const result = await connector.search(searchQuery, { limitSources: 6, count: 10, requireFreshness: true });
      return [key, result];
    } catch {
      return [key, null];
    }
  }));
  const searchMap = Object.freeze(Object.fromEntries(entries));
  const adapted = buildBudgetOfficialEvidenceFromSearchMap(searchMap);
  const evidence = mergeEvidenceByKey(existingEvidence, adapted.evidence);

  return Object.freeze({
    runtimeVersion: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION,
    status: adapted.status,
    evidence,
    acceptedKeys: adapted.acceptedKeys,
    missingKeys: adapted.missingKeys,
    searchMap,
    failClosed: adapted.failClosed
  });
}

export { parseBudgetYear, parseOrganization };

export default Object.freeze({
  version: BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION,
  buildBudgetOfficialSearchQueries,
  executeBudgetOfficialSourceSearch
});
