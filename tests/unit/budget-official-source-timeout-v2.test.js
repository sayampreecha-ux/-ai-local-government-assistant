import test from 'node:test';
import assert from 'node:assert/strict';
import {
  settleWithin,
  BUDGET_OFFICIAL_SOURCE_TIMEOUT_MS,
  BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION
} from '../../assets/js/core/budget-official-source-runtime-v1.js';

test('Budget official source runtime exposes bounded external-call governance', () => {
  assert.equal(BUDGET_OFFICIAL_SOURCE_RUNTIME_VERSION, '2.1');
  assert.equal(BUDGET_OFFICIAL_SOURCE_TIMEOUT_MS, 15_000);
});

test('settleWithin returns successful external result before deadline', async () => {
  const value = await settleWithin(async () => ({ ok: true }), 50);
  assert.deepEqual(value, { ok: true });
});

test('settleWithin fails closed to null when external work stalls', async () => {
  const started = Date.now();
  const value = await settleWithin(() => new Promise(() => {}), 15);
  assert.equal(value, null);
  assert.ok(Date.now() - started < 500, 'timeout helper should not hang unit tests');
});

test('settleWithin fails closed to null when external work throws', async () => {
  const value = await settleWithin(async () => { throw new Error('provider failed'); }, 50);
  assert.equal(value, null);
});
