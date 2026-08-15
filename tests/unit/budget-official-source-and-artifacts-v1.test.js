import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBudgetOfficialEvidenceFromSearchMap
} from '../../src/budget-official-evidence-adapter.js';
import {
  buildBudgetDeliverableArtifacts
} from '../../src/budget-artifact-factory.js';
import {
  buildBudgetOfficialSearchQueries,
  executeBudgetOfficialSourceSearch,
  parseBudgetYear
} from '../../assets/js/core/budget-official-source-runtime-v1.js';

const AT = '2026-08-15T11:00:00.000Z';
const ev = (key, value, extra = {}) => ({ key, value, ...extra });

function liveSearch(title, url, extra = {}) {
  return {
    mode: 'live',
    searchedAt: AT,
    provider: 'test-provider',
    plan: { originalQuery: title },
    evidence: {
      conclusionEligible: true,
      verifiedCurrent: true,
      primaryResults: [{
        official: true,
        title,
        documentTitle: title,
        sourceUrl: url,
        sourceName: 'หน่วยงานราชการ',
        documentDate: '2026-08-01',
        status: 'current',
        ...extra
      }]
    }
  };
}

test('budget official search queries extract Thai budget year and keep three source purposes distinct', () => {
  assert.equal(parseBudgetYear('ทำร่างงบปี 70 อบจ.พะเยา'), 2570);
  const queries = buildBudgetOfficialSearchQueries('ทำร่างงบปี 70 อบจ.พะเยา');
  assert.match(queries.currentBudgetRule, /2570/);
  assert.match(queries.latestRevenueActualsSource, /รายรับจริง/);
  assert.match(queries.targetYearPlanSource, /แผนพัฒนาท้องถิ่น/);
});

test('search adapter accepts only live current official evidence and never converts search metadata into actual revenue or plan data', () => {
  const result = buildBudgetOfficialEvidenceFromSearchMap({
    currentBudgetRule: liveSearch('หลักเกณฑ์งบประมาณล่าสุด', 'https://example.go.th/rule'),
    latestRevenueActualsSource: liveSearch('รายงานรายรับ', 'https://example.go.th/revenue'),
    targetYearPlanSource: liveSearch('แผนพัฒนาท้องถิ่น', 'https://example.go.th/plan')
  });

  assert.equal(result.status, 'ready');
  const keys = result.evidence.map((item) => item.key);
  assert.ok(keys.includes('currentBudgetRule'));
  assert.ok(keys.includes('latestRevenueActualsSource'));
  assert.ok(keys.includes('targetYearPlanSource'));
  assert.ok(keys.includes('budgetSourceRegister'));
  assert.ok(!keys.includes('latestRevenueActuals'));
  assert.ok(!keys.includes('targetYearPlan'));
  assert.equal(result.governance.searchMetadataDoesNotEqualDocumentContent, true);
});

test('search adapter fails closed when freshness/current verification is missing', () => {
  const stale = liveSearch('หลักเกณฑ์งบประมาณ', 'https://example.go.th/rule');
  stale.evidence.verifiedCurrent = false;
  stale.evidence.conclusionEligible = false;
  const result = buildBudgetOfficialEvidenceFromSearchMap({ currentBudgetRule: stale });
  assert.equal(result.failClosed, true);
  assert.equal(result.status, 'blocked-no-verified-official-evidence');
  assert.deepEqual(result.evidence, []);
});

test('budget source runtime is inactive for non-budget workflow and does not call connector', async () => {
  let calls = 0;
  const connector = { search: async () => { calls += 1; return liveSearch('x', 'https://example.go.th/x'); } };
  const result = await executeBudgetOfficialSourceSearch({
    query: 'ร่างหนังสือราชการ',
    workflowView: { workflowIds: ['gov.correspondence'] },
    connector
  });
  assert.equal(result.status, 'inactive');
  assert.equal(calls, 0);
});

