import assert from 'node:assert/strict';
import test from 'node:test';
import { THAI_OFFICIAL_SEARCH_CASES } from './fixtures/thai-official-search-cases.js';
import { runThaiRelevanceBenchmark } from '../scripts/benchmark-thai-relevance.mjs';

const report = await runThaiRelevanceBenchmark();

test('Thai official-search benchmark contains at least 100 real-language cases across all required domains', () => {
  assert.ok(THAI_OFFICIAL_SEARCH_CASES.length >= 100);
  const required = ['การเงิน','พัสดุ','บุคคล','สารบรรณ','กฎหมาย','สภา','สาธารณสุข','งานช่าง','PR'];
  for (const category of required) {
    assert.ok(THAI_OFFICIAL_SEARCH_CASES.filter(item => item.category === category).length >= 10, category);
  }
});

for (const item of report.caseResults) {
  test(`Thai relevance ${item.id}/108 [${item.category}] ${item.query}`, () => {
    assert.equal(item.afterEligible, true);
    assert.ok(item.primaryResults > 0);
    assert.equal(item.primaryOnly, true);
  });
}

test('legacy failure is reproduced and vehicle-repair query retains primary evidence', () => {
  assert.ok(report.before.failed > 0, 'benchmark must reproduce the legacy failure');
  assert.equal(report.after.failed, 0);
  assert.ok(report.vehicleRepairPrimaryResults > 0);
});
