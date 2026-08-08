import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const endpoint = process.env.GOVPROMPT_SEARCH_ENDPOINT
  || 'https://ai-local-government-assistant.sayampreecha.workers.dev/api/official-search';
const sandbox = { window: {}, URL, Date, Intl, console, fetch, globalThis: {} };
for (const file of [
  'assets/js/core/source-intelligence.js',
  'assets/js/core/freshness-engine.js',
  'assets/js/core/official-source-registry.js',
  'assets/js/core/citation-engine.js',
  'assets/js/core/official-search-connector.js'
]) vm.runInNewContext(await readFile(file, 'utf8'), sandbox);

const connector = sandbox.window.GovPromptCore.createOfficialSearchConnector({ endpoint, fetcher: fetch });
const queries = [
  'รถเสียเบิกค่าซ่อมได้ไหม',
  'เบิกค่าเครื่องบิน',
  'เงินบำรุงซื้อของได้ไหม',
  'ตรวจ TOR ถนน'
];
const report = [];
for (const query of queries) {
  const startedAt = Date.now();
  const result = await connector.search(query, { limitSources: 6, count: 10 });
  const officialResults = result.results.filter(item => item.official);
  assert.equal(result.mode, 'live', `${query}: ${result.errorCode || result.warning || 'not live'}`);
  assert.ok(officialResults.length > 0, `${query}: frontend mapping returned zero official results`);
  assert.ok(result.evidence.primaryResults.length > 0, `${query}: relevance mapping removed every official result`);
  report.push({
    query,
    mode: result.mode,
    provider: result.provider,
    officialResultCount: officialResults.length,
    evidenceResultCount: result.evidence.primaryResults.length,
    latencyMs: Date.now() - startedAt,
    topHost: (() => { try { return new URL(officialResults[0].sourceUrl).hostname; } catch { return ''; } })()
  });
}

console.log(JSON.stringify({ endpoint, passed: report.length, total: queries.length, report }, null, 2));
