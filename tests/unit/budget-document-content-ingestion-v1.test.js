import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestVerifiedBudgetDocumentContent } from '../../src/budget-document-content-ingestion.js';
import { executeBudgetOfficialSourceSearch } from '../../assets/js/core/budget-official-source-runtime-v1.js';

const AT = '2026-08-15T11:30:00.000Z';
const source = (key, url) => ({ key, value: { sourceUrl:url, documentTitle:key }, official:true, verified:true, fresh:true, current:true });
const read = (url, structuredData) => ({ sourceUrl:url, resolvedUrl:url, contentHash:'sha256:test', readAt:AT, reader:'trusted-reader-v1', contentReadAndVerified:true, official:true, current:true, fresh:true, structuredData });
const sources = () => [source('baselineBudgetSource','https://a.go.th/baseline'), source('latestRevenueActualsSource','https://a.go.th/revenue'), source('targetYearPlanSource','https://a.go.th/plan'), { key:'budgetSourceRegister', value:[
  { evidenceKey:'baselineBudgetSource', sourceUrl:'https://a.go.th/baseline' }, { evidenceKey:'latestRevenueActualsSource', sourceUrl:'https://a.go.th/revenue' }, { evidenceKey:'targetYearPlanSource', sourceUrl:'https://a.go.th/plan' }
], verified:true }];
function documents() { return {
  baselineBudget: read('https://a.go.th/baseline', { fiscalYear:2569, total:1000, revenueItems:[{key:'r1',amount:1000}], expenseItems:[{key:'personnel',label:'งบบุคลากร',amount:600},{key:'investment',label:'งบลงทุน',amount:400}] }),
  latestRevenueActuals: read('https://a.go.th/revenue', { total:800, rows:[{item:'tax',amount:800}] }),
  targetYearPlan: read('https://a.go.th/plan', { targetYear:2570, projects:[{id:'P1',name:'ปรับปรุงถนน',amount:100}] })
}; }
function liveSearch(title,url) { return { mode:'live', provider:'test', evidence:{ conclusionEligible:true, verifiedCurrent:true, primaryResults:[{ official:true,title,documentTitle:title,sourceUrl:url,sourceName:'ราชการ',documentDate:'2026-08-01',status:'current' }] } }; }

test('document ingestion rejects content whose URL does not match source pointer', () => {
  const docs = documents(); docs.latestRevenueActuals = read('https://evil.example/revenue', { total:100 });
  const result = ingestVerifiedBudgetDocumentContent({ evidence:sources(), readDocuments:docs });
  assert.equal(result.failClosed,true);
  assert.ok(result.rejected.find(item => item.targetKey === 'latestRevenueActuals')?.errors.includes('sourceUrl:must-match-source-pointer'));
});

test('document ingestion rejects unread unhashed stale or unstructured content', () => {
  const docs = documents();
  docs.latestRevenueActuals = { sourceUrl:'https://a.go.th/revenue', official:true,current:true,fresh:true,structuredData:{} };
  docs.targetYearPlan = read('https://a.go.th/plan', { targetYear:2570,projects:[] });
  const result = ingestVerifiedBudgetDocumentContent({ evidence:sources(), readDocuments:docs });
  assert.equal(result.failClosed,true); assert.ok(result.rejected.length >= 2);
});

test('verified baseline revenue and plan documents become official content evidence with hashes and source register refresh', () => {
  const result = ingestVerifiedBudgetDocumentContent({ evidence:sources(), readDocuments:documents() });
  assert.equal(result.status,'ready'); assert.equal(result.failClosed,false);
  assert.deepEqual(result.acceptedKeys,['baselineBudget','latestRevenueActuals','targetYearPlan']);
  const contentEvidence = result.evidence.filter(item => result.acceptedKeys.includes(item.key));
  assert.ok(contentEvidence.every(item => item.provenance.contentReadAndVerified === true));
  assert.ok(contentEvidence.every(item => item.provenance.contentHash === 'sha256:test'));
  const register = result.evidence.find(item => item.key === 'budgetSourceRegister');
  assert.ok(register.value.every(row => row.contentReadAndVerified === true));
});

test('budget runtime uses read official baseline revenue plan then derives internal working draft and artifacts', async () => {
  const connector = { search: async query => query.includes('ข้อบัญญัติ') ? liveSearch(query,'https://a.go.th/baseline') : query.includes('รายรับจริง') ? liveSearch(query,'https://a.go.th/revenue') : query.includes('แผนพัฒนาท้องถิ่น') ? liveSearch(query,'https://a.go.th/plan') : liveSearch(query,'https://a.go.th/rule') };
  const result = await executeBudgetOfficialSourceSearch({ query:'ทำร่างงบปี 70 อบจ.พะเยา', workflowView:{workflowIds:['gov.budget-draft']}, connector, readDocuments:documents() });
  assert.equal(result.documentIngestion.status,'ready');
  for (const key of ['baselineBudget','latestRevenueActuals','targetYearPlan','personnelObligations','budgetTotals']) assert.ok(result.evidence.some(item => item.key === key));
  assert.equal(result.artifactAttempt.status,'ready');
  assert.equal(result.artifactAttempt.balance.difference,0);
});
