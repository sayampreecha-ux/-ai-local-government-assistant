import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const home = await readFile('assets/js/home-v3.js', 'utf8');
const status = await readFile('assets/js/ui/status-copy.js', 'utf8');
const index = await readFile('index.html', 'utf8');

test('copy fallback is iOS-safe and only reports success after an actual copy path', () => {
  for (const source of [home, status]) {
    assert.match(source, /navigator\.clipboard\?\.writeText/);
    assert.match(source, /setSelectionRange\(0, textarea\.value\.length\)/);
    assert.match(source, /fontSize: '16px'/);
    assert.match(source, /document\.execCommand\('copy'\)/);
    assert.match(source, /return legacyCopyText\(value\)/);
  }
});

test('ChatGPT and Gemini handoff preserves the synchronous user gesture before awaiting clipboard', () => {
  assert.match(status, /window\.open\('about:blank', '_blank'\)/);
  const popupIndex = status.indexOf("window.open('about:blank', '_blank')");
  const awaitCopyIndex = status.indexOf('const copied = await copyText(handoff.safeText)');
  assert.ok(popupIndex >= 0 && awaitCopyIndex > popupIndex, 'destination window must open before async clipboard work');
  assert.match(status, /destinationWindow\.location\.replace\(destinationUrl\)/);
  assert.match(status, /destinationWindow\?\.close\?\.\(\)/);
});

test('production HTML cache-busts the status copy fix', () => {
  assert.match(index, /assets\/js\/ui\/status-copy\.js\?v=1\.4\.2/);
});
