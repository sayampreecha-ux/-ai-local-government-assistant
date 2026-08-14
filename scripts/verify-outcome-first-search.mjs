import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const requests = [];
const fetcher = async (_url, options = {}) => {
  requests.push(JSON.parse(options.body || '{}'));
  return {
    ok: true,
    async json() {
      return {
        provider: 'test',
        searchedAt: '2026-08-14T00:00:00Z',
        results: [
          {
            title: 'มาตรฐานกำหนดตำแหน่งและหลักเกณฑ์การเลื่อนระดับข้าราชการส่วนท้องถิ่น',
            snippet: 'กำหนดคุณสมบัติ ระยะเวลาดำรงตำแหน่ง การสอบคัดเลือก และการเลื่อนตำแหน่งตามหลักเกณฑ์บริหารงานบุคคลท้องถิ่น',
            url: 'https://www.dla.go.th/work/personnel/career-standard.pdf',
            documentNumber: 'ทดสอบ 1/2569',
            documentDate: '2026-01-10',
            effectiveDate: '2026-01-10',
            status: 'effective'
          },
          {
            title: 'ข่าวประชาสัมพันธ์การประชุมผู้บริหารท้องถิ่น',
            snippet: 'กิจกรรมประชุมและข่าวประชาสัมพันธ์ทั่วไป',
            url: 'https://www.dla.go.th/news/general.html',
            documentDate: '2026-08-01',
            status: 'effective'
          }
        ]
      };
    }
  };
};

const sandbox = { window: {}, URL, Date, console, fetch: fetcher, globalThis: {} };
for (const file of [
  'assets/js/core/shared-context.js',
  'assets/js/core/prompt-registry.js',
  'assets/js/core/transaction-router.js',
  'assets/js/core/router-regression-overrides.js',
  'assets/js/core/hybrid-intent-classifier.js',
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js',
  'assets/js/core/outcome-first-search-policy.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const core = sandbox.window.GovPromptCore;
const query = 'ปลัดต้นกี่ปีถึงจะเป็นปลัดกลางได้';
const plan = core.createOfficialSearchPlan(query, { limitSources: 6 });

assert.equal(plan.routedModulesAdvisory, true);
assert.equal(plan.policy.outcomeFirst, true);
assert.equal(plan.policy.answerFitGate, true);
assert.ok(plan.userGoals.includes('career-progression'));
assert.ok(plan.userGoals.includes('duration-deadline'));
assert.match(plan.outcomeQuery, /มาตรฐานกำหนดตำแหน่ง/);
assert.match(plan.outcomeQuery, /ระยะเวลาดำรงตำแหน่ง/);

const goals = core.detectOfficialSearchUserGoals(query);
const relevant = {
  title: 'หลักเกณฑ์การเลื่อนระดับและมาตรฐานกำหนดตำแหน่ง',
  snippet: 'คุณสมบัติและระยะเวลาดำรงตำแหน่งก่อนสอบคัดเลือก',
  queryRelevance: 0.7,
  official: true,
  sourcePriority: 100
};
const unrelated = {
  title: 'ข่าวประชุมผู้บริหาร',
  snippet: 'ข่าวกิจกรรมทั่วไป',
  queryRelevance: 0.7,
  official: true,
  sourcePriority: 100
};
assert.ok(core.scoreOfficialSearchAnswerFit(relevant, query, goals) > core.scoreOfficialSearchAnswerFit(unrelated, query, goals));
const reranked = core.rankOfficialSearchResultsForOutcome([unrelated, relevant], query, goals);
assert.equal(reranked[0].title, relevant.title);

const live = await core.officialSearchConnector.search(query, { count: 5 });
assert.equal(live.mode, 'live');
assert.ok(requests.length >= 1);
assert.match(requests[0].query, /มาตรฐานกำหนดตำแหน่ง/);
assert.equal(live.plan.originalQuery, query);
assert.equal(live.plan.routedModulesAdvisory, true);
assert.ok(live.evidence.answerFitScore >= 0.45);
assert.equal(live.evidence.answerFitEligible, true);
assert.ok(live.results[0].answerFit > live.results[1].answerFit);

const taskCases = [
  ['เบิกค่าแท็กซี่ได้ไหม', 'eligibility-decision'],
  ['ต้องยื่นเอกสารภายในกี่วัน', 'duration-deadline'],
  ['ใครมีอำนาจอนุมัติเรื่องนี้', 'authority'],
  ['ขั้นตอนจัดทำสัญญาต้องทำอย่างไร', 'procedure-documents'],
  ['ค่าอาหารประชุมเบิกได้เท่าไร', 'amount-rate'],
  ['TOR แบบนี้เสี่ยงล็อกสเปกไหม', 'compliance-risk'],
  ['ระเบียบนี้ยังใช้ปัจจุบันไหม', 'current-status']
];
for (const [text, expectedGoal] of taskCases) {
  const ids = core.detectOfficialSearchUserGoals(text).map(item => item.id);
  assert.ok(ids.includes(expectedGoal), `${text} should detect ${expectedGoal}`);
}

console.log('GovPrompt Outcome-First Search verification passed: user goal -> evidence query -> answer-fit ranking/gate; GP route is advisory.');
