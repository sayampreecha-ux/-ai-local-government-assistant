import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const guardPath = 'assets/js/core/official-search-timeout-guard-v1.js';
const guard = await readFile(guardPath, 'utf8');
const build = await readFile('scripts/build-static.mjs', 'utf8');

test('official-search timeout guard is syntactically valid and fail-closed', () => {
  const checked = spawnSync(process.execPath, ['--check', guardPath], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  assert.match(guard, /CLIENT_TIMEOUT_MS = 7_000/);
  assert.match(guard, /Promise\.race/);
  assert.match(guard, /SEARCH_CLIENT_TIMEOUT/);
  assert.match(guard, /mode: 'plan-only'/);
  assert.match(guard, /conclusionEligible: false/);
});

test('production build loads timeout guard after outcome-first search policy', () => {
  assert.match(build, /outcome-first-search-policy\.js\?v=1\.0\.0/);
  assert.match(build, /official-search-timeout-guard-v1\.js/);
  assert.match(build, /searchTimeoutGuard: "1\.1\.0"/);
  assert.match(build, /Outcome-first search policy marker not found/);
});