test('budget source runtime executes three targeted official searches and then stops at unread-document gate', async () => {
  const calls = [];
  const connector = {
    search: async (query, options) => {
      calls.push({ query, options });
      return liveSearch(query, `https://example.go.th/${calls.length}`);
    }
  };
  const result = await executeBudgetOfficialSourceSearch({
    query: 'ทำร่างงบปี 70 อบจ.พะเยา',
    workflowView: { workflowIds: ['gov.budget-draft'] },
    connector
  });
  assert.equal(calls.length, 3);
  assert.ok(calls.every((item) => item.options.requireFreshness === true));
  assert.equal(result.status, 'blocked-unverified-document-content');
  assert.ok(result.evidence.some((item) => item.key === 'budgetSourceRegister'));
  assert.equal(result.documentIngestion.failClosed, true);
  assert.deepEqual(result.documentIngestion.missingKeys, ['latestRevenueActuals', 'targetYearPlan']);
  assert.equal(result.artifactAttempt.status, 'blocked-missing-evidence');
  assert.equal(result.failClosed, true);
});

test('artifact factory blocks when required internal budget evidence is incomplete', () => {
  const result = buildBudgetDeliverableArtifacts({
    evidence: [ev('budgetSourceRegister', [])],
    generatedAt: AT
  });
  assert.equal(result.status, 'blocked-missing-evidence');
  assert.equal(result.failClosed, true);
  assert.ok(result.missingEvidence.includes('baselineBudget'));
  assert.ok(result.missingEvidence.includes('latestRevenueActuals'));
  assert.ok(result.missingEvidence.includes('targetYearPlan'));
});

test('artifact factory blocks unbalanced budget before creating any deliverable', () => {
  const evidence = [
    ev('baselineBudget', { total: 100 }),
    ev('latestRevenueActuals', { total: 100 }),
    ev('targetYearPlan', { targetYear: 2570, projects: ['P1'] }),
    ev('personnelObligations', { total: 20 }),
    ev('budgetTotals', { revenueTotal: 100, expenseTotal: 90 }),
    ev('budgetSourceRegister', [{ evidenceKey: 'currentBudgetRule', sourceUrl: 'https://example.go.th/rule', documentTitle: 'หลักเกณฑ์งบประมาณ' }])
  ];
  const result = buildBudgetDeliverableArtifacts({ evidence, generatedAt: AT });
  assert.equal(result.status, 'blocked-unbalanced-budget');
  assert.equal(result.artifacts.length, 0);
  assert.equal(result.failClosed, true);
});

test('artifact factory creates contract-valid draft and structured export only after evidence and balance pass', () => {
  const evidence = [
    ev('baselineBudget', { total: 100 }),
    ev('latestRevenueActuals', { total: 100 }),
    ev('targetYearPlan', { targetYear: 2570, projects: ['P1'] }),
    ev('personnelObligations', { total: 20 }),
    ev('budgetTotals', {
      revenueItems: [{ key: 'R1', amount: 100, status: 'verified' }],
      expenseItems: [{ key: 'E1', amount: 100, status: 'verified' }]
    }),
    ev('budgetSourceRegister', [{
      evidenceKey: 'currentBudgetRule',
      sourceUrl: 'https://example.go.th/rule',
      documentTitle: 'หลักเกณฑ์งบประมาณ',
      sourceName: 'หน่วยงานราชการ',
      documentDate: '2026-08-01'
    }]),
    ev('organizationContext', { organizationName: 'อบจ.พะเยา' }),
    ev('targetBudgetYear', 2570)
  ];
  const result = buildBudgetDeliverableArtifacts({ evidence, generatedAt: AT });
  assert.equal(result.status, 'ready');
  assert.equal(result.failClosed, false);
  assert.deepEqual(result.artifacts.map((item) => item.key), ['budget-draft', 'budget-structured-export']);
  assert.ok(result.artifacts.every((item) => item.status === 'ready'));
  assert.ok(result.artifacts.every((item) => item.provenance.sourceEvidenceKeys.includes('budgetSourceRegister')));
  assert.match(result.artifacts[0].content.body, /ยังไม่ใช่การอนุมัติงบประมาณโดย AI/);
  assert.deepEqual(result.artifacts[1].content.sourceEvidenceKeys, [
    'baselineBudget',
    'latestRevenueActuals',
    'targetYearPlan',
    'personnelObligations',
    'budgetTotals',
    'budgetSourceRegister'
  ]);
});