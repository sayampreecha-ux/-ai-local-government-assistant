import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bridge = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');
const index = readFileSync('index.html', 'utf8');

test('quick action buttons are rerouted through the form submit path', () => {
  assert.match(bridge, /\[data-prompt\]/);
  assert.match(bridge, /stopImmediatePropagation\(\)/);
  assert.match(bridge, /form\.requestSubmit\(\)/);
  assert.doesNotMatch(bridge, /submitPrompt\s*\(/);
});

test('production home loads quick action bridge before home-v3', () => {
  const bridge = index.match(/assets\/js\/ui\/quick-action-guided-bridge-v1\.js\?v=[^"']+/)?.[0];
  const home = index.match(/assets\/js\/home-v3\.js\?v=[^"']+/)?.[0];
  assert.ok(bridge, 'bridge script must be loaded');
  assert.ok(home, 'home script must be loaded');
  assert.match(bridge, /\?v=\d+\.\d+\.\d+$/);
  assert.match(home, /\?v=\d+\.\d+\.\d+$/);
  assert.ok(index.indexOf(bridge) < index.indexOf(home), 'bridge must load before home-v3');
});
