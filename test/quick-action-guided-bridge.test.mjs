import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bridge = readFileSync('assets/js/ui/quick-action-guided-bridge-v1.js', 'utf8');
const index = readFileSync('index.html', 'utf8');
const homeCss = readFileSync('assets/css/home-v3.css', 'utf8');
const buildScript = readFileSync('scripts/build-static.mjs', 'utf8');
const serviceWorker = readFileSync('service-worker.js', 'utf8');

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

test('collapsed catalog groups stay hidden and published CSS and service worker versions stay cache-aligned', () => {
  assert.match(bridge, /\.work-catalog-tasks\[hidden\]\{display:none!important\}/);
  assert.match(homeCss, /html body\.app-shell \.quick-actions \.work-catalog-home \.work-catalog-tasks:not\(\[hidden\]\)\s*\{\s*display:grid!important;/);

  const indexBridgeVersion = index.match(/quick-action-guided-bridge-v1\.js\?v=([^"'&]+)/)?.[1];
  const buildBridgeVersion = buildScript.match(/quickActionBridge:\s*"([^"]+)"/)?.[1];
  assert.ok(indexBridgeVersion, 'production HTML must version the bridge asset');
  assert.equal(buildBridgeVersion, indexBridgeVersion, 'static build must preserve the bridge asset version');

  const indexCssVersion = index.match(/home-v3\.css\?v=([^"'&]+)/)?.[1];
  const buildCssVersion = buildScript.match(/homeCss:\s*"([^"]+)"/)?.[1];
  const precachedCssVersion = serviceWorker.match(/home-v3\.css\?v=([^"'&]+)/)?.[1];
  assert.ok(indexCssVersion, 'production HTML must version the catalog CSS');
  assert.equal(buildCssVersion, indexCssVersion, 'static build must preserve the catalog CSS cache-buster');
  assert.equal(precachedCssVersion, indexCssVersion, 'service worker must precache the versioned catalog CSS');

  const indexWorkerVersion = index.match(/service-worker\.js\?v=([^"'&]+)/)?.[1];
  const buildWorkerVersion = buildScript.match(/serviceWorker:\s*"([^"]+)"/)?.[1];
  const workerCacheVersion = serviceWorker.match(/const APP_VERSION = '([^']+)'/)?.[1];
  assert.ok(indexWorkerVersion, 'production HTML must version the service worker');
  assert.equal(buildWorkerVersion, indexWorkerVersion, 'static build must preserve the service worker cache-buster');
  assert.equal(workerCacheVersion, indexWorkerVersion, 'service worker cache name must change with its release version');
});
