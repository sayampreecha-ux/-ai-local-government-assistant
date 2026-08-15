import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestVerifiedBudgetDocumentContent } from '../../src/budget-document-content-ingestion.js';
import { executeBudgetOfficialSourceSearch } from '../../assets/js/core/budget-official-source-runtime-v1.js';

const AT = '2026-08-15T11:30:00.000Z';
const source = (key, url) => ({ key, value: { sourceUrl: url, documentTitle: key }, official: true, verified: true, fresh: true, current: true });
const read = (url, structuredData) => ({ sourceUrl: url, contentHash: 'sha256:test', readAt: AT, reader: 'trusted-reader-v1', contentReadAndVerified: true, official: true, current: true, fresh: true, structuredData });

function liveSearch(title, url) {
  return { mode: 'live', provider: 'test', evidence: { conclusionEligible: true, verifiedCurrent: true, primaryResults: [{ official: true, title, documentTitle: title, sourceUrl: url, sourceName: 'ราชการ', documentDate: '2026-08-01', status: 'current' }] } };
}

test('document ingestion rejects content whose URL does not match the verified source pointer', () => {
  const result = ingestVerifiedBudgetDocumentContent({
    evidence: [source('latestRevenueActualsSource', 'https://a.go.th/revenue'), source('targetYearPlanSource', 'https://a.go.th/plan')],
    readDocuments: {
      latestRevenueActuals: read('https://evil.example/revenue', { total: 100 }),
      targetYearPlan: read('https://a.go.th/plan', { targetYear: 2570, projects: ['P1'] })
    }
  });
  assert.equal(result.failClosed, true);
  assert.ok(result.rejected.find(item => item.targetKey === 'latestRevenueActuals')?.errors.includes('sourceUrl:must-match-source-pointer'));
});

test('document ingestion rejects unread, unhashed, stale or unstructured content', () => {
  const result = ingestVerifiedBudgetDocumentContent({
    evidence: [source('latestRevenueActualsSource', 'https://a.go.th/revenue'), source('targetYearPlanSource', 'https://a.go.th/plan')],
    readDocuments: {
      latestRevenueActuals: { sourceUrl: 'https://a.go.th/revenue', official: true, current: true, fresh: true, structuredData: {} },
      targetYearPlan: read('https://a.go.th/plan', { targetYear: 2570, projects: [] })
    }
  });
  assert.equal(result.status, 'blocked-unverified-document-content');
  assert.ok(result.rejected.length >= 2);
});

test('verified read documents become official actual-revenue and plan evidence with content provenance', () => {
  const result = ingestVerifiedBudgetDocumentContent({
    evidence: [source('latestRevenueActualsSource', 'https://a.go.th/revenue'), source('targetYearPlanSource', 'https://a.go.th/plan')],
    readDocuments: {
      latestRevenueActuals: read('https://a.go.th/revenue', { total: 100, rows: [{ item: 'tax', amount: 100 }] }),
      targetYearPlan: read('https://a.go.th/plan', { targetYear: 2570, projects: ['P1'] })
    }
  });
  assert.equal(result.status, 'ready');
  assert.equal(result.failClosed, false);
  assert.deepEqual(result.acceptedKeys, ['latestRevenueActuals', 'targetYearPlan']);
  assert.ok(result.evidence.every(item => item.provenance.contentReadAndVerified === true));
  assert.ok(result.evidence.every(item => item.provenance.contentHash === 'sha256:test'));
});

test('budget runtime merges verified document content after targeted source search but still blocks artifacts without internal budget inputs', async () => {
  const connector = { search: async query => query.includes('รายรับจริง') ? liveSearch(query, 'https://a.go.th/revenue') : query.includes('แผนพัฒนาท้องถิ่น') ? liveSearch(query, 'https://a.go.th/plan') : liveSearch(query, 'https://a.go.th/rule') };
  const result = await executeBudgetOfficialSourceSearch({
    query: 'ทำร่างงบปี 70 อบจ.พะเยา',
    workflowView: { workflowIds: ['gov.budget-draft'] },
    connector,
    readDocuments: {
      latestRevenueActuals: read('https://a.go.th/revenue', { total: 100 }),
      targetYearPlan: read('https://a.go.th/plan', { targetYear: 2570, projects: ['P1'] })
    }
  });
  assert.equal(result.documentIngestion.status, 'ready');
  assert.ok(result.evidence.some(item => item.key === 'latestRevenueActuals'));
  assert.ok(result.evidence.some(item => item.key === 'targetYearPlan'));
  assert.equal(result.artifactAttempt.status, 'blocked-missing-evidence');
  assert.ok(result.artifactAttempt.missingEvidence.includes('baselineBudget'));
  assert.ok(result.artifactAttempt.missingEvidence.includes('personnelObligations'));
  assert.ok(result.artifactAttempt.missingEvidence.includes('budgetTotals'));
});