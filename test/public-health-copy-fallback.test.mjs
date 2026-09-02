import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const page = await readFile('gp008.html', 'utf8');
const toolkit = await readFile('assets/js/features/public-health-worker-toolkit-v1.js', 'utf8');

test('GP008 copy falls back when Clipboard API is unavailable or rejected', () => {
  assert.match(page, /navigator\.clipboard\?\.writeText/);
  assert.match(page, /document\.execCommand\('copy'\)/);
  assert.match(page, /setSelectionRange\(0, area\.value\.length\)/);
  assert.match(page, /const ok = await copyPromptText\(text\)/);
  assert.match(page, /คัดลอกอัตโนมัติไม่ได้/);
});

test('public-health toolkit copy actions use the resilient fallback and report failure', () => {
  assert.match(toolkit, /navigator\.clipboard\?\.writeText/);
  assert.match(toolkit, /document\.execCommand\('copy'\)/);
  assert.match(toolkit, /setSelectionRange\(0, area\.value\.length\)/);
  assert.match(toolkit, /const ok = await copyText\(prompt \|\| build\(\)\)/);
  assert.match(toolkit, /คัดลอกอัตโนมัติไม่ได้/);
});

test('GP008 cache-busts the public-health toolkit fix', () => {
  assert.match(page, /public-health-worker-toolkit-v1\.js\?v=1\.0\.3/);
});
