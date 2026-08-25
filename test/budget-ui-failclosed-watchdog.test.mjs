import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const file = 'assets/js/core/budget-ui-failclosed-watchdog-v1.js';
const source = await readFile(file, 'utf8');
const build = await readFile('scripts/build-static.mjs', 'utf8');

test('budget UI watchdog is syntactically valid and explicitly fail-closed', () => {
  const checked = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  assert.equal(checked.status, 0, checked.stderr || checked.stdout);
  assert.match(source, /WATCHDOG_VERSION = '1\.1\.0'/);
  assert.match(source, /WATCHDOG_MS = 10_000/);
  assert.match(source, /budget-runtime-result/);
  assert.match(source, /data-budget-watchdog-fallback/);
  assert.match(source, /blocked-runtime-timeout/);
  assert.match(source, /ยังไม่พร้อมส่งออก/);
  assert.match(source, /Fail-closed: true/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /\.message\.user \.message-body/);
  assert.match(source, /safeRenderedText/);
  assert.match(source, /Raw composer text is never read by this watchdog/);
  assert.doesNotMatch(source, /promptInput/);
  assert.doesNotMatch(source, /form\.addEventListener\('submit'/);
});

test('production build injects watchdog after Home and cache-busts it', () => {
  assert.match(build, /budgetUiWatchdog: "1\.1\.0"/);
  assert.match(build, /budget-ui-failclosed-watchdog-v1\.js/);
  assert.match(build, /normalizedHomeScript[\s\S]*budgetWatchdogScript/);
  assert.match(build, /Budget UI fail-closed watchdog missing/);
});
