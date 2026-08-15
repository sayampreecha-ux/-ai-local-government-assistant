import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestInternalBudgetEvidence } from '../../src/budget-internal-evidence-ingestion.js';
import { executeBudgetOfficialSourceSearch } from '../../assets/js/core/budget-official-source-runtime-v1.js';

const AT = '2026-08-15T12:00:00.000Z';
const input = (sourceType, sourceRef, data, status = 'verified', extra = {}) => ({ sourceType, sourceRef, observedAt: AT, status, data, ...extra });

function liveSearch(title, url) {
  return { mode: 'live', provider: 'test', evidence: { conclusionEligible: true, verifiedCurrent: true, primaryResults: [{ official: true, title, documentTitle: title, sourceUrl: url, sourceName: 'ราชการ', documentDate: '2026-08-01', status: 'current' }] } };
}
function read(url, structuredData) {
  return { sourceUrl: url, contentHash: 'sha256:doc', readAt: AT, reader: 'trusted-reader', contentReadAndVerified: true, official: true, current: true, fresh: true, structuredData };
}

test('internal ingestion requires source references and hashes for uploaded documents', () => {
  const result = ingestInternalBudgetEvidence({ inputs: {
    baselineBudget: input('uploaded-document', 'file:budget.xlsx', { fiscalYear: 2569, total: 100 }),
    personnelObligations: input('user-provided', '', { total: 20 }),
    budgetTotals: input('internal-system', 'finance-system', { revenueTotal: 100, expenseTotal: 100 })
  } });
  assert.equal(result.status, 'blocked-invalid-internal-evidence');
  assert.ok(result.rejected.find(item => item.key === 'baselineBudget')?.errors.includes('contentHash:required-for-uploaded-document'));
  assert.ok(result.rejected.find(item => item.key === 'personnelObligations')?.errors.includes('sourceRef:required'));
});

test('pending-confirmation internal evidence remains a finalization blocker', () => {
  const result = ingestInternalBudgetEvidence({ inputs: {
    baselineBudget: input('user-provided', 'user:baseline', { fiscalYear: 2569, total: 100 }),
    personnelObligations: input('user-provided', 'user:personnel', { total: 20 }, 'pending-confirmation'),
    budgetTotals: input('user-provided', 'user:totals', { revenueTotal: 100, expenseTotal: 100 })
  } });
  assert.equal(result.status, 'blocked-pending-confirmation');
  assert.deepEqual(result.pendingKeys, ['personnelObligations']);
  assert.equal(result.failClosed, true);
});

test('verified and estimated internal inputs retain explicit evidence status and provenance', () => {
  const result = ingestInternalBudgetEvidence({ inputs: {
    baselineBudget: input('uploaded-document', 'file:budget.xlsx', { fiscalYear: 2569, total: 100 }, 'verified', { contentHash: 'sha256:budget' }),
    personnelObligations: input('internal-system', 'hr-system', { total: 20 }),
    budgetTotals: input('user-provided', 'user:working-budget', { revenueTotal: 100, expenseTotal: 100 }, 'estimated')
  } });
  assert.equal(result.status, 'ready');
  assert.equal(result.failClosed, false);
  assert.equal(result.evidence.find(item => item.key === 'budgetTotals')?.value.evidenceStatus, 'estimated');
  assert.equal(result.evidence.find(item => item.key === 'baselineBudget')?.provenance.contentHash, 'sha256:budget');
});

test('full runtime can reach governed artifacts when official documents and internal budget inputs are all supplied', async () => {
  const connector = { search: async query => query.includes('รายรับจริง') ? liveSearch(query, 'https://a.go.th/revenue') : query.includes('แผนพัฒนาท้องถิ่น') ? liveSearch(query, 'https://a.go.th/plan') : liveSearch(query, 'https://a.go.th/rule') };
  const result = await executeBudgetOfficialSourceSearch({
    query: 'ทำร่างงบปี 70 อบจ.พะเยา',
    workflowView: { workflowIds: ['gov.budget-draft'] },
    connector,
    readDocuments: {
      latestRevenueActuals: read('https://a.go.th/revenue', { total: 100 }),
      targetYearPlan: read('https://a.go.th/plan', { targetYear: 2570, projects: ['P1'] })
    },
    internalBudgetInputs: {
      baselineBudget: input('uploaded-document', 'file:budget.xlsx', { fiscalYear: 2569, total: 100 }, 'verified', { contentHash: 'sha256:budget' }),
      personnelObligations: input('internal-system', 'hr-system', { total: 20 }),
      budgetTotals: input('internal-system', 'finance-system', { revenueItems: [{ key: 'R1', amount: 100, status: 'verified' }], expenseItems: [{ key: 'E1', amount: 100, status: 'verified' }] })
    }
  });
  assert.equal(result.internalIngestion.status, 'ready');
  assert.equal(result.documentIngestion.status, 'ready');
  assert.equal(result.artifactAttempt.status, 'ready');
  assert.deepEqual(result.artifactAttempt.artifacts.map(item => item.key), ['budget-draft', 'budget-structured-export']);
  assert.equal(result.failClosed, false);
});
