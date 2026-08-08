import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { THAI_OFFICIAL_SEARCH_CASES } from '../test/fixtures/thai-official-search-cases.js';

const PRIMARY_THRESHOLD = 0.24;
const LEGACY_STOP_TERMS = new Set(['ช่วย','หน่อย','เรื่อง','เกี่ยวกับ','อย่างไร','ยังไง','ไหม','หรือไม่','ได้ไหม','ทำ','การ','และ','ของ','ให้','ใน','ที่','จาก','เป็น']);

function normalize(value) {
  return String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('th');
}

function legacyTerms(query) {
  const raw = normalize(query).match(/[\p{L}\p{N}.]+/gu) || [];
  return [...new Set(raw.filter(term => term.length > 1 && !LEGACY_STOP_TERMS.has(term)))];
}

function legacyRelevance(testCase) {
  const terms = legacyTerms(testCase.query);
  const title = normalize(testCase.evidence);
  const matched = terms.filter(term => title.includes(term));
  const coverage = matched.length / Math.max(1, terms.length);
  const exactPhrase = title.includes(normalize(testCase.query)) ? 1 : 0;
  const metadataCompleteness = 1 / 3;
  return Math.min(1, coverage * 0.52 + coverage * 0.23 + exactPhrase * 0.15 + metadataCompleteness * 0.10);
}

async function loadCore(fetcher) {
  const sandbox = { window: {}, URL, Date, Intl, console, fetch: fetcher, globalThis: {} };
  for (const file of [
    'assets/js/core/source-intelligence.js',
    'assets/js/core/freshness-engine.js',
    'assets/js/core/official-source-registry.js',
    'assets/js/core/citation-engine.js',
    'assets/js/core/official-search-connector.js'
  ]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);
  return sandbox.window.GovPromptCore;
}

export async function runThaiRelevanceBenchmark() {
  const casesByQuery = new Map(THAI_OFFICIAL_SEARCH_CASES.map(item => [item.query, item]));
  const fetcher = async (_url, request) => {
    const { originalQuery } = JSON.parse(request.body);
    const item = casesByQuery.get(originalQuery);
    assert.ok(item, `missing fixture for ${originalQuery}`);
    return Response.json({
      ok: true,
      provider: 'tavily',
      searchedAt: '2026-08-09T00:00:00.000Z',
      results: [
        {
          title: item.evidence,
          url: `https://www.${item.host}/official/${item.id}`,
          snippet: item.evidence,
          sourceTier: 'primary'
        },
        {
          title: `${item.evidence} ฉบับสรุป`,
          url: `https://example.com/secondary/${item.id}`,
          snippet: item.evidence,
          sourceTier: 'secondary'
        }
      ]
    });
  };
  const core = await loadCore(fetcher);
  const connector = core.createOfficialSearchConnector({ fetcher });
  const categories = {};
  const failures = [];
  const caseResults = [];
  let beforePassed = 0;
  let afterPassed = 0;

  for (const item of THAI_OFFICIAL_SEARCH_CASES) {
    const beforeEligible = legacyRelevance(item) >= PRIMARY_THRESHOLD;
    if (beforeEligible) beforePassed += 1;

    const result = await connector.search(item.query, { count: 5, limitSources: 6 });
    const primary = result.evidence.primaryResults;
    const afterEligible = primary.length > 0;
    if (afterEligible) afterPassed += 1;
    else failures.push({ id: item.id, category: item.category, query: item.query });
    caseResults.push(Object.freeze({
      id: item.id,
      category: item.category,
      query: item.query,
      beforeEligible,
      afterEligible,
      primaryResults: primary.length,
      primaryOnly: primary.every(hit => hit.official && hit.sourceTier === 'primary')
    }));

    assert.equal(result.mode, 'live', item.query);
    assert.equal(result.results.length, 2, `${item.query}: response mapping lost provider results`);
    assert.equal(primary.every(hit => hit.official && hit.sourceTier === 'primary'), true, `${item.query}: non-primary evidence admitted`);
    assert.equal(primary.some(hit => new URL(hit.sourceUrl).hostname.endsWith(item.host)), afterEligible, `${item.query}: wrong primary host`);

    const bucket = categories[item.category] ||= { total: 0, beforePassed: 0, afterPassed: 0 };
    bucket.total += 1;
    bucket.beforePassed += Number(beforeEligible);
    bucket.afterPassed += Number(afterEligible);
  }

  const vehicleRepair = THAI_OFFICIAL_SEARCH_CASES.find(item => item.query === 'รถเสียเบิกค่าซ่อมได้ไหม');
  const vehicleResult = await connector.search(vehicleRepair.query, { count: 5, limitSources: 6 });
  assert.ok(vehicleResult.evidence.primaryResults.length > 0, 'รถเสียเบิกค่าซ่อมได้ไหม: primaryResults must not be zero');

  return {
    total: THAI_OFFICIAL_SEARCH_CASES.length,
    before: { passed: beforePassed, failed: THAI_OFFICIAL_SEARCH_CASES.length - beforePassed },
    after: { passed: afterPassed, failed: THAI_OFFICIAL_SEARCH_CASES.length - afterPassed },
    categories,
    vehicleRepairPrimaryResults: vehicleResult.evidence.primaryResults.length,
    failures,
    caseResults
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await runThaiRelevanceBenchmark();
  assert.equal(report.total >= 100, true);
  assert.equal(report.after.failed, 0, JSON.stringify(report.failures));
  console.log(JSON.stringify({ ...report, caseResults: undefined }, null, 2));
}
