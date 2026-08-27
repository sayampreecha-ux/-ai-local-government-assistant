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
  const bridgeIndex = index.indexOf('quick-action-guided-bridge-v1.js?v=1.0.0');
  const homeIndex = index.indexOf('home-v3.js?v=6.2.0');
  assert.ok(bridgeIndex >= 0, 'bridge script must be loaded');
  assert.ok(homeIndex >= 0, 'home script must be loaded');
  assert.ok(bridgeIndex < homeIndex, 'bridge must load before home-v3');
});
