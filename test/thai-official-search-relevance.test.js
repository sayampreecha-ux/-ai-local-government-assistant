import assert from 'node:assert/strict';
import test from 'node:test';
import { runThaiRelevanceBenchmark } from '../scripts/benchmark-thai-relevance.mjs';

test('Thai official-search relevance benchmark validates 108 queries as user-AI handoff plans', async () => {
  const report = await runThaiRelevanceBenchmark();
  assert.equal(report.total, 108);
  assert.equal(report.after.failed, 0, JSON.stringify(report.failures));
  assert.equal(report.vehicleRepairPrimaryResults, 0);
  for (const item of report.caseResults) {
    assert.equal(item.userAiOnly, true);
    assert.equal(item.liveSearchRequired, false);
    assert.equal(item.afterEligible, true);
  }
});
